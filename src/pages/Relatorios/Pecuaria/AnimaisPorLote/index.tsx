// src/pages/Relatorios/Pecuaria/AnimaisPorLote/index.tsx
// -----------------------------------------------------------------------------
// Tela "Animais por Lote — Relatório" (Tarefa 51, esteira
// CORE_WORKSPACE/97-Esteiras/015). Rota
// `/relatorios/pecuaria/animais-por-lote`, materializa o item de menu FILHO
// `rel-pec-apl`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`). Consome `GET /api/v1/batches/options?
// include_empty=false` (reuso, `listBatchOptionsForForm`), `GET
// /api/v1/animals/options?batch_uuid=` (reuso, `listAnimalOptions`) e `GET
// /api/v1/animals-per-batch-report?...&format=pdf|xlsx`.
//
// Síntese de 2 precedentes já entregues (Referência UX, Tarefa 51
// §"Leitura do dev"):
//   - `Relatorios/Pecuaria/PesagemLote/index.tsx` (Tarefa 49) — CASCA
//     (`FormContainer` + `SimpleGrid` + footer 1 botão), `useMutation` com
//     branch `format` (PDF `Content-Disposition: inline` →
//     `URL.createObjectURL(blob)` + `window.open`; Excel → `downloadBlob`),
//     erro binário via `parseBlobError`.
//   - `Operacional/Perdas/CreateOrUpdateLossAnimal.tsx` — TÉCNICA EXATA da
//     cascata Lote→Animal: `SelectAsyncPaginate` de Animal com
//     `service={listAnimalOptions}`, `findParams={{ search, batch_uuid:
//     batchOption?.value }}`, `cacheUniqs={[batchOption?.value]}`; o
//     `onChange` do Lote chama `setValue('animal_id', null)`.
//
// CORREÇÃO por construção do achado legado `C21` (cascata Lote→Animal
// QUEBRADA no legado, repassada explicitamente pela API ao Arquiteto
// Frontend, `api-contract-animais-por-lote.md §2#2`): a técnica de cascata
// acima JÁ É a correção — `batch_uuid` real filtra server-side via
// `AnimalOptionsRequest`. Não é mudança de comportamento do relatório (que
// sempre filtrou certo no servidor), só conserta o combo quebrado.
//
// `animal_id` só é relevante em `view_type=individual` (Riscos #1 do
// contrato de tela) — ao mudar `view_type` para `aggregated`, o `Select` de
// Animal é DESABILITADO e o valor LIMPO (mirror legado FLD-02, backend
// ignora `animal_id` em silêncio no modo agregado).
//
// SEM grid on-screen — só formulário → PDF inline / download Excel. SEM
// campo Categoria/Data/Fazenda (Riscos #5/#6 do contrato de tela).
//
// Erro do endpoint binário tratado via `parseBlobError` (NÃO
// `extractApiErrorMessage`, mirror `PesagemLote`).
// -----------------------------------------------------------------------------

import { Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { animalsPerBatchReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/animals-per-batch-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { downloadAnimalsPerBatchReport } from '@/services/v2/Relatorios/animals-per-batch-report-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  AnimalsPerBatchReportFilterForm,
  AnimalsPerBatchReportParams,
  AnimalsPerBatchReportViewType,
} from '@/@types/v2/Relatorios/animalsPerBatchReport';

export default function AnimaisPorLoteRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalsPerBatchReport.report;

  const viewTypeOptions: Option<AnimalsPerBatchReportViewType>[] = [
    { value: 'individual', label: text.fields.viewTypeOptions.individual },
    { value: 'aggregated', label: text.fields.viewTypeOptions.aggregated },
  ];

  const pristineValues: AnimalsPerBatchReportFilterForm = {
    batch_id: null,
    view_type: null,
    animal_id: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };

  const { control, handleSubmit, watch, setValue } = useForm<AnimalsPerBatchReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalsPerBatchReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const batchOption = watch('batch_id');
  const viewTypeOption = watch('view_type');
  const hasRequiredFields = !!batchOption && !!viewTypeOption;
  const isAnimalDisabled = !batchOption || viewTypeOption?.value === 'aggregated';

  function buildParams(data: AnimalsPerBatchReportFilterForm): AnimalsPerBatchReportParams {
    return {
      batch_id: data.batch_id!.value,
      view_type: data.view_type!.value,
      animal_id: data.animal_id?.value || undefined,
      format: data.format?.value || undefined,
    };
  }

  const reportMutation = useMutation({
    mutationFn: (params: AnimalsPerBatchReportParams) => downloadAnimalsPerBatchReport(params),
    onSuccess: (blob, variables) => {
      if ((variables.format ?? 'pdf') === 'pdf') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'animais-por-lote.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422/403 TAMBÉM como
      // `Blob` — `parseBlobError` extrai o envelope real `{message,
      // errors}`. NÃO usar `extractApiErrorMessage` aqui (endpoint binário).
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

  function onSubmit(data: AnimalsPerBatchReportFilterForm) {
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
            disabled={!hasRequiredFields || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="batch_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  isRequired
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    // Correção por construção do achado `C21` (contrato de
                    // tela §4) — trocar o Lote invalida a seleção anterior
                    // de Animal.
                    setValue('animal_id', null, { shouldDirty: true });
                  }}
                  isDisabled={isGenerating}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="view_type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.viewType}
                  name={name}
                  value={value}
                  onChange={(option: Option<AnimalsPerBatchReportViewType> | null) => {
                    onChange(option);
                    // Riscos #1 do contrato de tela — modo Agregado
                    // desabilita e limpa o campo Animal (mirror legado
                    // FLD-02).
                    if (option?.value === 'aggregated') {
                      setValue('animal_id', null, { shouldDirty: true });
                    }
                  }}
                  options={viewTypeOptions}
                  isRequired
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="animal_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.animal}
                  placeholder={text.animalPlaceholder}
                  // Correção por construção do achado `C21` — `batch_uuid`
                  // real filtra o combo server-side, mirror EXATO
                  // `CreateOrUpdateLossAnimal::animal_uuid`.
                  service={listAnimalOptions}
                  mapOptions={(item: AnimalOptionListItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    batch_uuid: batchOption?.value,
                  })}
                  cacheUniqs={[batchOption?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isAnimalDisabled || isGenerating}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
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
        </VStack>
      </Form>
    </FormContainer>
  );
}
