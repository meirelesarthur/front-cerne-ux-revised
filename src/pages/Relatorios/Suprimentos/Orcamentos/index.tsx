// src/pages/Relatorios/Suprimentos/Orcamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Suprimentos > Orçamentos" (`request-quotation.report`,
// F-311, execução 97-Esteiras/078, TASK-F311-F03). Rota
// `/relatorios/suprimentos/orcamentos`, materializa o item de menu FILHO
// `rel-sup-orcamentos`, filho do grupo `rel-sup` ("Suprimentos",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Estoque/SaidasCentroCusto/index.tsx`
// (casca `FormContainer` + footer, 2 botões PDF/Excel via `SimpleGrid`,
// `DateInput` via `Controller`) e `Relatorios/Suprimentos/Savings/index.tsx`
// (mesmo domínio `rel-sup`).
//
// Diferença central (FRONT-06, verificada ao vivo): os 2 selects opcionais
// (Fornecedor/Fazenda) são alimentados por UM ÚNICO fetch dedicado
// `GET /request-quotation-report/options` → `{ providers, farms }` — NUNCA
// os genéricos `/providers/options`/`/farms/options`. Por isso esta tela usa
// 1 `useQuery` + 2 `useMemo` (não 2 `useQuery` como o irmão
// `SaidasCentroCusto`, que consome 2 endpoints `-options` distintos).
//
// 4 campos de filtro fiéis ao legado: `start_date`/`end_date` OBRIGATÓRIOS,
// `provider_id`/`farm_id` opcionais. `report_type` NÃO é um campo do form —
// os 2 botões do footer fixam o literal `pdf`/`excel` (FRONT-07, decisão já
// resolvida: 2 botões, não um Select "Tipo de Relatório").
//
// Endpoint DELIVERED (FLAT, reconciliação obrigatória do plano):
// `GET /request-quotation-report` (raiz, NÃO `/reports/...`). Nome do
// arquivo Excel FIXO do task-packet: `orcamentos.xlsx`.
//
// Guardrail farm-scoped (FRONT-17) — `provider_id`/`farm_id` resetados na
// troca de fazenda ativa (mirror
// `filtro_farm_scoped_reset_na_troca_de_fazenda`): a queryKey de options já
// inclui `activeFarmUuid`, então o refetch é automático; o `useEffect`
// apenas limpa a seleção anterior (que deixaria de existir no universo da
// nova fazenda e causaria 422/lista estagnada).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
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

import { requestQuotationReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/request-quotation-report-filter-schema';

import {
  downloadRequestQuotationReportExcel,
  downloadRequestQuotationReportPdf,
  getRequestQuotationReportOptions,
  toRequestQuotationReportParams,
} from '@/services/v2/Relatorios/request-quotation-report-service';

import type { Option } from '@/@types/option';
import type { RequestQuotationReportFormValues } from '@/@types/v2/Relatorios/request-quotation-report';

const pristineValues: RequestQuotationReportFormValues = {
  start_date: null,
  end_date: null,
  provider_id: null,
  farm_id: null,
};

export default function OrcamentosRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.requestQuotationReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequestQuotationReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: requestQuotationReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // FRONT-06 — os 2 selects (Fornecedor/Fazenda) vêm de UM ÚNICO fetch a
  // `/request-quotation-report/options` — NUNCA `listProviderOptions`/
  // `listFarmOptions` genéricos (o dedicado carrega o filtro legado
  // `is_enabled + EXISTS request_quotations` que o genérico não tem).
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.requestQuotationReportOptions, activeFarmUuid],
    queryFn: getRequestQuotationReportOptions,
  });
  useQueryError([optionsQuery]);

  const providerOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.providers ?? []).map((provider) => ({
        label: provider.name,
        value: provider.uuid,
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

  // Guardrail farm-scoped (FRONT-17) — `provider_id`/`farm_id` resetados na
  // troca de fazenda ativa; a queryKey de options já inclui `activeFarmUuid`
  // (refetch automático).
  useEffect(() => {
    setValue('provider_id', null, { shouldDirty: false });
    setValue('farm_id', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `SaidasCentroCusto`/`Savings`).
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

  async function handleDownloadPdf(values: RequestQuotationReportFormValues) {
    const params = toRequestQuotationReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadRequestQuotationReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `SaidasCentroCusto`/`Savings`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: RequestQuotationReportFormValues) {
    const params = toRequestQuotationReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadRequestQuotationReportExcel(params);
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
              name="provider_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.provider}
                  placeholder={text.providerPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={providerOptions}
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
        </VStack>
      </Form>
    </FormContainer>
  );
}
