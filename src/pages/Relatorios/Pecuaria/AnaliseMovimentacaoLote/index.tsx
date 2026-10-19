// src/pages/Relatorios/Pecuaria/AnaliseMovimentacaoLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Análise de Movimentação de Lote" (F-223, esteira 97-Esteiras/059,
// CONTRATO-F223-analise-mov-lote.md §3/§5). Consome
// `GET /api/v1/animal-movement-analysis-report` (query `type=pdf|excel`,
// default pdf), permissão `animal-movement-analysis-report_view` (rota +
// menu — slug JÁ REGISTRADO, sem seeder novo).
//
// Mirror estrutural EXATO de `Relatorios/Pecuaria/HistoricoAnimaisLote/
// index.tsx` (F-221, MESMA view Postgres `animal_batch_histories`, mesma
// família "form simples + download binário", SEM grid/prévia, SEM
// `columns`/`order` — a matriz data×categoria e a ordenação são fixas no
// servidor). Diverge do irmão em 2 pontos:
//   - SEM campo `status` — `AnimalMovementAnalysisReportRequest` não expõe
//     esse filtro (contrato §5 TASK-223-API-01: só `batch`/`start_date`/
//     `end_date`/`type`).
//   - `end_date`, quando preenchido, valida `>= start_date` no client
//     (schema `animal-movement-analysis-report-filter-schema.ts`) — a API
//     exige `after_or_equal:start_date` só quando o campo está presente
//     (`sometimes`), diferente do irmão F-221 (sem esse teste).
//
// `batch` usa `listBatchOptionsForForm` (NÃO `listBatchOptions`) — o
// contrato de API (`AnimalMovementAnalysisReportRequest.batch`) é
// `required|uuid|exists:batches,uuid` (tenant-scoped, contrato §2.1), que
// rejeita a sentinela "Sem lote" (`uuid:'0'`) que `listBatchOptions` inclui
// para telas de FILTRO de grid — mesma constraint e mesma escolha do irmão
// F-221 (`HistoricoAnimaisLote`/`HistoricoReprodutivo`).
//
// PDF SEMPRE paisagem, `Content-Disposition: inline`
// (`GbCerneSnappyReport::inline` explícito no controller, contrato §5
// TASK-223-API-03) — abre em nova aba, NUNCA `downloadBlob` (forçaria
// download, quebrando a fidelidade ao legado). Excel via `downloadBlob`
// (`GbCerneReportExcel::download`, mesma árvore de dados do PDF).
//
// Erro tratado via `parseBlobError` (responseType:'blob' entrega o corpo do
// erro 422 como Blob — sem este parse o catch recebe um Blob opaco), mirror
// `HistoricoAnimaisLote`/`Adiantamento`/`PagamentoPrevistoReal`. Prioridade:
// 1ª mensagem ESPECÍFICA de `errors` por campo; só cai para `message`
// genérico quando não há erro de campo.
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
import { reportOutputTypeOptions } from '@/constants/Relatorios/animal-movement-analysis-report/options/report-output-type-options';

import { animalMovementAnalysisReportFilterSchemaResolver } from '@/validations/schemas/AnimalMovementAnalysisReport/animal-movement-analysis-report-filter-schema';

import { downloadAnimalMovementAnalysisReport } from '@/services/v2/Relatorios/animal-movement-analysis-report-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { LanguageDate } from '@/@types/language';
import type { AnimalMovementAnalysisReportFilterForm } from '@/@types/v2/AnimalMovementAnalysisReport';
import type { BatchOption } from '@/@types/v2/Batches';

function buildPristineValues(languageGB: LanguageDate): AnimalMovementAnalysisReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    batch: null,
    type: reportOutputTypeOptions.getOption('pdf', languageGB),
  };
}

export default function AnaliseMovimentacaoLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalMovementAnalysisReport.report;

  const { control, handleSubmit, watch } = useForm<AnimalMovementAnalysisReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalMovementAnalysisReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const batchValue = watch('batch');

  // Botão desabilitado até o único campo obrigatório do legado (Lote) estar
  // preenchido (F-223: `start_date` é OPCIONAL, fiel ao legado — só `batch`
  // é exigido, mirror `AnimalMovementAnalysisReportRequest`). O restante da
  // validação (schema Yup, incl. `end_date >= start_date` quando ambos
  // presentes) fica a cargo do submit.
  const canSubmit = !!batchValue;

  async function handleDownload(data: AnimalMovementAnalysisReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadAnimalMovementAnalysisReport({
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        batch: data.batch!.value,
        type: data.type!.value,
      });

      if (data.type!.value === 'excel') {
        downloadBlob(blob, 'analise-movimentacao-lote.xlsx');
      } else {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // `downloadBlob` (forçaria download, quebrando a fidelidade ao
        // legado, mirror `HistoricoAnimaisLote`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `HistoricoAnimaisLote`/`Adiantamento`/`PagamentoPrevistoReal`).
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
        </VStack>
      </Form>
    </FormContainer>
  );
}
