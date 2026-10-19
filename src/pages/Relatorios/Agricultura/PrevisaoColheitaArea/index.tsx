// src/pages/Relatorios/Agricultura/PrevisaoColheitaArea/index.tsx
// -----------------------------------------------------------------------------
// Tela "Previsão Colheita/Área — Relatório" (F-282, esteira 059,
// `CONTRATO-F282-previsao-colheita-area.md` §5), consumindo
// `GET /api/v1/markings/forecast-harvest-area-report` (+ `/options`).
//
// Casco mirror `Relatorios/Agricultura/ProducaoCusteioArea/index.tsx`
// (F-298) — `FormContainer` + footer com 1 botão "Baixar PDF", SEM
// prévia/grid (contrato de API só expõe o binário PDF via
// `GbCerneSnappyReport::inline`), download via `downloadBlob` +
// `parseBlobError` (422-como-Blob).
//
// CASCATA (mirror EXATO `ProducaoCusteioArea` IG-01/IG-02 — 100%
// CLIENT-SIDE sobre o payload ÚNICO de `/options`, sem endpoint de cascata
// dedicado):
//   IG-01 — ao selecionar um `production_cycle`, preenche `areas` (todas as
//   áreas do ciclo) + `start_date`/`end_date` do ciclo escolhido.
//   IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
//   IG-01 ter rodado limpa a seleção de `production_cycle`. Um `useRef`
//   marca a origem da última mudança para não disparar IG-02 na própria
//   escrita de IG-01.
//
// `cultivation` é uuid FLAT resolvido pelo MESMO payload de `/options`
// (`CultivationOptionResource`, label já composto `"{cultura} - {variedade}"`)
// — NÃO usa `SelectCultivation` (padrão de `PrevisaoFazendaReceita`/F-281)
// porque aqui o universo já chega pronto, sem 2ª chamada de rede.
//
// `forecast` (Colheita) é universo ESTÁTICO fechado {1,2,3,4} (mirror
// `MarkingForecastHarvestAreaReportRequest::rules()::forecast`).
//
// `harvest` (aceito pela API, `MarkingForecastHarvestAreaReportRequest`) é
// capacidade DORMENTE (FUP-282-02, docblock do Controller) — NÃO existe
// campo correspondente nesta tela, fiel ao form de referência.
//
// Todos os 7 filtros reais (mais o campo JS-only `production_cycle`) são
// OPCIONAIS — mirror `MarkingForecastHarvestAreaReportRequest::rules()`
// (`nullable` em todos), submit vazio gera o relatório completo. O botão
// "Baixar PDF" só desabilita durante o download em andamento.
//
// Permissão `markings_prev_farm_view` (dupla barreira: `permission:` no
// Controller + `authorize()` no Request) — MESMO slug já reutilizado por
// F-281 (`PrevisaoFazendaReceita`), ver BLOCO DE FIAÇÃO para o registro de
// rota/menu/permissão (NÃO feito por este escritor em modo WRITER-PARALELO).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { markingForecastHarvestAreaReportForecastOrderOptions } from '@/constants/Relatorios/agricultura/marking-forecast-harvest-area-report/options/marking-forecast-harvest-area-report-forecast-order-options';

import { markingForecastHarvestAreaReportFilterSchemaResolver } from '@/validations/schemas/PrevisaoColheitaArea/marking-forecast-harvest-area-report-filter-schema';

import {
  downloadMarkingForecastHarvestAreaReportPdf,
  getMarkingForecastHarvestAreaReportOptions,
} from '@/services/v2/Relatorios/Agricultura/marking-forecast-harvest-area-report-service';

import type { Option } from '@/@types/option';
import type {
  MarkingForecastHarvestAreaProductionCycleOption,
  MarkingForecastHarvestAreaReportFilterForm,
  MarkingForecastHarvestAreaReportParams,
} from '@/@types/v2/Relatorios/Agricultura/markingForecastHarvestAreaReport';

const pristineValues: MarkingForecastHarvestAreaReportFilterForm = {
  production_cycle: null,
  areas: null,
  start_date: null,
  end_date: null,
  cultivation: null,
  forecast: null,
  week: null,
  year: null,
};

/** Origem da última mudança nos campos `areas`/`start_date`/`end_date` —
 * guarda anti-loop de IG-02 (evita resetar `production_cycle` no MESMO
 * ciclo de render em que IG-01 acabou de preenchê-los). Mirror EXATO
 * `ProducaoCusteioArea`. */
type CascadeOrigin = 'user' | 'cascade';

export default function PrevisaoColheitaAreaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.markingForecastHarvestAreaReport.report;

  const { control, handleSubmit, watch, setValue } =
    useForm<MarkingForecastHarvestAreaReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: markingForecastHarvestAreaReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    });

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.markingForecastHarvestAreaReportOptions],
    queryFn: getMarkingForecastHarvestAreaReportOptions,
  });

  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areasUniverse = optionsQuery.data?.areas ?? [];
  const cultivationsUniverse = optionsQuery.data?.cultivations ?? [];

  const productionCycleOptions: Option<string>[] = productionCycles.map((cycle) => ({
    value: cycle.uuid,
    label: cycle.code,
  }));

  const areaOptions: Option<string>[] = areasUniverse.map((area) => ({
    value: area.uuid,
    label: area.description,
  }));

  const cultivationOptions: Option<string>[] = cultivationsUniverse.map((cultivation) => ({
    value: cultivation.uuid,
    label: cultivation.label,
  }));

  const forecastOptions =
    markingForecastHarvestAreaReportForecastOrderOptions(languageGB).options();

  const productionCycleValue = watch('production_cycle');

  // IG-01 — cascata client-side: ao selecionar um ciclo de produção, deriva
  // `areas`/`start_date`/`end_date` do MESMO payload de `/options` (sem 2ª
  // chamada de rede). `shouldDirty:false` — preenchimento derivado de outro
  // campo do MESMO form, não hidratação de servidor (Lei 2/`fillForm` não se
  // aplica aqui). Mirror EXATO `ProducaoCusteioArea` IG-01.
  useEffect(() => {
    if (!productionCycleValue) return;

    const selectedCycle = productionCycles.find(
      (cycle: MarkingForecastHarvestAreaProductionCycleOption) =>
        cycle.uuid === productionCycleValue.value
    );
    if (!selectedCycle) return;

    cascadeOriginRef.current = 'cascade';
    setValue(
      'areas',
      selectedCycle.areas.map((area) => ({ value: area.uuid, label: area.description })),
      { shouldDirty: false }
    );
    setValue('start_date', selectedCycle.start_date, { shouldDirty: false });
    setValue('end_date', selectedCycle.end_date, { shouldDirty: false });
    // Dependência intencionalmente restrita a `productionCycleValue` —
    // `productionCycles`/`setValue` são estáveis por render (mirror do
    // padrão já usado na tela-irmã).
  }, [productionCycleValue]);

  // IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
  // IG-01 ter rodado desfaz a associação visual ao ciclo. Não dispara na
  // própria escrita de IG-01 (guarda `cascadeOriginRef`). Mirror EXATO
  // `ProducaoCusteioArea`.
  function handleManualAreasChange(value: Option<string>[] | null) {
    if (cascadeOriginRef.current !== 'cascade') {
      setValue('production_cycle', null, { shouldDirty: false });
    }
    cascadeOriginRef.current = 'user';
    setValue('areas', value, { shouldDirty: true });
  }

  function handleManualDateChange(field: 'start_date' | 'end_date', value: string | null) {
    if (cascadeOriginRef.current !== 'cascade') {
      setValue('production_cycle', null, { shouldDirty: false });
    }
    cascadeOriginRef.current = 'user';
    setValue(field, value, { shouldDirty: true });
  }

  function buildParams(
    data: MarkingForecastHarvestAreaReportFilterForm
  ): MarkingForecastHarvestAreaReportParams {
    return {
      areas: data.areas?.length ? data.areas.map((option) => option.value) : undefined,
      cultivation: data.cultivation?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      forecast: data.forecast?.value || undefined,
      week: data.week ?? undefined,
      year: data.year ?? undefined,
      // production_cycle NUNCA aqui — JS-only, resolvido pela cascata IG-01.
    };
  }

  async function handleDownload(data: MarkingForecastHarvestAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadMarkingForecastHarvestAreaReportPdf(buildParams(data));
      downloadBlob(blob, 'relatorio-previsao-colheita-area.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="production_cycle"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.productionCycle}
                  placeholder={text.productionCyclePlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={productionCycleOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 2' }}>
              <Controller
                name="areas"
                control={control}
                render={({ field: { name, value } }) => (
                  <Select
                    label={text.fields.areas}
                    placeholder={text.areasPlaceholder}
                    name={name}
                    value={value}
                    onChange={handleManualAreasChange}
                    options={areaOptions}
                    multiple
                    loading={optionsQuery.isPending}
                  />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={(newValue) => handleManualDateChange('start_date', newValue)}
                  />
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
                render={({ field: { value } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={(newValue) => handleManualDateChange('end_date', newValue)}
                  />
                )}
              />
            </Box>

            <Controller
              name="cultivation"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.cultivation}
                  placeholder={text.cultivationPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={cultivationOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="forecast"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.forecast}
                  placeholder={text.forecastPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={forecastOptions}
                />
              )}
            />

            <Controller
              name="week"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Input
                  type="number"
                  min={1}
                  max={53}
                  name={name}
                  label={text.fields.week}
                  error={error?.message}
                  value={value ?? ''}
                  onChange={(event) =>
                    onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              )}
            />

            <Controller
              name="year"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Input
                  type="number"
                  min={1000}
                  max={9999}
                  name={name}
                  label={text.fields.year}
                  error={error?.message}
                  value={value ?? ''}
                  onChange={(event) =>
                    onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
