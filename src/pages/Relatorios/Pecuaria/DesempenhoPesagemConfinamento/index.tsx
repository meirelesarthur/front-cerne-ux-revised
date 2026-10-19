// src/pages/Relatorios/Pecuaria/DesempenhoPesagemConfinamento/index.tsx
// -----------------------------------------------------------------------------
// Tela "Desempenho Pesagem Confinamento — Relatório" (F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`). Rota
// `/relatorios/pecuaria/desempenho-pesagem-confinamento`, materializa o item
// de menu FILHO `rel-pec-desempenho-pesagem-confinamento`, sob o
// grupo/submenu `rel-pec` ("Pecuária", `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Pecuaria/CusteioLote/index.tsx`
// (par `start_date`/`end_date` obrigatório, `FormContainer` + `footer` com 2
// botões "Baixar PDF"/"Baixar Excel" independentes, loading POR BOTÃO,
// `downloadBlob` + `parseBlobError`, `responseType:'blob'`), trocando o
// campo `batches` (multiselect) por 2 selects SINGLE opcionais — `corral`
// (`SelectAsyncPaginate` sobre `listFeedlotCorrals`, mirror rótulo composto
// `identification — name` já usado em `Troughs`/`DrinkingFountains`) e
// `batch` (`SelectAsyncPaginate` sobre `listBatchOptionsForForm`, mirror
// `CusteioLote`/`CusteioAnimal` — `batch_uuid` é `uuid`/`exists`, nunca
// aceita o sentinela `"0"` de "Sem lote").
//
// SEM cascata entre `corral`/`batch` (contrato legado, `cascatas:
// NAO_APLICAVEL` — selects independentes, mesma leitura confirmada no
// contrato de API §8).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { feedlotWeighingPerformanceReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/feedlot-weighing-performance-report-filter-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listFeedlotCorrals } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';
import {
  downloadFeedlotWeighingPerformanceReportPdf,
  downloadFeedlotWeighingPerformanceReportXlsx,
} from '@/services/v2/Relatorios/feedlot-weighing-performance-report-service';

import type { BatchOption } from '@/@types/v2/Batches';
import type { FeedlotCorralListItem } from '@/@types/v2/FeedlotCorrals';
import type {
  FeedlotWeighingPerformanceReportFilterForm,
  FeedlotWeighingPerformanceReportParams,
} from '@/@types/v2/Relatorios/feedlot-weighing-performance-report';

const pristineValues: FeedlotWeighingPerformanceReportFilterForm = {
  corral: null,
  batch: null,
  start_date: null,
  end_date: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `CusteioLote/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function DesempenhoPesagemConfinamentoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotWeighingPerformanceReport.report;

  const { control, handleSubmit, watch } = useForm<FeedlotWeighingPerformanceReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: feedlotWeighingPerformanceReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `CusteioLote`/`SanitarioLote`) — `corral`/`batch`
  // vazios NÃO bloqueiam (campos opcionais). A validação `end_date >=
  // start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: FeedlotWeighingPerformanceReportFilterForm
  ): FeedlotWeighingPerformanceReportParams {
    return {
      corral_uuid: data.corral?.value || undefined,
      batch_uuid: data.batch?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleExportPdf(data: FeedlotWeighingPerformanceReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadFeedlotWeighingPerformanceReportPdf(buildParams(data));
      downloadBlob(blob, 'desempenho-pesagem-confinamento.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `CusteioLote`/`FiscalNaoFiscal`).
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
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: FeedlotWeighingPerformanceReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadFeedlotWeighingPerformanceReportXlsx(buildParams(data));
      downloadBlob(blob, 'desempenho-pesagem-confinamento.xlsx');
      toaster.success({ title: text.pageTitle, description: text.successToast });
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
            title={text.exportPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="corral"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.corral}
                  placeholder={text.corralPlaceholder}
                  service={listFeedlotCorrals}
                  mapOptions={(item: FeedlotCorralListItem) => ({
                    label: `${item.identification} — ${item.name}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    name: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="batch"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
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
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.periodRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
