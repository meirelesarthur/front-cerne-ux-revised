// src/pages/Relatorios/Financeiro/FluxoMensalPagamento/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Financeiro > Fluxo Mensal de Pagamento"
// (`payment-cashflow.report`, F-293, execução 97-Esteiras/078,
// TASK-F293-F03). Rota `/relatorios/financeiro/fluxo-mensal-pagamento`,
// materializa o item de menu FILHO `rel-fin-fluxo-mensal-pagamento`, filho
// do grupo `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL DUPLO (F-293-plano-frontend.md §Tarefas fatiadas):
//   - `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx` (F-240) /
//     `CentroCusto/index.tsx` (F-247) — casca `FormContainer`+`<Form>` cru
//     (sem `formFilter`, sem grid/prévia), 2 botões PDF/Excel no footer,
//     `useState isExportingPdf/isExportingXlsx` (NUNCA `useMutation` para
//     binário), `downloadBlob`+`parseBlobError`, prioridade da mensagem
//     específica de `errors` sobre a genérica.
//   - `Relatorios/Suprimentos/Orcamentos/index.tsx` (F-311) /
//     `Relatorios/Frotas/Manutencoes/index.tsx` (F-276) — DIVERGÊNCIA
//     deliberada do molde financeiro: os 5 campos (accounts/categories/
//     proprietary/center_id/farm_id) são alimentados por UM ÚNICO fetch
//     dedicado `GET /payment-cashflow-report/options` →
//     `{accounts,proprietaries,cost_centers,financial_categories,farms}` —
//     NUNCA os lookups genéricos/paginados que `FluxoCaixaMensal`/
//     `CentroCusto` usam (`listAccounts`, `/cost-centers/options`,
//     `/proprietaries/options`, `/farms/options`). Por isso 1 `useQuery` + 5
//     `useMemo` (mirror `Manutencoes`: bundle único → múltiplos `useMemo`).
//
// `accounts[]`/`categories[]` — `CheckboxListField` sobre o bundle ÚNICO
// (busca CLIENT-SIDE via `useMemo`, mirror `equipment_ids[]`/`farm_ids[]` do
// twin `Manutencoes`), ambos OPCIONAIS (contrato de tela, SEM gate de
// botão — diferente de `Manutencoes`, cujo `equipment_ids` é obrigatório).
//
// `report_type` NÃO é um campo do form — os 2 botões do footer fixam o
// literal `pdf`/`excel` (FRONT-10, decisão já resolvida, DEC-049).
//
// Endpoint DELIVERED (FLAT, reconciliação obrigatória do plano):
// `GET /payment-cashflow-report` (raiz, NÃO `/reports/...`). Nome do arquivo
// Excel FIXO do task-packet: `fluxo-mensal-pagamento.xlsx`.
//
// Guardrail farm-scoped (FRONT-20, DEFECT-02) — os 5 selects/multiselects
// são resetados na troca de fazenda ativa (mirror
// `filtro_farm_scoped_reset_na_troca_de_fazenda`): `center_id` é escopado
// pela fazenda ATIVA (X-Farm-Id), não pelo `farm_id` do filtro — a queryKey
// de options já inclui `activeFarmUuid`, então o refetch é automático; o
// `useEffect` apenas limpa a seleção anterior (que deixaria de existir no
// universo da nova fazenda e causaria 422/lista órfã).
//
// Renderização do PDF (12 colunas paisagem, pivô movement×category, Débito=
// `pivot.value`, linha Total) é 100% server-side — esta tela só monta o
// filtro e baixa o binário (FRONT-19, NAO_APLICAVEL ao front).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { paymentCashflowReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/payment-cashflow-report-filter-schema';

import {
  downloadPaymentCashflowReportExcel,
  downloadPaymentCashflowReportPdf,
  listPaymentCashflowReportOptions,
  toPaymentCashflowReportParams,
} from '@/services/v2/PaymentCashflowReport/payment-cashflow-report-service';

import type { Option } from '@/@types/option';
import type { PaymentCashflowReportFormValues } from '@/@types/v2/PaymentCashflowReport';

const pristineValues: PaymentCashflowReportFormValues = {
  accounts: [],
  categories: [],
  proprietary: null,
  center_id: null,
  farm_id: null,
  start_date: null,
  end_date: null,
};

