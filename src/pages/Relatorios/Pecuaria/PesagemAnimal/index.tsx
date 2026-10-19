// src/pages/Relatorios/Pecuaria/PesagemAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pesagem/Animal — Relatório" (feature F-334,
// `CONTRATO-F334-pesagem-animal.md`). Rota alvo (BLOCO DE FIAÇÃO, ainda NÃO
// registrada — ver comentário de rodapé deste arquivo)
// `/relatorios/pecuaria/pesagem-animal`, item de menu FILHO sob o
// grupo/submenu `rel-pec` ("Pecuária", `navigationTree.ts`), MESMA posição
// do irmão `PesagemLote` (`rel-pec-pes`). Consome `GET
// /api/v1/weighing-batch-report/options` + `GET
// /api/v1/weighing-batch-report?...&format=pdf|xlsx`.
//
// Mirror ESTRUTURAL de `Relatorios/Pecuaria/PesagemLote/index.tsx` (irmã
// direta, mesmo arquétipo comportamental): único botão "Gerar Relatório",
// `useMutation` (TanStack), campo do próprio formulário decide o FORMATO da
// mesma resposta binária (PDF `Content-Disposition: inline` →
// `URL.createObjectURL(blob)` + `window.open`, NUNCA `downloadBlob` para o
// PDF; Excel → `downloadBlob`). F-334 é 1 linha por PESAGEM (sem MAX/MIN),
// diferença que vive inteiramente no backend — sem impacto na FORMA desta
// tela.
//
// DIVERGÊNCIA do irmão: SEM `only_active_batch` (ausente em
// `WeighingBatchReportRequest::rules()`); COM `animal_id` (NOVO) — lookup
// reaproveitado de `GET /api/v1/animals/options` (já migrado,
// `AnimalController::options`, `SelectAsyncPaginate` + `listAnimalOptions`,
// mirror `FilterSideAnimal.tsx`), NÃO um endpoint novo desta Tarefa.
//
// PDF é LANDSCAPE (mirror `WeighingBatchReportController::__invoke`,
// orientação explícita), diferente do irmão "Pesagem/Lote" (portrait) — 100%
// responsabilidade do backend, nenhum código de tela muda por causa disso.
//
// SEM grid on-screen (mirror DEC-043 do irmão) — só formulário → download
// PDF/Excel.
//
// Erro do endpoint binário tratado via `parseBlobError` (NÃO
// `extractApiErrorMessage` — mesmo cuidado do irmão `PesagemLote`).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { weighingBatchReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/weighing-batch-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import {
  downloadWeighingBatchReport,
  getWeighingBatchReportOptions,
} from '@/services/v2/Relatorios/weighing-batch-report-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type {
  WeighingBatchReportFilterForm,
  WeighingBatchReportParams,
} from '@/@types/v2/Relatorios/weighing-batch-report';

