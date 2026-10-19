// src/pages/Relatorios/Financeiro/FluxoMensalRecebimento/index.tsx
// -----------------------------------------------------------------------------
// Tela "Fluxo Mensal de Recebimento — Relatório" (F-303, esteira
// 97-Esteiras/059, TASK-303-API-01/02/03,
// `CONTRATO-F303-fluxo-mensal-recebimento.md` §"Decisão de arquitetura").
// Rota SUGERIDA `/relatorios/financeiro/fluxo-mensal-recebimento` (NÃO
// ligada aqui — ver BLOCO DE FIAÇÃO no handover), materializaria o item de
// menu FILHO NOVO `rel-fin-fluxo-mensal-recebimento`, sob o grupo/submenu
// `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Contrato de tela DERIVADO do contrato de API (SEM Referência UX própria no
// Storybook `cerne` — UX-GAP declarado no contrato §"UX-GAP": "nenhuma
// referência a Fluxo Mensal de Recebimento/receipt-cashflow em
// GB.Cerne.UX"). Mirror ESTRUTURAL de 2 irmãos diretos, mesmo tipo de fluxo:
//   1. `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx` (F-240) — casco
//      `FormContainer`+footer, `accounts[]` via `CheckboxListField` REMOTO
//      sobre `listAccounts` (NÃO `getAccountOptions`), `center_id` via
//      `SelectAsyncPaginate` escopado pela fazenda ATIVA (`only_analytic`),
//      `proprietary_id`/`farm_id` via `Select` estático.
//   2. `Relatorios/Financeiro/AgendaRecebimentos/index.tsx` (F-304) — MESMO
//      dispatch de saída no Controller (`GbCerneSnappyReport::inline` para
//      `format=pdf`, `Excel::download` para `format=xlsx`): `useMutation` +
//      `onSuccess(blob, variables)` decide `URL.createObjectURL`+
//      `window.open('_blank')` para PDF (NUNCA `downloadBlob`, que forçaria
//      download e quebraria a fidelidade `inline` do backend) vs
//      `downloadBlob` para Excel. `categories[]` via `CheckboxListField`
//      REMOTO sobre `listFinancialCategoryOptions` (`type_id:2, class:2` —
//      "Entradas" Analítico, mirror EXATO de `AgendaRecebimentos`).
//
// Divergências ADJUDICADAS pelo contrato de API (NÃO inventadas):
//   - `start_date`/`end_date` SEMPRE OBRIGATÓRIOS (mirror RAW —
//     `ReceiptCashflowReportRequest::rules()` exige ambos, `after_or_equal`)
//     — diferente de `AgendaRecebimentos` (datas opcionais, CF304-05).
//   - SEM `group`/`last_balance`/`report_type` (não existem em
//     `ReceiptCashflowReportFilterData`) — diferente de `FluxoCaixaMensal`.
//   - SEM seletor de colunas (11 colunas fixas server-side, contrato §
//     "Reuso confirmado") — diferente de `ContasAReceber`/`ContasAPagar`.
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
//
// Services/queryKeys 100% REUSADOS — nenhum lookup novo: `listAccounts`
// (`queryKey.cadastrosBase.accounts`), `listFinancialCategoryOptions`
// (`queryKey.financialCategories.list`), `listProprietaryOptions`
// (`queryKey.cadastrosBase.proprietaryOptions`), `listFarms`
// (`queryKey.farms.list`), `listCostCenterOptions` (via `SelectAsyncPaginate`,
// sem queryKey própria).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { receiptCashflowReportFilterSchemaResolver } from '@/validations/schemas/ReceiptCashflowReport/receipt-cashflow-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { downloadReceiptCashflowReport } from '@/services/v2/ReceiptCashflowReport/receipt-cashflow-report-service';

import type { LanguageDate } from '@/@types/language';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  ReceiptCashflowReportFilterForm,
  ReceiptCashflowReportParams,
} from '@/@types/v2/ReceiptCashflowReport';

