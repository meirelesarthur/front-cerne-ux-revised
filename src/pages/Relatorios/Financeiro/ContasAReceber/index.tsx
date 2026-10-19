// src/pages/Relatorios/Financeiro/ContasAReceber/index.tsx
// -----------------------------------------------------------------------------
// Tela "Contas a Receber — Relatório" (F-271, TASK-050-271-FE-02, esteira
// 97-Esteiras/050). Rota `/relatorios/financeiro/contas-a-receber`,
// materializa o item de menu FILHO `rel-fin-contas-a-receber`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Irmã de `Relatorios/Financeiro/ContasAPagar/index.tsx` (F-262) no lado
// RECEITA — MESMO molde estrutural (FormContainer + footer, sem grid/prévia,
// download via Blob + `downloadBlob`, erro 422-como-Blob via `parseBlobError`,
// SEM `<Form formFilter>` — D-FE-14, mesma divergência declarada do molde
// DRE/ContasAPagar), mas NÃO é uma cópia ajustada: diverge de propósito em 2
// pontos —
//   1. Campo "Clientes" (`listClientOptions`, LAC-FE-02) no lugar de
//      "Fornecedores" — SEM sentinela TRIBUTO (`D-FE-05` do irmão F-262 NÃO
//      se aplica aqui: `IncomeReportRequest` não tem esse conceito).
//   2. SEM campo Classificação e SEM coluna Produtos — `IncomeReportRequest`
//      não aceita `classification` nesta rota e `IncomeReportColumnEnum` não
//      tem `products` (o legado não os oferece, contrato de tela §2/§4 —
//      "não inventar").
//
// (D-FE-04) mantém o campo "Fazenda" (`farm_id` como filtro explícito do
// relatório, distinto da fazenda ativa do header `X-Farm-Id`, automática via
// interceptor).
//
// Sem grid/tabela de prévia — só o form de parâmetros + seletor de colunas +
// botão "Gerar relatório" (o binário é gerado 100% no servidor,
// `responseType:'blob'` obrigatório).
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
import { queryKey } from '@/constants/query-key';
import {
  INCOME_REPORT_APPORTIONMENT_KEYS,
  INCOME_REPORT_DEFAULT_COLUMNS,
  incomeReportColumnOptions,
} from '@/constants/Relatorios/accounts-reports/options/income-report-column-options';
import { incomeReportOrderOptions } from '@/constants/Relatorios/accounts-reports/options/income-report-order-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { reportOrderDirectionOptions } from '@/constants/Relatorios/accounts-reports/options/report-order-direction-options';
import { reportPeriodicityOptions } from '@/constants/Relatorios/accounts-reports/options/report-periodicity-options';

import { incomeReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/income-report-filter-schema';

import { downloadIncomeReport } from '@/services/v2/AccountsReports/income-report-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type { IncomeReportFilterForm, IncomeReportParams } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): IncomeReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    start_emission_date: null,
    end_emission_date: null,
    clients: [],
    categories: [],
    proprietary_id: null,
    farm_id: null,
    center_id: null,
    periodicity: reportPeriodicityOptions.getOption(0, languageGB),
    columns: INCOME_REPORT_DEFAULT_COLUMNS,
    order: incomeReportOrderOptions.getOption('due_date', languageGB),
    order_direction: reportOrderDirectionOptions.getOption('asc', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function ContasAReceberRelatorio() {
  const { languageGB } = useLanguage();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.incomes;

  const { control, handleSubmit, watch } = useForm<IncomeReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: incomeReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Clientes (CheckboxListField remoto, LAC-FE-02) — SEM sentinela
  // TRIBUTO (D-FE-05 do irmão F-262 NÃO se aplica aqui: `IncomeReportRequest`
  // não tem esse conceito). `listClientOptions` devolve `{uuid, name}`
  // (divergência registrada no service, NÃO `{uuid, label}`). ---------------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
  });

  // ---- Categorias (CheckboxListField remoto, Receitas — `type_id: 2`) -----
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { type_id: 2, is_enabled: 'true' },
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
    INCOME_REPORT_APPORTIONMENT_KEYS.includes(column)
  );

  function buildParams(data: IncomeReportFilterForm): IncomeReportParams {
    return {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      start_emission_date: data.start_emission_date || undefined,
      end_emission_date: data.end_emission_date || undefined,
      clients: data.clients.length > 0 ? data.clients : undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      // Defesa em profundidade (mirror `dre-report-service.ts`/F-262): nunca
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

  async function handleDownload(data: IncomeReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadIncomeReport(buildParams(data));
      downloadBlob(blob, `contas-a-receber.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror DRE/F-262).
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
                  options={incomeReportOrderOptions.options(languageGB)}
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

          {/* Clientes — CheckboxListField REMOTO (`listClientOptions`,
              LAC-FE-02, busca server-side). SEM item sintético (diferente de
              F-262/ContasAPagar — `IncomeReportRequest` não tem sentinela). */}
          <Box>
            <Controller
              name="clients"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.clients}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={shared.lookupSearchPlaceholder}
                  selectAllLabel={shared.selectAll}
                  deselectAllLabel={shared.deselectAll}
                  selectedCountLabel={text.fields.clients}
                  emptyLabel={shared.lookupEmptyMessage}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField REMOTO, só categorias de
              Receitas (`type_id: 2`). */}
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
                catalog={incomeReportColumnOptions.options(languageGB)}
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
