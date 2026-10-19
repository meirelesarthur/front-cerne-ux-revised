// src/pages/Relatorios/Pecuaria/HistoricoAnimaisLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Histórico de Animais/Lote" (F-221, TASK-058-F221-FE-02, esteira
// 97-Esteiras/058). Rota `/relatorios/pecuaria/historico-animais-lote`,
// materializa o item de menu FILHO `rel-pec-hal`, sob o grupo `rel-pec`
// ("Pecuária", `navigationTree.ts`). Consome
// `GET /api/v1/animal-batch-history-report` (query `type=pdf|excel`,
// default pdf), permissão `animal-batch-history-report_view` (rota + menu).
//
// Mirror estrutural EXATO de `Relatorios/Pecuaria/HistoricoReprodutivo/
// index.tsx` (mesmo módulo, mesma família "form simples + download
// binário", SEM grid/prévia, SEM `columns`/`order` — colunas e ordenação
// são fixas no servidor, FRONT-F221-plano.md §1). Diverge do irmão em 2
// pontos:
//   - `type` é `Select` de 2 opções com valor STRING ('pdf'|'excel'), não
//     índice de array 0/1 — casa 1:1 com o parâmetro literal esperado pela
//     API (plano §"Riscos", item 2), `reportOutputTypeOptions`.
//
// `batch` usa `listBatchOptionsForForm` (NÃO `listBatchOptions`) — o
// contrato de API (`AnimalBatchHistoryReportRequest.batch`) é
// `required|uuid|exists:batches,uuid`, que rejeita a sentinela "Sem lote"
// (`uuid:'0'`) que `listBatchOptions` inclui para telas de FILTRO de grid;
// mesma constraint e mesma escolha do irmão `HistoricoReprodutivo` (batch
// também `required|uuid|exists` naquele endpoint) — batch-service.ts
// documenta essa distinção no cabeçalho.
//
// Erro tratado via `parseBlobError` (responseType:'blob' entrega o corpo do
// erro 422 como Blob — sem este parse o catch recebe um Blob opaco), mirror
// `Adiantamento`/`PagamentoPrevistoReal`. Prioridade: 1ª mensagem
// ESPECÍFICA de `errors` por campo; só cai para `message` genérico quando
// não há erro de campo.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { animalStatusOptions } from '@/constants/pecuaria/animal/options/animal-status-options';
import { reportOutputTypeOptions } from '@/constants/Relatorios/animal-batch-history-report/options/report-output-type-options';

import { animalBatchHistoryReportFilterSchemaResolver } from '@/validations/schemas/AnimalBatchHistoryReport/animal-batch-history-report-filter-schema';

import { downloadAnimalBatchHistoryReport } from '@/services/v2/AnimalBatchHistoryReport/animal-batch-history-report-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { LanguageDate } from '@/@types/language';
import type { AnimalBatchHistoryReportFilterForm } from '@/@types/v2/AnimalBatchHistoryReport';
import type { BatchOption } from '@/@types/v2/Batches';

function buildPristineValues(languageGB: LanguageDate): AnimalBatchHistoryReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    batch: null,
    status: animalStatusOptions.getOption('A', languageGB),
    type: reportOutputTypeOptions.getOption('pdf', languageGB),
  };
}

export default function HistoricoAnimaisLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalBatchHistoryReport.report;

  const { control, handleSubmit, watch } = useForm<AnimalBatchHistoryReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalBatchHistoryReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const batchValue = watch('batch');

  // Botão desabilitado até os 2 campos obrigatórios estarem preenchidos
  // (mirror `hasValidRange` de `HistoricoReprodutivo`/`VacasPrenhas`) — o
  // restante da validação (schema Yup) fica a cargo do submit.
  const canSubmit = !!startDateValue && !!batchValue;

  async function handleDownload(data: AnimalBatchHistoryReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadAnimalBatchHistoryReport({
        start_date: data.start_date!,
        end_date: data.end_date || undefined,
        batch: data.batch!.value,
        status: data.status?.value,
        type: data.type!.value,
      });

      if (data.type!.value === 'excel') {
        downloadBlob(blob, 'historico-animais-lote.xlsx');
      } else {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // `downloadBlob` (forçaria download, quebrando a fidelidade ao
        // legado, mirror `HistoricoReprodutivo`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `Adiantamento`/`PagamentoPrevistoReal`).
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
            title={text.downloadButton}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading || !canSubmit}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDownloading} />
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDownloading} />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="batch"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.batch}
                    isRequired
                    service={listBatchOptionsForForm}
                    mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isReadOnly={isDownloading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.status}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={animalStatusOptions.options(languageGB)}
                    isDisabled={isDownloading}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={reportOutputTypeOptions.options(languageGB)}
                    noClearable
                    isDisabled={isDownloading}
                  />
                )}
              />
            </Box>
          </SimpleGrid>

          {!canSubmit && (
            <Text fontSize="sm" color="fg.muted">
              {text.requiredFieldsHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
