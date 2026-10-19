// src/pages/Relatorios/Pecuaria/VacasPrenhas/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba OU Excel download)
// de Vacas Prenhas — Relatórios > Pecuária (Tarefa 46,
// frontend-contract-vacas-prenhas.md, `CONTRATO_AUTOAPROVADO`). Consome
// `GET /pregnant-cows-report` (api-contract-vacas-prenhas.md §8), permissão
// `pregnancy-diagnosis_view` (rota + menu, `GAP-VACAS-01` — a permissão
// reservada `pregnant-cows-report_view` nunca foi seedada no backend novo).
// Sem grid on-screen (fiel ao legado, `CL-16`/`LM-1`, `OQ-6` fechada).
//
// SÍNTESE de 2 precedentes (contrato de tela §1/§3):
//   - Casca visual: mirror `Relatorios/Pecuaria/{SanitarioLote,
//     EvolucaoRebanho}/index.tsx` (`FormContainer` + `footer`, SimpleGrid de
//     campos).
//   - Comportamento de export: mirror `Fiscal/Dfe/DfeReport.tsx` — UM ÚNICO
//     botão "Gerar Relatório", `useMutation` (TanStack, NÃO `useState` local
//     + try/catch/finally dos precedentes de casca), campo `type` do próprio
//     formulário decide o FORMATO da mesma resposta (0=PDF inline via
//     `URL.createObjectURL(blob)` + `window.open`, 1=Excel via
//     `downloadBlob`). O backend devolve `Content-Disposition: inline` para
//     o PDF (mirror `DfeReportController`/`FoodReportController`) —
//     `downloadBlob()` é usado SÓ para o Excel, nunca para o PDF.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
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
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { breedingMatingTypeOptions } from '@/constants/breedingMating/options/breeding-mating-type-options';
import { columnsForm } from '@/constants/coluns-form';

import { pregnantCowsReportFilterSchema } from '@/validations/schemas/BreedingMating/pregnant-cows-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listDiagnosisPregnancyOptions } from '@/services/v2/BaseRegistrations/diagnosisPregnancy-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  downloadPregnantCowsReport,
  type PregnantCowsReportFilterParams,
} from '@/services/v2/BreedingMating/pregnant-cows-report-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { DiagnosisPregnancyOption } from '@/@types/v2/BaseRegistrations/diagnosisPregnancy';
import type { BatchOption } from '@/@types/v2/Batches';
import type { BreedingMatingTypeValue } from '@/@types/v2/BreedingMating';

// Form values desta tela (page-scoped) — `insemination_type`/`batch`/
// `animal`/`diagnosis_pregnancy` viram `Option<...>|null` (widgets Chakra);
// convertidos para o payload flat `PregnantCowsReportFilterParams` no submit.
interface VacasPrenhasReportFormValues {
  start_date: string | null;
  end_date: string | null;
  insemination_type: Option<BreedingMatingTypeValue> | null;
  batch: Option<string> | null;
  animal: Option<string> | null;
  diagnosis_pregnancy: Option<string> | null;
  type: Option<0 | 1>;
}

export default function VacasPrenhasRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.breedingMatings.pregnancyDiagnosis.report;

  const reportTypeOptions: Option<0 | 1>[] = [
    { label: text.reportTypeOptions.pdf, value: 0 },
    { label: text.reportTypeOptions.excel, value: 1 },
  ];

  const { control, handleSubmit, watch } = useForm<VacasPrenhasReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(pregnantCowsReportFilterSchema(languageGB)) as any,
    defaultValues: {
      start_date: null,
      end_date: null,
      insemination_type: null,
      batch: null,
      animal: null,
      diagnosis_pregnancy: null,
      type: reportTypeOptions[0],
    },
  });

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botão desabilitado até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `SanitarioLoteRelatorio`/`EvolucaoRebanhoRelatorio`) —
  // a validação `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  // `useMutation` direto (mirror `DfeReport.tsx`) — resposta binária
  // (PDF|Excel conforme `type`), síncrona. `type` decide o FORMATO da
  // resposta, não filtra dados (`FM-7`/`FLD-2`).
  const reportMutation = useMutation({
    mutationFn: (params: PregnantCowsReportFilterParams) => downloadPregnantCowsReport(params),
    onSuccess: (blob, variables) => {
      if (variables.type === 0) {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // downloadBlob (forçaria download, quebrando a fidelidade ao legado).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'vacas-prenhas.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.errorToast,
      });
    },
  });

  function onSubmit(data: VacasPrenhasReportFormValues) {
    reportMutation.mutate({
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      insemination_type: data.insemination_type?.value ?? undefined,
      batch_uuid: data.batch?.value || undefined,
      animal_uuid: data.animal?.value || undefined,
      diagnosis_pregnancy_uuid: data.diagnosis_pregnancy?.value || undefined,
      type: data.type.value,
    });
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
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filters.startDate}
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
                {text.filters.endDate}
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

            <Box>
              <Controller
                name="insemination_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filters.inseminationType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={breedingMatingTypeOptions.options(languageGB)}
                    isDisabled={isGenerating}
                  />
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
                    label={text.filters.batch}
                    service={listBatchOptionsForForm}
                    mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isReadOnly={isGenerating}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="animal"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.animal}
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
                    isReadOnly={isGenerating}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="diagnosis_pregnancy"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.diagnosisPregnancy}
                    service={listDiagnosisPregnancyOptions}
                    mapOptions={(item: DiagnosisPregnancyOption) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isReadOnly={isGenerating}
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
                    label={text.fields.reportType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={reportTypeOptions}
                    noClearable
                    isDisabled={isGenerating}
                  />
                )}
              />
            </Box>
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.hint.datesRequired}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
