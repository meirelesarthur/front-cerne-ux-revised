// src/pages/Relatorios/Pecuaria/HistoricoReprodutivo/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba OU Excel download)
// de Histórico Reprodutivo — Relatórios > Pecuária (execução 074,
// historico-reprodutivo-contrato-front.md §4/§5). Consome
// `GET /api/v1/reproductive-history-report` (historico-reprodutivo-contrato-
// api.md), permissão `reproductive-history-report_view` (rota + menu, item
// 21 — Tarefa seguinte). Sem grid on-screen, mirror estrutural EXATO de
// `Relatorios/Pecuaria/VacasPrenhas/index.tsx` (mesmo domínio reprodutivo,
// mesmo backend-mirror family `PregnantCowsReportController`) — 5 campos (não
// 6 — sem `insemination_type`/`animal`/`diagnosis_pregnancy`, que não existem
// no contrato desta feature).
//
// Divergência explícita registrada (contrato front §2): `<Form
// onSubmit={preventDefault}>` cru dentro do `FormContainer`, NÃO o drawer
// `Form.BodyFilter`/`FooterFilter` (Contrato B) — esta tela não tem grid.
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

import { reproductiveStatusOptions } from '@/constants/pecuaria/animal/options/reproductive-status-options';
import { columnsForm } from '@/constants/coluns-form';

import { reproductiveHistoryReportFilterSchema } from '@/validations/schemas/BreedingMating/reproductive-history-report-filter-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  downloadReproductiveHistoryReport,
  type ReproductiveHistoryReportFilterParams,
} from '@/services/v2/BreedingMating/reproductive-history-report-service';

import type { Option } from '@/@types/option';
import type { AnimalReproductiveStatus } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';

// Form values desta tela (page-scoped) — `batch`/`reproductive_status` viram
// `Option<...>|null` (widgets Chakra); convertidos para o payload flat
// `ReproductiveHistoryReportFilterParams` no submit.
interface HistoricoReprodutivoReportFormValues {
  start_date: string | null;
  end_date: string | null;
  batch: Option<string> | null;
  reproductive_status: Option<AnimalReproductiveStatus> | null;
  type: Option<0 | 1>;
}

export default function HistoricoReprodutivoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.breedingMatings.reproductiveHistoryReport;

  const reportTypeOptions: Option<0 | 1>[] = [
    { label: text.reportTypeOptions.pdf, value: 0 },
    { label: text.reportTypeOptions.excel, value: 1 },
  ];

  const { control, handleSubmit, watch } = useForm<HistoricoReprodutivoReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(reproductiveHistoryReportFilterSchema(languageGB)) as any,
    defaultValues: {
      start_date: null,
      end_date: null,
      batch: null,
      reproductive_status: null,
      type: reportTypeOptions[0],
    },
  });

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botão desabilitado até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `VacasPrenhas`) — a validação `end_date >= start_date`
  // fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  // `useMutation` direto (mirror `DfeReport.tsx`/`VacasPrenhas`) — resposta
  // binária (PDF|Excel conforme `type`), síncrona. `type` decide o FORMATO
  // da resposta, não filtra dados.
  const reportMutation = useMutation({
    mutationFn: (params: ReproductiveHistoryReportFilterParams) =>
      downloadReproductiveHistoryReport(params),
    onSuccess: (blob, variables) => {
      if (variables.type === 0) {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // downloadBlob (forçaria download, quebrando a fidelidade ao legado).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'historico-reprodutivo-matrizes.xlsx');
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

  function onSubmit(data: HistoricoReprodutivoReportFormValues) {
    reportMutation.mutate({
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      batch_uuid: data.batch?.value || undefined,
      reproductive_status: data.reproductive_status?.value ?? undefined,
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
                name="reproductive_status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filters.reproductiveStatus}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={reproductiveStatusOptions.options(languageGB)}
                    isDisabled={isGenerating}
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
