// src/pages/Relatorios/Pecuaria/PesagemLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pesagem/Lote — Relatório" (Tarefa 49, esteira
// CORE_WORKSPACE/97-Esteiras/014). Rota
// `/relatorios/pecuaria/pesagem-lote`, materializa o item de menu FILHO
// `rel-pec-pes`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`). Consome `GET
// /api/v1/accumulated-weighing-batch-report/options` + `GET
// /api/v1/accumulated-weighing-batch-report?...&format=pdf|xlsx`.
//
// Síntese de 3 precedentes já entregues (Referência UX, Tarefa 49 §"Passo
// UX"):
//   - `Relatorios/Pecuaria/ManejoLote/index.tsx` — MESMO endpoint de options
//     com o padrão `{categories,batches}` (`{uuid,label}`).
//   - `Relatorios/Pecuaria/VacasPrenhas/index.tsx` — MESMO arquétipo
//     comportamental: um único botão "Gerar Relatório", `useMutation`
//     (TanStack), campo do próprio formulário decide o FORMATO da mesma
//     resposta binária (PDF `Content-Disposition: inline` →
//     `URL.createObjectURL(blob)` + `window.open`, NUNCA `downloadBlob` para
//     o PDF; Excel → `downloadBlob`).
//   - `Relatorios/Agricultura/PesagensColheita/index.tsx` — mesmo campo
//     `format` (`'pdf'|'xlsx'`) via a fábrica compartilhada
//     `reportFormatOptions`.
//
// `only_active_batch` (NOVO nesta tela) mirror EXATO do campo `launched` de
// `src/pages/Fiscal/Dfe/DfeReport.tsx` — `Select` (não `Switch`) com a
// fábrica compartilhada `boolean.options(languageGB)`, `Option<boolean> |
// null`, nullable. Payload: `'1'`/`'0'` (string), NUNCA o boolean cru.
//
// PDF é PORTRAIT (diferente dos irmãos landscape) — 100% responsabilidade
// do backend, nenhum código de tela muda por causa disso.
//
// SEM grid on-screen (DEC-043, migração as-is estrita) — só formulário →
// download PDF/Excel.
//
// Erro do endpoint binário tratado via `parseBlobError` (NÃO
// `extractApiErrorMessage` — bug já documentado em `VacasPrenhas`/
// `DfeReport`, fora de escopo desta Tarefa corrigir aqueles arquivos).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { boolean } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { accumulatedWeighingBatchReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/accumulated-weighing-batch-report-filter-schema';

import {
  downloadAccumulatedWeighingBatchReport,
  getAccumulatedWeighingBatchReportOptions,
} from '@/services/v2/Relatorios/accumulated-weighing-batch-report-service';

import type { Option } from '@/@types/option';
import type {
  AccumulatedWeighingBatchReportFilterForm,
  AccumulatedWeighingBatchReportParams,
} from '@/@types/v2/Relatorios/accumulated-weighing-batch-report';

export default function PesagemLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.accumulatedWeighingBatchReport.report;

  const pristineValues: AccumulatedWeighingBatchReportFilterForm = {
    batch_id: null,
    category_id: null,
    start_date: null,
    end_date: null,
    only_active_batch: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };

  const { control, handleSubmit, watch } = useForm<AccumulatedWeighingBatchReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: accumulatedWeighingBatchReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.accumulatedWeighingBatchReportOptions],
    queryFn: getAccumulatedWeighingBatchReportOptions,
  });

  const categories = optionsQuery.data?.categories ?? [];
  const batches = optionsQuery.data?.batches ?? [];

  const categoryOptions: Option<string>[] = categories.map((category) => ({
    value: category.uuid,
    label: category.label,
  }));

  const batchOptions: Option<string>[] = batches.map((batch) => ({
    value: batch.uuid,
    label: batch.label,
  }));

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: AccumulatedWeighingBatchReportFilterForm
  ): AccumulatedWeighingBatchReportParams {
    return {
      batch_id: data.batch_id?.value || undefined,
      category_id: data.category_id?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      only_active_batch: data.only_active_batch
        ? data.only_active_batch.value
          ? '1'
          : '0'
        : undefined,
      format: data.format?.value || undefined,
    };
  }

  const reportMutation = useMutation({
    mutationFn: (params: AccumulatedWeighingBatchReportParams) =>
      downloadAccumulatedWeighingBatchReport(params),
    onSuccess: (blob, variables) => {
      if ((variables.format ?? 'pdf') === 'pdf') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'pesagem-lote.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 TAMBÉM como
      // `Blob` — `parseBlobError` extrai o envelope real `{message,
      // errors}`. NÃO usar `extractApiErrorMessage` aqui (falha silenciosa
      // em endpoint binário — bug já documentado em
      // `VacasPrenhas`/`DfeReport`, fora de escopo corrigir aqueles).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.errorToast,
      });
    },
  });

  function onSubmit(data: AccumulatedWeighingBatchReportFilterForm) {
    reportMutation.mutate(buildParams(data));
  }

  const isGenerating = reportMutation.isPending;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!hasValidRange || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
            <Controller
              name="batch_id"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={batchOptions}
                  loading={optionsQuery.isPending}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="category_id"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={categoryOptions}
                  loading={optionsQuery.isPending}
                  isDisabled={isGenerating}
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
            </Box>

            <Controller
              name="only_active_batch"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.onlyActiveBatch}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={boolean.options(languageGB)}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.format}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
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
