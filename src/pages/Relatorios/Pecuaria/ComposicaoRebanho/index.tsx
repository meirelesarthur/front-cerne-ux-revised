// src/pages/Relatorios/Pecuaria/ComposicaoRebanho/index.tsx
// -----------------------------------------------------------------------------
// Tela "Composição Rebanho — Relatório" (F-269, lote 079,
// F-269-plano-frontend.md §6 TASK-F269-FE-02). Rota
// `/relatorios/pecuaria/composicao-rebanho`, materializa o item de menu
// FILHO `rel-pec-composicao-rebanho`, sob o grupo/submenu `rel-pec`
// ("Pecuária", `navigationTree.ts`).
//
// Mirror ESTRUTURAL TRIPLO (F-269-plano-frontend.md §3 "Mirrors escolhidos"):
//   - `Relatorios/Pecuaria/NutricaoConsumoLote/index.tsx` (F-288) — endpoint
//     `options()` COMBINADO (`{batches,breeds,categories}` em 1 única
//     `useQuery`), `Select` estático alimentado pelo array já resolvido (SEM
//     `SelectAsyncPaginate`/paginação remota — §4 do plano, decisão
//     arquitetural: as 3 listas já vêm com escopo de negócio fechado no
//     backend, nenhuma delas justifica paginação).
//   - `Relatorios/Financeiro/ContasAReceber/index.tsx` (F-271) — seletor de
//     colunas via `ReportColumnsField` (catálogo LOCAL, ordem preservada,
//     NUNCA reordenada) + `order`/`order_direction` + botão desabilitado
//     quando `columns.length === 0`.
//   - `Relatorios/Pecuaria/DeathAnimalReport/index.tsx` (F-254) — campo
//     `report_type` ('pdf'|'excel', NUNCA 'type_report'/'format' — CL-24),
//     1 endpoint/1 botão (mirror `Inventario`, ver §8 do plano), extensão do
//     arquivo baixado derivada de `report_type` (`excel` → `.xlsx`).
//
// Nomes de campo/parâmetro CONFIRMADOS por leitura DIRETA do código real da
// API (`HerdCompositionReportRequest::rules()`) ANTES de codar — DIVERGEM
// dos nomes assumidos no plano (`batch_id`/`breed_id`/`category_id`): os
// nomes REAIS são `batch`/`breed_uuid`/`category_uuid` (ver
// `@/@types/v2/Relatorios/herd-composition-report.ts`).
//
// `batch`/`breed`/`category` alimentados EXCLUSIVAMENTE pelo `options()`
// DEDICADO deste relatório (`getHerdCompositionReportOptions`) — NUNCA pelos
// serviços genéricos de entidade (`listBatchOptionsForForm`/
// `listBreedOptions`/`listCategoryAnimalOptions`), decisão arquitetural §4 do
// plano: o backend já aplica escopo de negócio ESPECÍFICO (lote só ACTIVE da
// fazenda, raça só `is_enabled`, categoria só do tenant) que os serviços
// genéricos não replicam 1:1.
//
// `gender`/`status` reaproveitam os enums GLOBAIS já existentes
// (`genderOptions`/`animalStatusOptions`) — nenhuma fábrica nova (§3 do
// plano: "NENHUM mirror de tela necessário").
//
// Guardrail farm-scoped (FRONT-15, mirror `SanitarioLote`) — só `batch` é
// resetado na troca de fazenda ativa: é o ÚNICO dos 3 selects do `options()`
// escopado por FAZENDA (`BatchRepository::listOptionsForFarm`); `breed` é
// GLOBAL (`is_enabled`, sem tenant/farm-scope) e `category` é escopado por
// TENANT (`listOptionsForTenantCostCenter`, CL-30) — tenant não muda ao
// trocar de fazenda dentro da mesma sessão, logo não precisa reset. A lista
// do `options()` em si não precisa de refetch dedicado por fazenda: o
// `FarmSwitcher` já dispara `queryClient.invalidateQueries()` GLOBAL
// (`components/FarmSwitcher/index.tsx`) em toda troca de fazenda, mirror
// EXATO do mesmo mecanismo que `NutricaoConsumoLote`/`ManejoLote` já confiam
// (nenhum dos dois inclui `activeFarmUuid` na queryKey do `options()`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { NumberInput } from '@/components/Form/NumberInput';
import { ReportColumnsField } from '@/components/Form/ReportColumnsField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { animalStatusOptions } from '@/constants/pecuaria/animal/options/animal-status-options';
import { genderOptions } from '@/constants/pecuaria/categoryAnimal/options/gender-options';
import { queryKey } from '@/constants/query-key';
import { herdCompositionReportColumnOptions } from '@/constants/Relatorios/herd-composition-report/options/herd-composition-report-column-options';
import { herdCompositionReportFormatOptions } from '@/constants/Relatorios/herd-composition-report/options/herd-composition-report-format-options';
import { herdCompositionReportOrderDirectionOptions } from '@/constants/Relatorios/herd-composition-report/options/herd-composition-report-order-direction-options';
import { herdCompositionReportOrderOptions } from '@/constants/Relatorios/herd-composition-report/options/herd-composition-report-order-options';

import { herdCompositionReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/herd-composition-report-filter-schema';

import {
  downloadHerdCompositionReport,
  getHerdCompositionReportOptions,
} from '@/services/v2/Relatorios/herd-composition-report-service';

import type { Option } from '@/@types/option';
import type {
  HerdCompositionReportFilterForm,
  HerdCompositionReportParams,
} from '@/@types/v2/Relatorios/herd-composition-report';

export default function ComposicaoRebanhoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.herdCompositionReport.report;

  const buildPristineValues = (): HerdCompositionReportFilterForm => ({
    batch: null,
    gender: null,
    breed: null,
    category: null,
    start_date: null,
    end_date: null,
    weight_min: null,
    weight_max: null,
    status: null,
    columns: [],
    order: herdCompositionReportOrderOptions.getOption('entry_date', languageGB),
    order_direction: herdCompositionReportOrderDirectionOptions.getOption('asc', languageGB),
    format: herdCompositionReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch, setValue } = useForm<HerdCompositionReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: herdCompositionReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.herdCompositionReportOptions],
    queryFn: getHerdCompositionReportOptions,
  });

  const batches = optionsQuery.data?.batches ?? [];
  const breeds = optionsQuery.data?.breeds ?? [];
  const categories = optionsQuery.data?.categories ?? [];

  const batchOptions: Option<string>[] = batches.map((batch) => ({
    value: batch.uuid,
    label: batch.label,
  }));
  const breedOptions: Option<string>[] = breeds.map((breed) => ({
    value: breed.uuid,
    label: breed.label,
  }));
  const categoryOptions: Option<string>[] = categories.map((category) => ({
    value: category.uuid,
    label: category.label,
  }));

  // Guardrail farm-scoped (FRONT-15) — só `batch` é escopado por FAZENDA
  // (`options()` §4 do plano); `breed`(GLOBAL)/`category`(TENANT) não
  // precisam reset (ver cabeçalho do arquivo).
  useEffect(() => {
    setValue('batch', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  const watchedColumns = watch('columns');

  function buildParams(data: HerdCompositionReportFilterForm): HerdCompositionReportParams {
    return {
      batch: data.batch?.value || undefined,
      gender: data.gender?.value || undefined,
      breed_uuid: data.breed?.value || undefined,
      category_uuid: data.category?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      weight_min: data.weight_min ?? undefined,
      weight_max: data.weight_max ?? undefined,
      status: data.status?.value || undefined,
      columns: data.columns,
      order: data.order?.value || undefined,
      order_direction: data.order_direction?.value || undefined,
      report_type: data.format?.value || undefined,
    };
  }

  async function handleDownload(data: HerdCompositionReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadHerdCompositionReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `composicao-rebanho.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `NutricaoConsumoLote`/`ContasAReceber`/`DeathAnimalReport`).
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
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading || watchedColumns.length === 0}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="batch"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={batchOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.gender}
                  placeholder={text.genderPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={genderOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="breed"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.breed}
                  placeholder={text.breedPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={breedOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={categoryOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Controller
              name="weight_min"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  allowDot
                  name={field.name}
                  label={text.fields.weightMin}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={0}
                  decimalPlaces={2}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="weight_max"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  allowDot
                  name={field.name}
                  label={text.fields.weightMax}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={0}
                  decimalPlaces={2}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  placeholder={text.statusPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={animalStatusOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="order"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.order}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={herdCompositionReportOrderOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="order_direction"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.orderDirection}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={herdCompositionReportOrderDirectionOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={herdCompositionReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          <Controller
            name="columns"
            control={control}
            render={({ field }) => (
              <ReportColumnsField
                label={text.columnsFieldLabel}
                catalog={herdCompositionReportColumnOptions.options(languageGB)}
                value={field.value}
                onChange={field.onChange}
                searchPlaceholder={text.columnsSearchPlaceholder}
                emptyMessage={text.columnsEmptyMessage}
                selectAllLabel={text.selectAll}
                deselectAllLabel={text.deselectAll}
              />
            )}
          />
        </VStack>
      </Form>
    </FormContainer>
  );
}