function buildPristineValues(languageGB: LanguageDate): ReceiptCashflowReportFilterForm {
  return {
    accounts: [],
    start_date: null,
    end_date: null,
    proprietary_id: null,
    center_id: null,
    categories: [],
    farm_id: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function FluxoMensalRecebimentoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.receiptCashflowReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceiptCashflowReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: receiptCashflowReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  // ---- Contas (CheckboxListField remoto — `listAccounts`, mirror
  // `FluxoCaixaMensal`/`ContasAPagar`/`CentroCusto`) — tenant inteiro, sem
  // cascata por fazenda ativa. -------------------------------------------
  const [accountsSearch, setAccountsSearch] = useState('');
  const accountsQuery = useOptionsChecklistQuery({
    asyncFunction: listAccounts,
    queryKey: queryKey.cadastrosBase.accounts,
    search: accountsSearch,
    mapItem: (item: AccountListItem) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true' },
  });

  // ---- Categorias Financeiras (CheckboxListField remoto, Receitas —
  // `type_id: 2` + `class: 2` Analítico, mirror `AgendaRecebimentos`). ----
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { type_id: 2, class: 2, is_enabled: 'true' },
  });

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação, mirror
  // `FluxoCaixaMensal`/`ContasAReceber`) -----------------------------------
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  const formatOptions = reportFormatOptions.options(languageGB);

  function buildParams(data: ReceiptCashflowReportFilterForm): ReceiptCashflowReportParams {
    return {
      accounts: data.accounts.length > 0 ? data.accounts : undefined,
      start_date: data.start_date!,
      end_date: data.end_date!,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      farm_id: data.farm_id?.value || undefined,
      format: data.format!.value,
    };
  }

  const reportMutation = useMutation({
    mutationFn: (params: ReceiptCashflowReportParams) => downloadReceiptCashflowReport(params),
    onSuccess: (blob, variables) => {
      if (variables.format === 'pdf') {
        // PDF servido INLINE pelo backend (`GbCerneSnappyReport::inline`) —
        // NUNCA `downloadBlob`, que forçaria download e quebraria a
        // fidelidade `inline` (mirror EXATO `AgendaRecebimentos`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'fluxo-mensal-recebimento.xlsx');
      }
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `FluxoCaixaMensal`/`AgendaRecebimentos`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.downloadError,
      });
    },
  });

  const isGenerating = reportMutation.isPending;

  function onSubmit(data: ReceiptCashflowReportFilterForm) {
    reportMutation.mutate(buildParams(data));
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  placeholder={text.farmPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            {/* Centro de Custo — escopado pela fazenda ATIVA (header
                `X-Farm-Id`, `activeFarmUuid`) + só Analíticos
                (`only_analytic`), mirror `FluxoCaixaMensal`/`AgendaRecebimentos`.
                `cacheUniqs` invalida o cache de options ao trocar de
                fazenda. */}
            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
                  placeholder={text.costCenterPlaceholder}
                  cacheUniqs={[activeFarmUuid]}
                  service={(params) =>
                    listCostCenterOptions({
                      ...params,
                      only_analytic: true,
                      is_enabled: 'true',
                      farm_uuid: activeFarmUuid ?? undefined,
                    })
                  }
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={formatOptions}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>

          {/* Contas — `CheckboxListField` REMOTO (`useOptionsChecklistQuery`
              sobre `listAccounts`, busca server-side), mirror
              `FluxoCaixaMensal`/`ContasAPagar`/`CentroCusto`. */}
          <Box>
            <Controller
              name="accounts"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.accounts}
                  items={accountsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={accountsSearch}
                  onSearchChange={setAccountsSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.accounts}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={accountsQuery.isLoading}
                  isError={accountsQuery.isError}
                  onRetry={accountsQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>

          {/* Categorias Financeiras — `CheckboxListField` REMOTO, só
              categorias de Receitas Analíticas (`type_id:2, class:2`),
              mirror `AgendaRecebimentos`. */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.categories}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.categories}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
