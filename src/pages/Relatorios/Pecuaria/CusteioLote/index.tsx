// src/pages/Relatorios/Pecuaria/CusteioLote/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) "Custeio/Lote" — Relatórios > Pecuária
// (F-20c552f0, TASK-CL-FE-01, esteira 074, `custeio-lote-contrato-front.md
// §4/§5`). Mirror ESTRUTURAL EXATO de `Relatorios/Pecuaria/SanitarioLote/
// index.tsx` (mesma dupla de botões `Baixar PDF`/`Baixar Excel` via
// `downloadBlob`, loading POR BOTÃO independente, `try/catch/finally`),
// trocando o campo `batch` (single) por `batches` (multiselect, mirror do
// widget `isMulti` de `JurosPagos::provider_uuids`).
//
// PDF desta feature é DOWNLOAD FORÇADO (`downloadBlob`), NÃO `window.open`
// inline — a API usa `GbCerneSnappyReport::download(...)` (confirmado
// `custeio-lote-contrato-api.md §4 PASSO 5`), diferente de
// `VacasPrenhas`/`HistoricoReprodutivo` (que usam `::inline`). Ver contrato
// de tela §2.
//
// `type` vai como STRING (`'pdf'`/`'excel'`) implícito por botão — decisão
// de interface já tomada na camada API (§7.3), mirror `ReceiptsReportOutputType`
// da mesma esteira. NÃO reproduz o `<select type>` do legado.
//
// Usa `parseBlobError` (utilitário compartilhado, `@/utils/parseBlobError`)
// — NÃO duplica a versão inline `parseDownloadError`/`extractErrorMessage`
// que `SanitarioLote` ainda tem (débito técnico daquele arquivo, não o
// padrão a propagar; mirror `JurosPagos`/`CustoProducaoBatida`, que já usam
// o utilitário compartilhado). `batches[]` reusa `listBatchOptionsForForm`
// (`@/services/v2/Batches/batch-service`) — NÃO recriado.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
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

import { costingBatchReportFilterSchema } from '@/validations/schemas/Relatorios/costing-batch-report-filter-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  downloadCusteioLoteReportPdf,
  downloadCusteioLoteReportXlsx,
} from '@/services/v2/Relatorios/costing-batch-report-service';

import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';

// Form values desta tela (page-scoped, não compartilhado). `batches` é
// `Option<string>[] | null` (widget `SelectAsyncPaginate isMulti`); vira
// `batches: string[]` no payload real do service
// (`CusteioLoteReportParams`).
interface CusteioLoteReportFilterForm {
  batches: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: CusteioLoteReportFilterForm = {
  batches: [],
  start_date: null,
  end_date: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `JurosPagos/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function CusteioLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.costingBatchReport.report;

  const { control, handleSubmit, watch } = useForm<CusteioLoteReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(costingBatchReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `SanitarioLote`/`JurosPagos`) — `batches` vazio NÃO
  // bloqueia (campo opcional). A validação `end_date >= start_date` fica a
  // cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: CusteioLoteReportFilterForm) {
    return {
      batches: data.batches?.map((option) => option.value) || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleExportPdf(data: CusteioLoteReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadCusteioLoteReportPdf(buildParams(data));
      downloadBlob(blob, 'custeio-lote.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `JurosPagos/index.tsx`).
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

  async function handleExportXlsx(data: CusteioLoteReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadCusteioLoteReportXlsx(buildParams(data));
      downloadBlob(blob, 'custeio-lote.xlsx');
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
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Controller
              name="batches"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.batches}
                  placeholder={text.batchesPlaceholder}
                  isMulti
                  closeMenuOnSelect={false}
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
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
