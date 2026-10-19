// src/pages/Relatorios/Agricultura/ProducaoCusteioArea/index.tsx
// -----------------------------------------------------------------------------
// Tela "Produção/Custeio/Área — Relatório" (F-298, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-298-FE-02). Rota
// `/relatorios/agricultura/producao-custeio-area`, materializa o item de menu
// FILHO `rel-agr-pca`, sob o grupo/submenu `rel-agr` ("Agricultura",
// `navigationTree.ts`). CANÁRIO da tela de relatório em código para o
// fan-out (F-279/F-238/F-315/F-326).
//
// Casco mirror `Relatorios/Financeiro/Dre/index.tsx` (F-259, esteira 049) —
// `FormContainer` + `footer` com 1 botão "Baixar PDF", SEM prévia (contrato
// de API só expõe binário), download via Blob + `downloadBlob` +
// `parseBlobError` — escolhido porque o contrato de API de F-298 (roteiro
// do Arquiteto API) é 1 único GET, PDF inline, sem endpoint de prévia, sem
// Excel (mesmo arquétipo do Dre, não o arquétipo "Filtrar → prévia em
// tabela" de `CustoProducao`/`ApuracaoCusto`, que têm endpoint `/preview`
// dedicado que F-298 não tem).
//
// Referência UX: `EstoqueConsolidadoReportPage.tsx` (commit `86634905`,
// roteiro-front-F298 §"Passo UX obrigatório") — adaptação documentada:
// `MultiSelectField`/`FormSelect`/`ReportWorkspace` do Storybook NÃO são
// importados 1:1; a SPA já resolve "universo pequeno carregado inteiro via
// /options" com `<Select multiple>` nativo (`@/components/Form/Select`),
// sem paginação/busca no servidor (LK-02).
//
// CASCATA (contrato legado §6, IG-01/IG-02 — 100% CLIENT-SIDE sobre o
// payload ÚNICO de `/options`, sem endpoint de cascata dedicado):
//   IG-01 — ao selecionar um `production_cycle`, preenche `areas` (todas as
//   áreas do ciclo) + `start_date`/`end_date` do ciclo escolhido.
//   IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
//   IG-01 ter rodado limpa a seleção de `production_cycle` (mirror do
//   `.trigger('change.select2')` do legado). Um `useRef` marca a origem da
//   última mudança para não disparar IG-02 na própria escrita de IG-01.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
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
import { queryKey } from '@/constants/query-key';

import { productionCostingAreaReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/production-costing-area-report-filter-schema';

import {
  downloadProductionCostingAreaReportPdf,
  getProductionCostingAreaReportOptions,
} from '@/services/v2/Relatorios/production-costing-area-report-service';

import type { Option } from '@/@types/option';
import type {
  ProductionCostingAreaReportFilterForm,
  ProductionCostingAreaReportParams,
  ProductionCycleOptionRef,
} from '@/@types/v2/Relatorios/production-costing-area-report';

const pristineValues: ProductionCostingAreaReportFilterForm = {
  production_cycle: null,
  areas: null,
  start_date: null,
  end_date: null,
};

/** Origem da última mudança nos campos `areas`/`start_date`/`end_date` —
 * guarda anti-loop de IG-02 (evita resetar `production_cycle` no MESMO
 * ciclo de render em que IG-01 acabou de preenchê-los). */
type CascadeOrigin = 'user' | 'cascade';

export default function ProducaoCusteioAreaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.productionCostingAreaReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<ProductionCostingAreaReportFilterForm>(
    {
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: productionCostingAreaReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    }
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.productionCostingAreaReportOptions],
    queryFn: getProductionCostingAreaReportOptions,
  });

  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areasUniverse = optionsQuery.data?.areas ?? [];

  const productionCycleOptions: Option<string>[] = productionCycles.map((cycle) => ({
    value: cycle.uuid,
    label: cycle.code,
  }));

  const areasOptions: Option<string>[] = areasUniverse.map((area) => ({
    value: area.uuid,
    label: area.description,
  }));

  const productionCycleValue = watch('production_cycle');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // IG-01 — cascata client-side: ao selecionar um ciclo de produção, deriva
  // `areas`/`start_date`/`end_date` do MESMO payload de `/options` (sem 2ª
  // chamada de rede). `shouldDirty:false` — preenchimento derivado de outro
  // campo do MESMO form, não hidratação de servidor (Lei 2/`fillForm` não se
  // aplica aqui, roteiro-front-F298 §"Desenho da fatia frontend").
  useEffect(() => {
    if (!productionCycleValue) return;

    const selectedCycle = productionCycles.find(
      (cycle: ProductionCycleOptionRef) => cycle.uuid === productionCycleValue.value
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
    // Dependência intencionalmente restrita a `productionCycleValue` — `productionCycles`
    // e `setValue` são estáveis por render (mirror do padrão já usado nas telas-irmãs).
  }, [productionCycleValue]);

  // IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
  // IG-01 ter rodado desfaz a associação visual ao ciclo (mirror
  // `.trigger('change.select2')` do legado). Não dispara na própria escrita
  // de IG-01 (guarda `cascadeOriginRef`).
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
    data: ProductionCostingAreaReportFilterForm
  ): ProductionCostingAreaReportParams {
    return {
      production_cycle_uuid: data.production_cycle?.value || undefined,
      area_uuids: data.areas?.length ? data.areas.map((area) => area.value) : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: ProductionCostingAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadProductionCostingAreaReportPdf(buildParams(data));
      downloadBlob(blob, 'producao-custeio-area.pdf');
    } catch (error) {
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={!hasValidRange || isDownloading}
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
                    options={areasOptions}
                    multiple
                    loading={optionsQuery.isPending}
                  />
                )}
              />
            </Box>

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
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
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
