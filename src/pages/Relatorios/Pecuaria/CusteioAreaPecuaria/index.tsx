// src/pages/Relatorios/Pecuaria/CusteioAreaPecuaria/index.tsx
// -----------------------------------------------------------------------------
// Tela "Custeio/Área Pecuária — Relatório" (F-251,
// CusteioAreaPecuaria-contrato-api.md, lote 076). Rota
// `/relatorios/pecuaria/custeio-area-pecuaria`, materializa o item de menu
// FILHO `rel-pec-cus-area`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`), ao lado de `rel-pec-cus`/`rel-pec-cus-an`
// ("Custeio/Lote"/"Custeio/Animal").
//
// Casco mirror EXATO de `Relatorios/Agricultura/ProducaoCusteioArea/
// index.tsx` (F-298, precedente estrutural mais próximo confirmado pelo
// contrato de API §0) — `FormContainer` + `footer` com 1 botão "Baixar PDF"
// (SEM Excel — legado é PDF-only), SEM prévia (endpoint só expõe o
// binário), download via Blob + `downloadBlob` + `parseBlobError`.
//
// Único filtro NOVO em relação ao irmão F-298: `grazings` (Módulo de
// Pastejo, multiselect universo pequeno via `/options`) — NÃO participa da
// cascata IG-01 (contrato §5c: `ProductionCycleOptionResource::areas` não
// embute `grazings`), então o `useEffect` de cascata só toca
// `areas`/`start_date`/`end_date`, exatamente como no irmão.
//
// CASCATA (contrato legado, IG-01/IG-02 — 100% CLIENT-SIDE sobre o payload
// ÚNICO de `/options`, sem endpoint de cascata dedicado):
//   IG-01 — ao selecionar um `production_cycle`, preenche `areas` (todas as
//   áreas do ciclo) + `start_date`/`end_date` do ciclo escolhido.
//   IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
//   IG-01 ter rodado limpa a seleção de `production_cycle`. Um `useRef`
//   marca a origem da última mudança para não disparar IG-02 na própria
//   escrita de IG-01. `grazings` NUNCA dispara/participa da cascata.
//
// `production_cycle_uuid` é aceito e IGNORADO em silêncio pela Action
// server-side (fidelidade ao legado) — a SPA ainda o envia para
// reconciliação de contrato/telemetria futura (mirror `buildParams` do
// irmão).
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

import { costingLivestockAreaReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/costing-livestock-area-report-filter-schema';

import {
  downloadCostingLivestockAreaReportPdf,
  getCostingLivestockAreaReportOptions,
} from '@/services/v2/Relatorios/costing-livestock-area-report-service';

import type { Option } from '@/@types/option';
import type {
  CostingLivestockAreaReportFilterForm,
  CostingLivestockAreaReportParams,
  CostingLivestockProductionCycleOptionRef,
} from '@/@types/v2/Relatorios/costing-livestock-area-report';

const pristineValues: CostingLivestockAreaReportFilterForm = {
  production_cycle: null,
  areas: null,
  grazings: null,
  start_date: null,
  end_date: null,
};

/** Origem da última mudança nos campos `areas`/`start_date`/`end_date` —
 * guarda anti-loop de IG-02 (evita resetar `production_cycle` no MESMO
 * ciclo de render em que IG-01 acabou de preenchê-los). Mirror EXATO de
 * `ProducaoCusteioArea/index.tsx`. */
type CascadeOrigin = 'user' | 'cascade';

export default function CusteioAreaPecuariaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.costingLivestockAreaReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<CostingLivestockAreaReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: costingLivestockAreaReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.costingLivestockAreaReportOptions],
    queryFn: getCostingLivestockAreaReportOptions,
  });

  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areasUniverse = optionsQuery.data?.areas ?? [];
  const grazingsUniverse = optionsQuery.data?.grazings ?? [];

  const productionCycleOptions: Option<string>[] = productionCycles.map((cycle) => ({
    value: cycle.uuid,
    label: cycle.code,
  }));

  const areasOptions: Option<string>[] = areasUniverse.map((area) => ({
    value: area.uuid,
    label: area.description,
  }));

  const grazingsOptions: Option<string>[] = grazingsUniverse.map((grazing) => ({
    value: grazing.uuid,
    label: grazing.description,
  }));

  const productionCycleValue = watch('production_cycle');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // IG-01 — cascata client-side: ao selecionar um ciclo de produção, deriva
  // `areas`/`start_date`/`end_date` do MESMO payload de `/options` (sem 2ª
  // chamada de rede). `grazings` NUNCA é tocado aqui — o backend não embute
  // módulos de pastejo na relação do ciclo (contrato §5c).
  // `shouldDirty:false` — preenchimento derivado de outro campo do MESMO
  // form, não hidratação de servidor.
  useEffect(() => {
    if (!productionCycleValue) return;

    const selectedCycle = productionCycles.find(
      (cycle: CostingLivestockProductionCycleOptionRef) => cycle.uuid === productionCycleValue.value
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
  // própria escrita de IG-01 (guarda `cascadeOriginRef`).
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
    data: CostingLivestockAreaReportFilterForm
  ): CostingLivestockAreaReportParams {
    return {
      production_cycle_uuid: data.production_cycle?.value || undefined,
      area_uuids: data.areas?.length ? data.areas.map((area) => area.value) : undefined,
      grazing_uuids: data.grazings?.length
        ? data.grazings.map((grazing) => grazing.value)
        : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: CostingLivestockAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadCostingLivestockAreaReportPdf(buildParams(data));
      downloadBlob(blob, 'custeio-area-pecuaria.pdf');
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

            <Controller
              name="grazings"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.grazings}
                  placeholder={text.grazingsPlaceholder}
                  name={name}
                  value={value}
                  onChange={(options: Option<string>[] | null) => onChange(options ?? [])}
                  options={grazingsOptions}
                  multiple
                  loading={optionsQuery.isPending}
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
