// src/pages/Relatorios/Financeiro/FluxoCaixaMensal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Fluxo de Caixa Mensal — Relatório" (F-240, TASK-053-240-FE-02,
// esteira 97-Esteiras/053). Rota `/relatorios/financeiro/fluxo-de-caixa-mensal`,
// materializa o item de menu FILHO `rel-fin-cashflow-por-categoria`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Contrato de tela SELADO
// (`97-Esteiras/053/ROTEIROS/roteiro-front-F240-fluxo-caixa.md` §3-§5) —
// download-only PURO, SEM grid/prévia (mirror ESTRUTURAL de
// `Relatorios/Financeiro/ContasAPagar/index.tsx`/`Consolidado/index.tsx`:
// `FormContainer` + footer com 1 único botão "Gerar relatório", `useState
// isDownloading` — NUNCA `useMutation` para binário, convenção explícita já
// usada por todos os irmãos, `downloadBlob`+`parseBlobError`, prioridade de
// mensagem específica de campo sobre a genérica). Casco/campos de regime +
// período + lookups mirror ESTRUTURAL de `CentroCusto/index.tsx` (MESMO
// conjunto-base: `group`/período/`accounts[]`/`proprietary_id`/`center_id`/
// `farm_id`) — SEM a prévia viva que `CentroCusto` tem (F-240 é
// download-only puro, contrato de tela do dono, NÃO o desvio `DEC-225`) MAIS
// 3 campos novos (`last_balance`/`report_type`/`format`).
//
// `accounts[]` — `CheckboxListField` REMOTO sobre `listAccounts` (mirror
// `ContasAPagar`/`CentroCusto`), NÃO `getAccountOptions`/`/accounts/options`
// (essa rota devolve só os enums estáticos `{types,cnab_types}` do cadastro
// de Conta — incompatível com o lookup paginado do checklist). Asterisco
// visual CONDICIONAL no label quando `group==='C'` (IG-01) — só cosmético,
// SEM `.test()` Yup bloqueante (o servidor aceita `accounts` vazio mesmo com
// `group=C`, CL-031 preservada fielmente).
//
// `center_id` aceita centro GLOBAL (tenant nulo) OU do tenant — o backend
// resolve os dois universos em `/cost-centers/options` (mesma rota já usada
// por `ContasAPagar`/`CentroCusto`), o front só passa `is_enabled:'true'`.
//
// Defaults de UX declarados no roteiro selado (`_DECISOES-FIDELIDADE-053.md`,
// sem fonte legada — editáveis pelo usuário antes de gerar):
//   `report_type`  default `'S'` (Sintético — mais leve)
//   `last_balance` default `false` (Não — evita custo de cálculo por padrão)
// `format` default `'pdf'` (mirror irmãos).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
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
import { cashFlowByCategoryReportLastBalanceOptions } from '@/constants/Relatorios/cash-flow-by-category-report/options/last-balance-options';
import { cashFlowByCategoryReportRegimeOptions } from '@/constants/Relatorios/cash-flow-by-category-report/options/regime-options';
import { cashFlowByCategoryReportTypeOptions } from '@/constants/Relatorios/cash-flow-by-category-report/options/report-type-options';

import { cashFlowByCategoryReportFilterSchemaResolver } from '@/validations/schemas/CashFlowByCategoryReport/cash-flow-by-category-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { downloadCashFlowByCategoryReport } from '@/services/v2/CashFlowByCategoryReport/cash-flow-by-category-report-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type {
  CashFlowByCategoryReportFilterForm,
  CashFlowByCategoryReportParams,
} from '@/@types/v2/CashFlowByCategoryReport';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): CashFlowByCategoryReportFilterForm {
  return {
    group: null,
    accounts: [],
    start_date: null,
    end_date: null,
    // Decisão de UX declarada (roteiro selado, sem fonte legada) — "Não",
    // editável pelo usuário antes de gerar.
    last_balance: cashFlowByCategoryReportLastBalanceOptions.getOption(false, languageGB),
    proprietary_id: null,
    center_id: null,
    farm_id: null,
    // Decisão de UX declarada (roteiro selado, sem fonte legada) —
    // "Sintético", editável pelo usuário antes de gerar.
    report_type: cashFlowByCategoryReportTypeOptions.getOption('S', languageGB),
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function FluxoCaixaMensalRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.cashFlowByCategoryReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CashFlowByCategoryReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: cashFlowByCategoryReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Contas (CheckboxListField remoto — `listAccounts`, mirror
  // `ContasAPagar`/`CentroCusto`) — tenant inteiro, sem cascata por fazenda
  // ativa. ------------------------------------------------------------------
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

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação, mirror
  // `ContasAPagar`/`CentroCusto`) --------------------------------------------
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

  const regimeOptions = cashFlowByCategoryReportRegimeOptions.options(languageGB);
  const lastBalanceOptions = cashFlowByCategoryReportLastBalanceOptions.options(languageGB);
  const reportTypeOptions = cashFlowByCategoryReportTypeOptions.options(languageGB);
  const formatOptions = reportFormatOptions.options(languageGB);

  // Asterisco visual condicional (IG-01) — só cosmético, o servidor aceita
  // `accounts` vazio mesmo com `group=C` (CL-031 preservada fielmente).
  const watchedGroup = watch('group');
  const accountsLabel =
    watchedGroup?.value === 'C' ? `${text.fields.accounts} *` : text.fields.accounts;

  function buildParams(data: CashFlowByCategoryReportFilterForm): CashFlowByCategoryReportParams {
    return {
      group: data.group!.value,
      start_date: data.start_date!,
      end_date: data.end_date!,
      accounts: data.accounts.length > 0 ? data.accounts : undefined,
      last_balance: data.last_balance!.value,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      farm_id: data.farm_id?.value || undefined,
      report_type: data.report_type!.value,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: CashFlowByCategoryReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadCashFlowByCategoryReport(params);
      downloadBlob(blob, `fluxo-de-caixa-mensal.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ContasAPagar`/`CentroCusto`).
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
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.regime}
                  placeholder={text.regimePlaceholder}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option: Option<'C' | 'O'> | null) => field.onChange(option ?? null)}
                  options={regimeOptions}
                  noClearable
                  error={errors.group?.message}
                />
              )}
            />

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
                  <DateInput value={value ?? null} onChange={onChange} />
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="last_balance"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.lastBalance}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option: Option<boolean> | null) => field.onChange(option ?? null)}
                  options={lastBalanceOptions}
                  noClearable
                  error={errors.last_balance?.message}
                />
              )}
            />

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            {/* Centro de Custo — escopado pela fazenda ATIVA (header
                `X-Farm-Id`, `activeFarmUuid`) + só Analíticos
                (`only_analytic`), mirror `ApuracaoCusto`/`CentroCusto`
                (PLANO-FIX §2.5/§3 F-240). `cacheUniqs` invalida o cache de
                options ao trocar de fazenda. */}
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
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="report_type"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.reportType}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option: Option<'A' | 'S'> | null) => field.onChange(option ?? null)}
                  options={reportTypeOptions}
                  noClearable
                  error={errors.report_type?.message}
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
                  error={errors.format?.message}
                />
              )}
            />

            {/* Contas — `CheckboxListField` REMOTO (`useOptionsChecklistQuery`
                sobre `listAccounts`, busca server-side), ocupa o restante da
                linha (mirror técnica `accounts`/`cost_center_ids` de
                `CentroCusto`/`CustoProducao`). Asterisco visual condicional
                no label quando `group==='C'` (IG-01). */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 4' }}>
              <Controller
                name="accounts"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={accountsLabel}
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
                  />
                )}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