export default function PesagemAnimalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.weighingBatchReport.report;

  const pristineValues: WeighingBatchReportFilterForm = {
    batch_id: null,
    category_id: null,
    animal_id: null,
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };

  const { control, handleSubmit, watch } = useForm<WeighingBatchReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: weighingBatchReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.weighingBatchReportOptions],
    queryFn: getWeighingBatchReportOptions,
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

  function buildParams(data: WeighingBatchReportFilterForm): WeighingBatchReportParams {
    return {
      batch_id: data.batch_id?.value || undefined,
      category_id: data.category_id?.value || undefined,
      animal_id: data.animal_id?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      format: data.format?.value || undefined,
    };
  }

  const reportMutation = useMutation({
    mutationFn: (params: WeighingBatchReportParams) => downloadWeighingBatchReport(params),
    onSuccess: (blob, variables) => {
      if ((variables.format ?? 'pdf') === 'pdf') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'pesagem-animal.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 TAMBÉM como
      // `Blob` — `parseBlobError` extrai o envelope real `{message,
      // errors}`. NÃO usar `extractApiErrorMessage` aqui (mesmo cuidado do
      // irmão `PesagemLote`).
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

  function onSubmit(data: WeighingBatchReportFilterForm) {
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

            {/* NOVO nesta tela (ausente no irmão "Pesagem/Lote") —
                `SelectAsyncPaginate` porque `animals` é farm-scoped e
                paginado de verdade (mirror `FilterSideAnimal.tsx`), NÃO um
                `Select` estático como batch/category (que vêm inteiros de
                `/options`). */}
            <Controller
              name="animal_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.animal}
                  placeholder={text.animalPlaceholder}
                  service={listAnimalOptions}
                  mapOptions={(item: AnimalOptionListItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isGenerating}
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

// -----------------------------------------------------------------------------
// BLOCO DE FIAÇÃO (pendente — NÃO aplicado por este Executor, modo
// WRITER-PARALELO/EVO-013, arquivos exclusivos desta feature apenas):
//
// 1. Rota SPA + lazy + posição — `src/router/index.tsx`:
//    const PesagemAnimalRelatorio = lazy(() => import('@/pages/Relatorios/Pecuaria/PesagemAnimal'));
//    <Route
//      path="/relatorios/pecuaria/pesagem-animal"
//      element={
//        <RequirePermission permission="weighing-batch-report_view">
//          {lazyRoute(PesagemAnimalRelatorio)}
//        </RequirePermission>
//      }
//    />
//    (mirror EXATO do bloco de `PesagemLoteRelatorio` — `RequirePermission`,
//    NÃO `ProtectedRoute` —, linha ~619/8367 do router; declarar ANTES do
//    catch-all `/relatorios/*`; permissão confere com
//    `WeighingBatchReportController::middleware()`.)
//
// 2. Nav (rel-pec) + permissão + label sidebar —
//    `src/config/v2/navigationTree.ts` (novo item filho sob o grupo
//    `rel-pec`, id NOVO — ex. `rel-pec-pan` — `rel-pec-pes` já é do irmão
//    "Pesagem/Lote" —, path `/relatorios/pecuaria/pesagem-animal`, ícone a
//    escolher sem colisão com os irmãos do grupo, mirror do nó
//    `rel-pec-pes` em ~linha 2655) + `src/config/v2/navigationPermissions.ts`
//    (`'rel-pec-pan': { permission: 'weighing-batch-report_view' }`, mirror
//    `rel-pec-pes` em ~linha 1109-1114) + `languageSidebar.ts` (label do
//    item, 3 idiomas).
//
// 3. i18n modular + registro — ARQUIVOS JÁ CRIADOS por este Executor:
//    `src/@types/language/module-weighing-batch-report/index.ts` +
//    `src/constants/languages/language{PtBr,EnUs,EsEs}/languageWeighingBatchReport.ts`.
//    FALTA (registro em arquivo-registry, fora do escopo deste modo):
//    - `src/@types/language/index.d.ts`: import
//      `ModuleWeighingBatchReport` de `./module-weighing-batch-report` +
//      campo `weighingBatchReport: ModuleWeighingBatchReport;` na interface
//      `LanguageDate` (mirror linha ~782, `accumulatedWeighingBatchReport`).
//    - `src/constants/languages/language{PtBr,EnUs,EsEs}/index.ts`: import
//      `languageWeighingBatchReport` do módulo criado + entrada
//      `weighingBatchReport: { ...languageWeighingBatchReport }` no objeto
//      do idioma (mirror linha ~791/18, `accumulatedWeighingBatchReport`).
//
// 4. Permissão/query-key —
//    `src/constants/query-key.ts`: adicionar
//    `weighingBatchReportOptions: 'weighing-batch-report-options'` em
//    `relatorios` (mirror `accumulatedWeighingBatchReportOptions`); após
//    isso, trocar `WEIGHING_BATCH_REPORT_OPTIONS_QUERY_KEY` (topo deste
//    arquivo) por `queryKey.relatorios.weighingBatchReportOptions`.
//    Permissão `weighing-batch-report_view` já existe seedada
//    (`PermissionTree.php:3158-3164`, DEC-260) — só falta o mapeamento de
//    rota→permissão no item 2 acima.
// -----------------------------------------------------------------------------
