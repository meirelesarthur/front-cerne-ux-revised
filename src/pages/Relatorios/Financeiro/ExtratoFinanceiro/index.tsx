// src/pages/Relatorios/Financeiro/ExtratoFinanceiro/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Financeiro > Extrato Financeiro"
// (`bankEstatement.report`, F-233, execução 97-Esteiras/079,
// TASK-F233-FE-03). Rota `/relatorios/financeiro/extrato-financeiro`,
// materializa o item de menu FILHO `rel-fin-extrato-financeiro`, filho do
// grupo `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL: `Relatorios/Financeiro/FluxoMensalPagamento/index.tsx`
// (F-293, mesma esteira-mãe 078/079, mesmo domínio `Movement`) — casca
// `FormContainer`+`<Form>` cru (sem `formFilter`, sem grid/prévia), 2 botões
// PDF/Excel no footer, `useState isExportingPdf/isExportingXlsx` (NUNCA
// `useMutation` para binário), `downloadBlob`+`parseBlobError`, prioridade da
// mensagem específica de `errors` sobre a genérica, options DEDICADO (1
// `useQuery` → N `useMemo`).
//
// `Relatorios/Financeiro/MovimentoBancario/index.tsx` (F-264) NÃO é mirror
// desta feature — endpoint distinto (`FinancialMovementReport`), `accounts[]`
// MÚLTIPLO via `CheckboxListField`, campo `types` inexistente aqui. Reusado
// apenas visualmente o padrão do Select `condition` `noClearable`.
//
// DIVERGÊNCIAS do mirror F-293 (fidelidade ao contrato de F-233, FID-G3F):
//   - FRONT-02: `account` é ÚNICO e OBRIGATÓRIO — `Select` single (não
//     `CheckboxListField`), com asterisco + erro de campo (mirror visual de
//     `start_date`/`end_date`).
//   - FRONT-07: `condition` (S/C) é campo NOVO, `Select` `noClearable`,
//     options LOCAIS (sem fetch), default `'S'`.
//   - FRONT-09/AF#2: `cost_centers` do bundle de options é escopado pelo
//     `farm_uuid` que o usuário está montando no PRÓPRIO FILTRO (não pela
//     fazenda ATIVA como em F-293/DEFECT-02) — a queryKey de options observa
//     `watch('farm_id')` e a função de options recebe esse `farm_uuid`.
//   - FRONT-21: o guardrail de reset por troca de fazenda reage à fazenda
//     ATIVA (`activeFarmUuid`, sessão) e limpa apenas `farm_id`+`center_id`
//     (campos que dependeriam de uma fazenda que deixou de ser a ativa) —
//     `account`/`proprietary`/`categories`/`condition` NÃO são farm-scoped
//     nesta feature e não são resetados.
//
// `report_type` NÃO é um campo do form — os 2 botões do footer fixam o
// literal `pdf`/`excel` (FRONT-11, decisão já resolvida, DEC-049).
//
// Endpoint DELIVERED (FLAT): `GET /bank-statement-report` (raiz, NÃO
// `/reports/...`). Nome do arquivo Excel FIXO: `extrato-financeiro.xlsx`.
//
// Renderização do PDF (8 ou 11 colunas condicionais por `condition`, saldo
// anterior/corrente, mini-header+Totais, paisagem A4) é 100% server-side —
// esta tela só monta o filtro e baixa o binário (FRONT-20, NAO_APLICAVEL ao
// front).
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
import { bankStatementReportConditionOptions } from '@/constants/Relatorios/bank-statement-report/options';

import { bankStatementReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/bank-statement-report-filter-schema';

import {
  downloadBankStatementReportExcel,
  downloadBankStatementReportPdf,
  listBankStatementReportOptions,
  toBankStatementReportParams,
} from '@/services/v2/BankStatementReport/bank-statement-report-service';

import type { Option } from '@/@types/option';
import type { BankStatementReportFormValues } from '@/@types/v2/BankStatementReport';

export default function ExtratoFinanceiroRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.bankStatementReport.report;

  const pristineValues: BankStatementReportFormValues = {
    account: null,
    proprietary: null,
    center_id: null,
    categories: [],
    farm_id: null,
    condition: bankStatementReportConditionOptions.getOption('S', languageGB),
    start_date: null,
    end_date: null,
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankStatementReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: bankStatementReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // AF#2 — `cost_centers` do bundle é escopado pelo `farm_uuid` que o
  // usuário está montando no PRÓPRIO FILTRO, não pela fazenda ATIVA — a
  // queryKey observa `watch('farm_id')` (além de `activeFarmUuid`, que só
  // participa da chave por convenção/consistência de cache entre fazendas).
  const watchedFarmId = watch('farm_id');
  const optionsQuery = useQuery({
    queryKey: [
      queryKey.relatorios.bankStatementReportOptions,
      activeFarmUuid,
      watchedFarmId?.value,
    ],
    queryFn: () => listBankStatementReportOptions(watchedFarmId?.value),
  });
  useQueryError([optionsQuery]);

  const accountOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.accounts ?? []).map((account) => ({
        value: account.uuid,
        label: account.label,
      })),
    [optionsQuery.data]
  );

  const proprietaryOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.proprietaries ?? []).map((proprietary) => ({
        label: proprietary.name,
        value: proprietary.uuid,
      })),
    [optionsQuery.data]
  );

  // Centro de Custo — escopado pelo `farm_uuid` do PRÓPRIO FILTRO (AF#2), o
  // bundle dedicado já resolve esse escopo no servidor.
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

  // Guardrail farm ATIVA (FRONT-21) — reseta apenas os campos farm-scoped
  // pela SESSÃO (`farm_id` do filtro + `center_id`, que ficaria órfão de uma
  // fazenda que deixou de ser a ativa). `account`/`proprietary`/
  // `categories`/`condition` NÃO são farm-scoped nesta feature.
  useEffect(() => {
    setValue('farm_id', null, { shouldDirty: false });
    setValue('center_id', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `FluxoMensalPagamento`).
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

  async function handleDownloadPdf(values: BankStatementReportFormValues) {
    const params = toBankStatementReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadBankStatementReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `FluxoMensalPagamento`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: BankStatementReportFormValues) {
    const params = toBankStatementReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadBankStatementReportExcel(params);
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

            {/* Conta Bancária — FRONT-02: ÚNICA e OBRIGATÓRIA, `Select`
                single (NÃO `CheckboxListField`, diferente de F-293). */}
            <Controller
              name="account"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.account}
                  placeholder={text.accountPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={accountOptions}
                  loading={optionsQuery.isFetching}
                  isRequired
                  error={errors.account?.message}
                />
              )}
            />

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

            {/* Fazenda — FRONT-09/AF#2: escolher aqui re-escopa a busca de
                `cost_centers` (queryKey observa `watch('farm_id')`). */}
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

            {/* Tipo (condition S/C) — FRONT-07: campo NOVO, options LOCAIS
                (sem fetch), `noClearable`, default `'S'`. */}
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.condition}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={bankStatementReportConditionOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Categorias — CheckboxListField sobre o bundle ÚNICO, opcional. */}
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
