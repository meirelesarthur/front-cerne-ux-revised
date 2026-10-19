// src/pages/Relatorios/Financeiro/ContasPagas/index.tsx
// -----------------------------------------------------------------------------
// Tela "Contas Pagas — Relatório" (F-291, TASK-050-291-FE-02, esteira
// 97-Esteiras/050). Rota `/relatorios/financeiro/contas-pagas`, materializa
// o item de menu FILHO `rel-fin-contas-pagas`, sob o grupo/submenu
// `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Irmã de `Relatorios/Financeiro/ContasAPagar/index.tsx` (F-262) — MESMO
// molde estrutural (FormContainer + footer, sem grid/prévia, download via
// Blob + `downloadBlob`, `parseBlobError` no catch, SEM `<Form formFilter>`
// — D-FE-14), mas NÃO é uma cópia ajustada: diverge de propósito em 4
// pontos —
//   1. Datas 1-2 filtram a DATA DA BAIXA (D-291-04), não o vencimento —
//      rótulo "Data da Baixa" vem de `paidExpenses.fields.startDate/endDate`.
//   2. SEM sentinela TRIBUTO — `PaidExpenseReportRequest.providers.*` exige
//      uuid de fornecedor real (closure `Str::isUuid`), diferente de F-262.
//   3. SEM campo Periodicidade — parâmetro inexistente nesta rota.
//   4. Ganha "Conta Bancária" (`SelectAsyncPaginate` sobre `listAccounts`,
//      LAC-FE-01 — não existe `/accounts/options`) e "Safra"
//      (`SelectAsyncPaginate` sobre `listHarvestOptions`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { ReportColumnsField } from '@/components/Form/ReportColumnsField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { expenseClassificationOptions } from '@/constants/financeiro/expense/options/classification-options';
import { queryKey } from '@/constants/query-key';
import {
  PAID_EXPENSE_REPORT_APPORTIONMENT_KEYS,
  PAID_EXPENSE_REPORT_DEFAULT_COLUMNS,
  paidExpenseReportColumnOptions,
} from '@/constants/Relatorios/accounts-reports/options/paid-expense-report-column-options';
import { paidExpenseReportOrderOptions } from '@/constants/Relatorios/accounts-reports/options/paid-expense-report-order-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { reportOrderDirectionOptions } from '@/constants/Relatorios/accounts-reports/options/report-order-direction-options';

import { paidExpenseReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/paid-expense-report-filter-schema';

import { downloadPaidExpenseReport } from '@/services/v2/AccountsReports/paid-expense-report-service';
import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { LanguageDate } from '@/@types/language';
import type {
  PaidExpenseReportFilterForm,
  PaidExpenseReportParams,
} from '@/@types/v2/AccountsReports';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { Harvest } from '@/@types/v2/Harvests';

function buildPristineValues(languageGB: LanguageDate): PaidExpenseReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    start_emission_date: null,
    end_emission_date: null,
    classification: null,
    providers: [],
    categories: [],
    proprietary_id: null,
    account_id: null,
    center_id: null,
    harvest_id: null,
    farm_id: null,
    columns: PAID_EXPENSE_REPORT_DEFAULT_COLUMNS,
    order: paidExpenseReportOrderOptions.getOption('date', languageGB),
    order_direction: reportOrderDirectionOptions.getOption('asc', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function ContasPagasRelatorio() {
  const { languageGB } = useLanguage();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.paidExpenses;

  const { control, handleSubmit, watch } = useForm<PaidExpenseReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: paidExpenseReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Fornecedores (CheckboxListField remoto) — SEM sentinela TRIBUTO
  // (D-291-01/D-FE-05 do irmão F-262 NÃO se aplica aqui: o Request exige
  // uuid de fornecedor real). ----------------------------------------------
  const [providersSearch, setProvidersSearch] = useState('');
  const providersQuery = useOptionsChecklistQuery({
    asyncFunction: listProviderOptions,
    queryKey: queryKey.cadastrosBase.providers,
    search: providersSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.label }),
  });

  // ---- Categorias (CheckboxListField remoto, Saídas analíticas — `type_id:
  // 1, class: 2`). ----------------------------------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { type_id: 1, class: 2, is_enabled: 'true' },
  });

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação) -------
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  const watchedColumns = watch('columns');
  const hasApportionmentColumn = watchedColumns.some((column) =>
    PAID_EXPENSE_REPORT_APPORTIONMENT_KEYS.includes(column)
  );

  function buildParams(data: PaidExpenseReportFilterForm): PaidExpenseReportParams {
    return {
      providers: data.providers.length > 0 ? data.providers : undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      account_id: data.account_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      harvest_id: data.harvest_id?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      start_emission_date: data.start_emission_date || undefined,
      end_emission_date: data.end_emission_date || undefined,
      classification: data.classification?.value || undefined,
      // Defesa em profundidade (mirror `dre-report-service.ts`/F-262): nunca
      // envia `farm_id` quando o campo está vazio.
      farm_id: data.farm_id?.value || undefined,
      columns: data.columns,
      order: data.order!.value,
      order_direction: data.order_direction!.value,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: PaidExpenseReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadPaidExpenseReport(buildParams(data));
      downloadBlob(blob, `contas-pagas.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? shared.downloadError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={shared.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading || watchedColumns.length === 0}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {shared.fields.startEmissionDate}
              </Text>
              <Controller
                name="start_emission_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {shared.fields.endEmissionDate}
              </Text>
              <Controller
                name="end_emission_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Controller
              name="classification"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.classification}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={expenseClassificationOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.proprietary}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            <Controller
              name="account_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.account}
                  service={(params) => listAccounts({ ...params, is_enabled: 'true' })}
                  mapOptions={(item: AccountListItem) => ({
                    label: `${item.bank} — ${item.agency}/${item.account}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={shared.fields.costCenter}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="harvest_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.harvest}
                  service={listHarvestOptions}
                  mapOptions={(item: Harvest) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="order"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.order}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={paidExpenseReportOrderOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="order_direction"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.orderDirection}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportOrderDirectionOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Fornecedores — CheckboxListField REMOTO, SEM sentinela TRIBUTO
              (diferente de F-262/ContasAPagar — o Request exige uuid real). */}
          <Box>
            <Controller
              name="providers"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.providers}
                  items={providersQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={providersSearch}
                  onSearchChange={setProvidersSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={text.fields.providers}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={providersQuery.isLoading}
                  isError={providersQuery.isError}
                  onRetry={providersQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField REMOTO, Saídas analíticas
              (`type_id: 1, class: 2`). */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={shared.fields.categories}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={shared.fields.categories}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          <Controller
            name="columns"
            control={control}
            render={({ field }) => (
              <ReportColumnsField
                label={shared.columnsFieldLabel}
                catalog={paidExpenseReportColumnOptions.options(languageGB)}
                value={field.value}
                onChange={field.onChange}
                searchPlaceholder={shared.columnsSearchPlaceholder}
                emptyMessage={shared.columnsEmptyMessage}
                selectAllLabel={shared.selectAll}
                deselectAllLabel={shared.deselectAll}
                tooltip={hasApportionmentColumn ? shared.apportionmentHint : undefined}
              />
            )}
          />
        </VStack>
      </Form>
    </FormContainer>
  );
}