export default function FluxoMensalPagamentoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.paymentCashflowReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentCashflowReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: paymentCashflowReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // FRONT-07 — os 5 campos (accounts/categories/proprietary/center_id/
  // farm_id) vêm de UM ÚNICO fetch a `/payment-cashflow-report/options` —
  // NUNCA `listAccounts`/`/cost-centers/options`/`/proprietaries/options`/
  // `/farms/options` genéricos (o dedicado já traz os filtros legados
  // corretos, incluindo `cost_centers` escopado pela fazenda ativa).
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.paymentCashflowReportOptions, activeFarmUuid],
    queryFn: listPaymentCashflowReportOptions,
  });
  useQueryError([optionsQuery]);

  const [accountsSearch, setAccountsSearch] = useState('');
  const allAccountItems = useMemo(
    () =>
      (optionsQuery.data?.accounts ?? []).map((account) => ({
        value: account.uuid,
        label: account.label,
      })),
    [optionsQuery.data]
  );
  const accountItems = useMemo(
    () =>
      allAccountItems.filter((item) =>
        item.label.toLowerCase().includes(accountsSearch.trim().toLowerCase())
      ),
    [allAccountItems, accountsSearch]
  );

  const [categoriesSearch, setCategoriesSearch] = useState('');
  const allCategoryItems = useMemo(
    () =>
      (optionsQuery.data?.financial_categories ?? []).map((category) => ({
        value: category.uuid,
        label: category.label,
      })),
    [optionsQuery.data]
  );
  const categoryItems = useMemo(
    () =>
      allCategoryItems.filter((item) =>
        item.label.toLowerCase().includes(categoriesSearch.trim().toLowerCase())
      ),
    [allCategoryItems, categoriesSearch]
  );

  const proprietaryOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.proprietaries ?? []).map((proprietary) => ({
        label: proprietary.name,
        value: proprietary.uuid,
      })),
    [optionsQuery.data]
  );

  // Centro de Custo — escopado pela fazenda ATIVA (DEFECT-02), não pelo
  // `farm_id` do filtro (o bundle dedicado já resolve esse escopo no
  // servidor via X-Farm-Id).
  const costCenterOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.cost_centers ?? []).map((costCenter) => ({
        label: costCenter.description,
        value: costCenter.uuid,
      })),
    [optionsQuery.data]
  );

  const farmOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.farms ?? []).map((farm) => ({
        label: farm.description,
        value: farm.uuid,
      })),
    [optionsQuery.data]
  );

  // Guardrail farm-scoped (FRONT-20, DEFECT-02) — os 5 campos são resetados
  // na troca de fazenda ativa; a queryKey de options já inclui
  // `activeFarmUuid` (refetch automático).
  useEffect(() => {
    setValue('accounts', [], { shouldDirty: false });
    setValue('categories', [], { shouldDirty: false });
    setValue('proprietary', null, { shouldDirty: false });
    setValue('center_id', null, { shouldDirty: false });
    setValue('farm_id', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `FluxoCaixaMensal`/
  // `Orcamentos`/`Manutencoes`).
  async function notifyDownloadError(error: unknown) {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    toaster.error({
      title: text.pageTitle,
      description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
    });
  }

  async function handleDownloadPdf(values: PaymentCashflowReportFormValues) {
    const params = toPaymentCashflowReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadPaymentCashflowReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `Orcamentos`/`Manutencoes`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: PaymentCashflowReportFormValues) {
    const params = toPaymentCashflowReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadPaymentCashflowReportExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
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
              name="proprietary"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={proprietaryOptions}
                  loading={optionsQuery.isFetching}
                />
              )}
            />

            {/* Centro de Custo — escopado pela fazenda ATIVA (DEFECT-02), o
                bundle dedicado já resolve esse escopo no servidor. */}
            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.costCenter}
                  placeholder={text.costCenterPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={costCenterOptions}
                  loading={optionsQuery.isFetching}
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
                  options={farmOptions}
                  loading={optionsQuery.isFetching}
                />
              )}
            />
          </SimpleGrid>

          {/* Contas — CheckboxListField sobre o bundle ÚNICO, opcional. */}
          <Box>
            <Controller
              name="accounts"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.accounts}
                  items={accountItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={accountsSearch}
                  onSearchChange={setAccountsSearch}
                  searchPlaceholder={text.checkbox.searchPlaceholder}
                  selectAllLabel={text.checkbox.selectAll}
                  deselectAllLabel={text.checkbox.deselectAll}
                  selectedCountLabel={text.fields.accounts}
                  emptyLabel={text.checkbox.empty}
                  errorLabel={text.checkbox.error}
                  retryLabel={text.checkbox.retry}
                  isLoading={optionsQuery.isLoading}
                  isError={optionsQuery.isError}
                  onRetry={optionsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField sobre o MESMO bundle ÚNICO,
              opcional. */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.categories}
                  items={categoryItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={text.checkbox.searchPlaceholder}
                  selectAllLabel={text.checkbox.selectAll}
                  deselectAllLabel={text.checkbox.deselectAll}
                  selectedCountLabel={text.fields.categories}
                  emptyLabel={text.checkbox.empty}
                  errorLabel={text.checkbox.error}
                  retryLabel={text.checkbox.retry}
                  isLoading={optionsQuery.isLoading}
                  isError={optionsQuery.isError}
                  onRetry={optionsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
