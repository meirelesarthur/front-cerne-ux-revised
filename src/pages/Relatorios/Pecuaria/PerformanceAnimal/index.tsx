// src/pages/Relatorios/Pecuaria/PerformanceAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba OU Excel download)
// de Performance Animal Individual — Relatórios > Pecuária (F-234,
// TASK-FE-PA-01). Consome `GET /batch-profitability-report`
// (contrato-api-performance-animal.md §4), SEM `RequirePermission` na rota
// (`DEC-DOM-19`, mirror `EvolucaoRebanhoRelatorio`/`GAP-EVO-01` — o servidor
// não enforce permissão nesse endpoint, só o item de MENU é gateado). Sem
// grid on-screen (fiel ao legado — o relatório é seu próprio output).
//
// SÍNTESE de 2 precedentes (Tarefa 57 §"Leitura do dev"):
//   - Casca visual + comportamento de export: mirror ESTRUTURAL
//     `Relatorios/Pecuaria/VacasPrenhas/index.tsx` — UM ÚNICO botão "Gerar
//     Relatório", `useMutation` (TanStack), campo `type` do próprio
//     formulário decide o FORMATO (0=PDF inline via
//     `URL.createObjectURL(blob)` + `window.open`, 1=Excel via
//     `downloadBlob`). NÃO seguir o padrão de 2 botões/2 useState de
//     `ApontamentoMaquina/index.tsx` (referência de casca só) — aqui `type`
//     já está no formulário, dispensa 2 botões.
//   - ÚNICO ponto de atenção NOVO vs. os 2 precedentes (nenhum tem filtro
//     alternável): cascata `sale ↔ (batch, start_date, end_date)` — mirror
//     `IG-01` do contrato legado. Preencher `sale` LIMPA e DESABILITA
//     `batch`/`start_date`/`end_date` (cascata client-side, sem AJAX);
//     esvaziar `sale` reverte (reabilita). `batch` é SEMPRE opcional e
//     combinável com qualquer um dos 2 caminhos (`sale` OU período) — só
//     fica desabilitado quando `sale` está preenchido, mirror `IG-01`.
//
// Gate de habilitação do botão "Gerar Relatório": `(!!sale) ||
// (!!start_date && !!end_date)` — mirror `hasValidRange` de `VacasPrenhas`,
// adaptado à condição OU (não é só "as 2 datas preenchidas").
//
// Lookup de venda (`sale`, risco 2 da Tarefa 57) — `listBillableMovementSaleOptions`
// (`batch-profitability-report-service.ts`) envolve `listMovementSales`
// filtrando `status === 'F'` NO CLIENTE (`GET /movement-sales/options`
// dedicado não existe, `GAP-VD-02` herdado — busca textual do combobox sem
// efeito real até o backend corrigir o DTO). Não é regressão desta tela.
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

import { batchProfitabilityReportFilterSchema } from '@/validations/schemas/BatchProfitability/batch-profitability-report-filter-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  downloadBatchProfitabilityReport,
  listBillableMovementSaleOptions,
  type BatchProfitabilityReportFilterParams,
} from '@/services/v2/BatchProfitability/batch-profitability-report-service';

import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';

// Form values desta tela (page-scoped) — `sale`/`batch` viram
// `Option<string>|null` (widgets `SelectAsyncPaginate`), convertidos para o
// payload flat `BatchProfitabilityReportFilterParams` no submit.
interface PerformanceAnimalReportFormValues {
  sale: Option<string> | null;
  batch: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  type: Option<0 | 1>;
}

export default function PerformanceAnimalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.batches.batch.report;

  const reportTypeOptions: Option<0 | 1>[] = [
    { label: text.reportTypeOptions.pdf, value: 0 },
    { label: text.reportTypeOptions.excel, value: 1 },
  ];

  const { control, handleSubmit, watch, setValue } = useForm<PerformanceAnimalReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(batchProfitabilityReportFilterSchema(languageGB)) as any,
    defaultValues: {
      sale: null,
      batch: null,
      start_date: null,
      end_date: null,
      type: reportTypeOptions[0],
    },
  });

  const saleValue = watch('sale');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Gate OU (mirror `hasValidRange` de `VacasPrenhas`, adaptado à cascata
  // `IG-01`) — `sale` sozinho OU as 2 datas preenchidas habilitam o botão. A
  // validação `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidGate = !!saleValue || (!!startDateValue && !!endDateValue);

  // Cascata `IG-01` — `batch`/`start_date`/`end_date` ficam desabilitados
  // (readonly/disabled) quando `sale` está preenchido; `batch` continua
  // sempre combinável (nunca desabilitado pelo período).
  const isCascadeDisabledBySale = !!saleValue;

  // Preencher `sale` LIMPA `batch`/`start_date`/`end_date` (cascata
  // client-side, sem AJAX, mirror `IG-01`) — esvaziar `sale` apenas
  // reabilita os campos (não repõe valor nenhum, nada a reverter).
  function handleSaleChange(option: Option<string> | null) {
    setValue('sale', option, { shouldValidate: true, shouldDirty: true });
    if (option) {
      setValue('batch', null, { shouldValidate: true, shouldDirty: true });
      setValue('start_date', null, { shouldValidate: true, shouldDirty: true });
      setValue('end_date', null, { shouldValidate: true, shouldDirty: true });
    }
  }

  // `useMutation` direto (mirror `VacasPrenhas`) — resposta binária
  // (PDF|Excel conforme `type`), síncrona. `type` decide o FORMATO da
  // resposta, não filtra dados.
  const reportMutation = useMutation({
    mutationFn: (params: BatchProfitabilityReportFilterParams) =>
      downloadBatchProfitabilityReport(params),
    onSuccess: (blob, variables) => {
      if (variables.type === 0) {
        // PDF `Content-Disposition: inline` (`GbCerneSnappyReport::inline`) —
        // abre em nova aba, NUNCA downloadBlob (forçaria download, quebrando
        // a fidelidade ao precedente/legado).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'performance-animal.xlsx');
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

  function onSubmit(data: PerformanceAnimalReportFormValues) {
    reportMutation.mutate({
      sale_id: data.sale?.value || undefined,
      batch_id: data.batch?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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
            disabled={!hasValidGate || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.fiveColumns} gap={4}>
            <Box>
              <Controller
                name="sale"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.sale}
                    service={listBillableMovementSaleOptions}
                    mapOptions={(item: Option<string>) => ({
                      label: item.label,
                      value: item.value,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => handleSaleChange(option ?? null)}
                    isReadOnly={isGenerating}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
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
                    isReadOnly={isGenerating || isCascadeDisabledBySale}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filters.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={isGenerating || isCascadeDisabledBySale}
                  />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filters.endDate}
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={isGenerating || isCascadeDisabledBySale}
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

          {!hasValidGate && (
            <Text fontSize="sm" color="fg.muted">
              {text.hint.saleOrPeriodRequired}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
