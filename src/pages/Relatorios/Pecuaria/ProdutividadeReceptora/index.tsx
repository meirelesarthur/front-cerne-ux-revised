// src/pages/Relatorios/Pecuaria/ProdutividadeReceptora/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba OU Excel
// download) de Produtividade de Vaca Receptora — Relatórios > Pecuária
// (lote 079, F-307-plano-frontend.md §5 TASK-F307-FE-02). Consome
// `GET /api/v1/receiver-cow-productivity-report`
// (F-307-contrato-legado.md), permissão `receiver-cow-productivity-report_view`
// (rota + menu, TASK-F307-FE-03). Sem grid on-screen, mirror estrutural
// EXATO de `Relatorios/Pecuaria/{VacasPrenhas,HistoricoReprodutivo}/index.tsx`
// (mesmo domínio reprodutivo, mesma backend-mirror family
// `BreedingMatingRepositoryInterface`).
//
// Divergência explícita registrada (contrato F-307 §4): a ORDEM dos campos
// segue o DOM do legado desta feature — animal → start_date → end_date →
// report_type (diferente da ordem visual dos 2 irmãos, que colocam as
// datas primeiro) — e `animal` é OBRIGATÓRIO (os 2 irmãos deixam
// `animal`/`batch` opcionais; aqui é fiel ao contrato-alvo API §3/FLD-02).
//
// `<Form onSubmit={preventDefault}>` cru dentro do `FormContainer`, NÃO o
// drawer `Form.BodyFilter`/`FooterFilter` — esta tela não tem grid.
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

import { columnsForm } from '@/constants/coluns-form';

import { receiverCowProductivityReportFilterSchema } from '@/validations/schemas/BreedingMating/receiver-cow-productivity-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import {
  downloadReceiverCowProductivityReport,
  type ReceiverCowProductivityReportFilterParams,
} from '@/services/v2/BreedingMating/receiver-cow-productivity-report-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';

// Form values desta tela (page-scoped) — `animal`/`type` viram
// `Option<...>` (widgets Chakra); convertidos para o payload flat
// `ReceiverCowProductivityReportFilterParams` no submit.
interface ProdutividadeReceptoraReportFormValues {
  animal: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  type: Option<0 | 1>;
}

export default function ProdutividadeReceptoraRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.breedingMatings.receiverCowProductivityReport;

  const reportTypeOptions: Option<0 | 1>[] = [
    { label: text.reportTypeOptions.pdf, value: 0 },
    { label: text.reportTypeOptions.excel, value: 1 },
  ];

  const { control, handleSubmit, watch } = useForm<ProdutividadeReceptoraReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(receiverCowProductivityReportFilterSchema(languageGB)) as any,
    defaultValues: {
      animal: null,
      start_date: null,
      end_date: null,
      type: reportTypeOptions[0],
    },
  });

  const animalValue = watch('animal');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botão desabilitado até animal + as 2 datas estarem preenchidos (mirror
  // `hasValidRange` de `VacasPrenhas`/`HistoricoReprodutivo`, estendido para
  // exigir `animal` também — aqui é obrigatório, lá não era). A validação
  // `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!animalValue && !!startDateValue && !!endDateValue;

  // `useMutation` direto (mirror `VacasPrenhas`/`HistoricoReprodutivo`) —
  // resposta binária (PDF|Excel conforme `type`), síncrona. `type` decide o
  // FORMATO da resposta, não filtra dados.
  const reportMutation = useMutation({
    mutationFn: (params: ReceiverCowProductivityReportFilterParams) =>
      downloadReceiverCowProductivityReport(params),
    onSuccess: (blob, variables) => {
      if (variables.report_type === 1) {
        downloadBlob(blob, 'produtividade-receptora.xlsx');
      } else {
        // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
        // downloadBlob (forçaria download, quebrando a fidelidade ao legado).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
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

  function onSubmit(data: ProdutividadeReceptoraReportFormValues) {
    reportMutation.mutate({
      animal_id: data.animal?.value as string,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      report_type: data.type.value,
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
          <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
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
