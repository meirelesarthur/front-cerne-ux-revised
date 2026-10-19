// src/pages/Relatorios/Financeiro/ContasAPagar/index.tsx
// -----------------------------------------------------------------------------
// Tela "Contas a Pagar — Relatório" (F-262, TASK-050-262-FE-02, esteira
// 97-Esteiras/050). Rota `/relatorios/financeiro/contas-a-pagar`,
// materializa o item de menu FILHO `rel-fin-contas-a-pagar`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/Dre/index.tsx` (FormContainer
// + footer, sem grid/prévia, download via Blob + `downloadBlob`, erro
// 422-como-Blob tratado via `parseBlobError`, prioriza a mensagem
// específica de `errors` por campo sobre o `message` genérico) — SEM
// cascata entre campos (os 15 campos desta tela são independentes) e SEM
// `<Form formFilter>` (D-FE-14, divergência declarada — esta tela não tem
// grid, a casca é `FormContainer` + `<Form>` cru, mesmo padrão do molde
// DRE).
//
// Duas coisas divergem do molde DRE DE PROPÓSITO:
//   (D-FE-04) existe campo "Fazenda" — o endpoint aceita `farm_id` como
//   filtro explícito do relatório (distinto da fazenda ativa do header
//   `X-Farm-Id`, que continua automática via interceptor).
//   (D-FE-05) a lista de Fornecedores tem o item sintético TRIBUTO
//   (`value: '0'`), aceito pelo `ExpenseReportRequest` — SEMPRE visível,
//   prepended no client, NUNCA filtrado pela busca remota (o backend não o
//   conhece).
//
// Sem grid/tabela de prévia — só o form de parâmetros + seletor de colunas
// + botão "Gerar relatório" (o binário é gerado 100% no servidor,
// `responseType:'blob'` obrigatório).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

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
  EXPENSE_REPORT_APPORTIONMENT_KEYS,
  EXPENSE_REPORT_DEFAULT_COLUMNS,
  expenseReportColumnOptions,
} from '@/constants/Relatorios/accounts-reports/options/expense-report-column-options';
import { expenseReportOrderOptions } from '@/constants/Relatorios/accounts-reports/options/expense-report-order-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { reportOrderDirectionOptions } from '@/constants/Relatorios/accounts-reports/options/report-order-direction-options';
import { reportPeriodicityOptions } from '@/constants/Relatorios/accounts-reports/options/report-periodicity-options';

import { expenseReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/expense-report-filter-schema';

import { downloadExpenseReport } from '@/services/v2/AccountsReports/expense-report-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type { ExpenseReportFilterForm, ExpenseReportParams } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

const TRIBUTE_SENTINEL_VALUE = '0';

function buildPristineValues(languageGB: LanguageDate): ExpenseReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    start_emission_date: null,
    end_emission_date: null,
    classification: null,
    providers: [],
    categories: [],
    proprietary_id: null,
    farm_id: null,
    center_id: null,
    periodicity: reportPeriodicityOptions.getOption(0, languageGB),
    columns: EXPENSE_REPORT_DEFAULT_COLUMNS,
    order: expenseReportOrderOptions.getOption('due_date', languageGB),
    order_direction: reportOrderDirectionOptions.getOption('asc', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function ContasAPagarRelatorio() {
  const { languageGB } = useLanguage();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.expenses;

  const { control, handleSubmit, watch } = useForm<ExpenseReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: expenseReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Fornecedores (CheckboxListField remoto + item sintético TRIBUTO,
  // D-FE-05) — TRIBUTO nunca é filtrado pela busca remota (o backend não o
  // conhece), fica SEMPRE prepended na lista visível. ---------------------
  const [providersSearch, setProvidersSearch] = useState('');
  const providersQuery = useOptionsChecklistQuery({
    asyncFunction: listProviderOptions,
    queryKey: queryKey.cadastrosBase.providers,
    search: providersSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.label }),
  });
  const providerItems = useMemo(
    () => [
      { value: TRIBUTE_SENTINEL_VALUE, label: text.providerTributeLabel },
      ...providersQuery.items,
    ],
    [providersQuery.items, text.providerTributeLabel]
  );

  // ---- Categorias (CheckboxListField remoto, só Saídas — `type_id: 1`) --
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { type_id: 1, is_enabled: 'true' },
  });

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação) -----
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
    EXPENSE_REPORT_APPORTIONMENT_KEYS.includes(column)
  );

  function buildParams(data: ExpenseReportFilterForm): ExpenseReportParams {
    return {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      start_emission_date: data.start_emission_date || undefined,
      end_emission_date: data.end_emission_date || undefined,
      classification: data.classification?.value || undefined,
      providers: data.providers.length > 0 ? data.providers : undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      // Defesa em profundidade (mirror `dre-report-service.ts`): nunca
      // envia `farm_id` quando o campo está vazio.
      farm_id: data.farm_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      periodicity: data.periodicity?.value ?? undefined,
      columns: data.columns,
      order: data.order!.value,
      order_direction: data.order_direction!.value,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: ExpenseReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadExpenseReport(buildParams(data));
      downloadBlob(blob, `contas-a-pagar.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror DRE).
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
              name="periodicity"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.periodicity}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportPeriodicityOptions.options(languageGB)}
                  noClearable
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
                  options={expenseReportOrderOptions.options(languageGB)}
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

          {/* Fornecedores — CheckboxListField REMOTO (`useOptionsChecklistQuery`,
              busca server-side) + item sintético TRIBUTO (D-FE-05), sempre
              visível. Diferente de `ReportColumnsField` (catálogo LOCAL) —
              aqui o loading/erro é real (lookup em rede). */}
          <Box>
            <Controller
              name="providers"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.providers}
                  items={providerItems}
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

          {/* Categorias — CheckboxListField REMOTO, só categorias de Saídas
              analíticas habilitadas (`type_id: 1`). */}
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
                catalog={expenseReportColumnOptions.options(languageGB)}
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
