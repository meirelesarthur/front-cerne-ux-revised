// src/pages/Relatorios/Agricultura/OcorrenciasTalhoes/index.tsx
// -----------------------------------------------------------------------------
// Tela "Ocorrências Talhões — Relatório" (F-232, Tarefa 50, esteira
// CORE_WORKSPACE/97-Esteiras/015). Rota
// `/relatorios/agricultura/ocorrencias-talhoes`, materializa o item de menu
// FILHO NOVO `rel-agr-ocor`, sob o grupo/submenu `rel-agr` ("Agricultura",
// `navigationTree.ts`), logo após `rel-agr-apo`. Consome `GET
// /api/v1/appropriation-occurrences-report/options` + `GET
// /api/v1/appropriation-occurrences-report` — gera UM único PDF, aberto
// INLINE em nova aba, SEM grid on-screen.
//
// Composição de 3 precedentes já entregues em produção (contrato de tela
// `frontend-contract-ocorrencias-talhoes.md §1/§3`, sem página-modelo
// dedicada no Storybook `cerne` — UX-GAP parcial, não bloqueante), com 4
// divergências deliberadas (NÃO uniformizar de volta ao padrão dos
// precedentes):
//   1. `Relatorios/Pecuaria/PesagemLote/index.tsx` (F-238) — CASCA
//      (`FormContainer` + `SimpleGrid` + footer 1 botão), padrão `useQuery`
//      de `options`, dispatch `useMutation` com PDF inline
//      (`URL.createObjectURL`+`window.open`) — MAS aqui NÃO existe campo
//      `format`/branch Excel (a API só devolve `application/pdf`).
//   2. `Relatorios/Agricultura/PrevisaoAreaReceita/index.tsx` (F-280) —
//      ARQUÉTIPO da cascata Ciclo→Áreas/Datas (reset bidirecional) — MAS
//      aqui a cascata é SEM query extra: `options` já traz `areas[]`
//      aninhadas em cada `production_cycle`
//      (`useOcorrenciasTalhoesProductionCycleCascade`, derivação 100% local).
//   3. `Relatorios/Financeiro/JurosRecebidos/index.tsx` (F-232-sibling) —
//      técnica de campo declarado-mas-inerte enviado NORMALMENTE
//      (`proprietary_uuid` lá; `production_cycle_uuid` aqui, DEC-043-style,
//      NÃO omitido do payload) e tratamento `parseBlobError` em endpoint
//      binário.
//   4. SEM campo Fazenda — a fazenda vem 100% do header `X-Farm-Id`
//      (automático no client); não há `farm_uuid` no contrato de API desta
//      feature.
//
// Erro do endpoint binário tratado via `parseBlobError` (NUNCA
// `extractApiErrorMessage`, que não sabe ler `Blob`) — `responseType:'blob'`
// sempre, inclusive erro 422/403.
//
// Rota TAMBÉM gateada por `appropriation-occurrences-report_view` (não só o
// item de menu) — a API corrigiu a autorização por construção (FID-G3A #1 da
// API), mirror `ApontamentoMaquina`/`PrevisaoAreaReceita`.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { appropriationOccurrenceReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/Agricultura/appropriation-occurrence-report-filter-schema';

import {
  downloadAppropriationOccurrenceReport,
  getAppropriationOccurrenceReportOptions,
} from '@/services/v2/Relatorios/Agricultura/appropriation-occurrence-report-service';

import type { Option } from '@/@types/option';
import type {
  AppropriationOccurrenceReportFilterForm,
  AppropriationOccurrenceReportParams,
} from '@/@types/v2/Relatorios/Agricultura/appropriationOccurrenceReport';

import { useOcorrenciasTalhoesProductionCycleCascade } from './useOcorrenciasTalhoesProductionCycleCascade';

const pristineValues: AppropriationOccurrenceReportFilterForm = {
  production_cycle_uuid: null,
  area_uuids: null,
  start_date: null,
  end_date: null,
};

export default function OcorrenciasTalhoesRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.appropriationOccurrenceReport.report;

  const { control, handleSubmit, watch, setValue } =
    useForm<AppropriationOccurrenceReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: appropriationOccurrenceReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    });

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.appropriationOccurrenceReportOptions],
    queryFn: getAppropriationOccurrenceReportOptions,
  });

  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areas = optionsQuery.data?.areas ?? [];

  const productionCycleOptions: Option<string>[] = productionCycles.map((cycle) => ({
    label: cycle.code,
    value: cycle.uuid,
  }));

  const areaOptions: Option<string>[] = areas.map((area) => ({
    label: area.description,
    value: area.uuid,
  }));

  const { handleProductionCycleSelect, handleManualFieldChange } =
    useOcorrenciasTalhoesProductionCycleCascade({ setValue, productionCycles });

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: AppropriationOccurrenceReportFilterForm
  ): AppropriationOccurrenceReportParams {
    return {
      // Enviado NORMALMENTE (risco 3, DEC-043-style) — NUNCA omitido, mesmo
      // sendo ignorado server-side.
      production_cycle_uuid: data.production_cycle_uuid?.value || undefined,
      area_uuids: data.area_uuids?.length
        ? data.area_uuids.map((option) => option.value)
        : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  const reportMutation = useMutation({
    mutationFn: (params: AppropriationOccurrenceReportParams) =>
      downloadAppropriationOccurrenceReport(params),
    onSuccess: (blob) => {
      // SEMPRE inline — a API só devolve `application/pdf` (SEM branch de
      // Excel, risco 1). NUNCA `downloadBlob` para esta tela.
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422/403 TAMBÉM como
      // `Blob` — `parseBlobError` extrai o envelope real `{message,
      // errors}`. NÃO usar `extractApiErrorMessage` aqui (não sabe ler Blob).
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

  function onSubmit(data: AppropriationOccurrenceReportFilterForm) {
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
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="production_cycle_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.fields.productionCycle}
                placeholder={text.productionCyclePlaceholder}
                name={name}
                value={value}
                onChange={(option: Option<string> | null) => {
                  onChange(option);
                  handleProductionCycleSelect(option);
                }}
                options={productionCycleOptions}
                loading={optionsQuery.isPending}
                isDisabled={isGenerating}
              />
            )}
          />

          <Controller
            name="area_uuids"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.fields.areas}
                placeholder={text.areasPlaceholder}
                name={name}
                value={value ?? null}
                onChange={(options: Option<string>[] | null) => {
                  onChange(options ?? []);
                  handleManualFieldChange();
                }}
                options={areaOptions}
                multiple
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
                <DateInput
                  value={value ?? null}
                  onChange={(date) => {
                    onChange(date);
                    handleManualFieldChange();
                  }}
                  disabled={isGenerating}
                />
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
                <DateInput
                  value={value ?? null}
                  onChange={(date) => {
                    onChange(date);
                    handleManualFieldChange();
                  }}
                  disabled={isGenerating}
                />
              )}
            />
          </Box>
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
