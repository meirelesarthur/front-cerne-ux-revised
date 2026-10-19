// src/pages/Relatorios/Suprimentos/GerencialSolicitacoes/index.tsx
// -----------------------------------------------------------------------------
// Tela "Gerencial de Solicitações — Relatório" (F-310, TASK-053-F310-FE-02,
// esteira 97-Esteiras/053). Rota
// `/relatorios/suprimentos/gerencial-de-solicitacoes`, materializa o item de
// menu FILHO `rel-sup-gerencial-solicitacoes`, 2º filho do grupo/submenu
// `rel-sup` ("Suprimentos", `navigationTree.ts`) — o 1º filho é o "Relatório
// SLA" (F-326), promovido de item-folha para filho NESTA MESMA Tarefa, SEM
// nenhuma mudança de path/componente/permissão (ver `router/index.tsx`/
// `navigationTree.ts`/`navigationPermissions.ts`).
//
// Subpasta NOVA dentro de `Relatorios/Suprimentos/` (mirror do padrão já
// usado por `Relatorios/Estoque/{CustoProducaoBatida,Recebimentos,...}`,
// roteiro-front-F310 §5.6) — o arquivo IRMÃO
// `src/pages/Relatorios/Suprimentos/index.tsx` (SLA, F-326) permanece
// intocado.
//
// Casco mirror EXATO de `Relatorios/Financeiro/CentroCusto/index.tsx` (2
// botões de download independentes, `isDownloadingPdf`/`isDownloadingExcel`
// separados, SEM prévia — contrato de tela só expõe binário) + `/options`
// combinado (farms+types+statuses, 1 `useQuery`, mirror EXATO
// `Relatorios/Pecuaria/ManejoLote/index.tsx` — SEM `useOptionsSelectQuery`
// por campo, decisão explícita do roteiro §"Leitura do dev" risco #3: NÃO
// reusar os catálogos LOCAIS `RequestPurchaseType`/`RequestPurchaseStatus`
// já existentes em `constants/RequestPurchases/options/*` — o `/options`
// dedicado garante paridade 1:1 de rótulo com a coluna "Tipo"/"Status" do
// PDF, mesmo `Enum::label()` do backend).
//
// SEM CASCATA: `farm_id`/`type_request`/`status` são 3 filtros
// INDEPENDENTES entre si (roteiro §3 item 1, mirror `ManejoLote`
// categoria/lote). Botões de download `disabled` até `start_date`+
// `end_date` preenchidos (guarda client-side — o backend já valida via 422
// de qualquer forma, mirror `ManejoLote`/`CentroCusto`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

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

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { requestPurchaseManagementReportFilterSchemaResolver } from '@/validations/schemas/RequestPurchaseManagementReport/request-purchase-management-report-filter-schema';

import {
  downloadRequestPurchaseManagementReportExcel,
  downloadRequestPurchaseManagementReportPdf,
  getRequestPurchaseManagementReportOptions,
} from '@/services/v2/RequestPurchaseManagementReport/request-purchase-management-report-service';

import type { Option } from '@/@types/option';
import type {
  RequestPurchaseManagementReportFilterForm,
  RequestPurchaseManagementReportParams,
} from '@/@types/v2/RequestPurchaseManagementReport';

const pristineValues: RequestPurchaseManagementReportFilterForm = {
  start_date: null,
  end_date: null,
  farm_id: null,
  type_request: null,
  status: null,
};

export default function GerencialSolicitacoesRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchaseManagementReport.report;

  const { control, handleSubmit, watch } = useForm<RequestPurchaseManagementReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: requestPurchaseManagementReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.requestPurchaseManagementReportOptions],
    queryFn: getRequestPurchaseManagementReportOptions,
  });

  const farmOptions: Option<string>[] = (optionsQuery.data?.farms ?? []).map((farm) => ({
    value: farm.uuid,
    label: farm.description,
  }));
  const typeOptions = optionsQuery.data?.types ?? [];
  const statusOptions = optionsQuery.data?.statuses ?? [];

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: RequestPurchaseManagementReportFilterForm
  ): RequestPurchaseManagementReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      farm_id: data.farm_id?.value || undefined,
      type_request: data.type_request?.value || undefined,
      status: data.status?.value ?? undefined,
    };
  }

  async function handleDownloadPdf(data: RequestPurchaseManagementReportFilterForm) {
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadRequestPurchaseManagementReportPdf(buildParams(data));
      downloadBlob(blob, 'relatorio-gerencial-de-solicitacoes.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ContasAPagar`/`CentroCusto`/`ManejoLote`).
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
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadExcel(data: RequestPurchaseManagementReportFilterForm) {
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadRequestPurchaseManagementReportExcel(buildParams(data));
      downloadBlob(blob, 'relatorio-gerencial-de-solicitacoes.xlsx');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
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
      setIsDownloadingExcel(false);
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
            variant="outline"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloadingPdf}
            disabled={!hasValidRange || isDownloadingPdf || isDownloadingExcel}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isDownloadingExcel}
            disabled={!hasValidRange || isDownloadingPdf || isDownloadingExcel}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fiveColumns} gap={6}>
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
            </Box>

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={farmOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="type_request"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.typeRequest}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={typeOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={statusOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
