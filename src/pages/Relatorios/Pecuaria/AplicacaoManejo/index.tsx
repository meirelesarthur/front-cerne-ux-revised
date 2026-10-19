// src/pages/Relatorios/Pecuaria/AplicacaoManejo/index.tsx
// -----------------------------------------------------------------------------
// Tela "Aplicação/Manejo — Relatório" (F-230, esteira 97-Esteiras/077,
// F-230-plano-front.md). Rota `/relatorios/pecuaria/aplicacao-manejo`,
// materializa o item de menu FILHO `rel-pec-am`, sob o grupo/submenu
// `rel-pec` ("Pecuária", `navigationTree.ts`), entre `rel-pec-cat`
// ("Estq. Animais/Categoria") e `rel-pec-mov` ("Movimentação/Rebanho").
//
// Casco mirror ESTRUTURAL QUASE EXATO de `Relatorios/Pecuaria/
// CusteioAreaPecuaria/index.tsx` (F-251, lote 076, MESMO domínio de backend
// `PastureRepositoryInterface`) — `FormContainer` + `footer` com 1 único
// botão "Baixar PDF" (SEM seletor de formato — `F-230-plano-api.md` fecha
// `report_type` fora do Form Request, PDF-only), SEM prévia (endpoint só
// expõe o binário), download via Blob + `downloadBlob` + `parseBlobError`.
//
// Divergência do mirror F-251 (2 pontos, `F-230-plano-front.md §Leitura do
// dev`): SEM campo `grazings` (só `production_cycles`+`areas`); SEM select
// de formato (`report_type`, PDF-only).
//
// CASCATA (contrato legado, IG-01/IG-02 — 100% CLIENT-SIDE sobre o payload
// ÚNICO de `/options`, sem endpoint de cascata dedicado):
//   IG-01 — ao selecionar um `production_cycle`, preenche `areas` (todas as
//   áreas do ciclo) + `start_date`/`end_date` do ciclo escolhido.
//   IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
//   IG-01 ter rodado limpa a seleção de `production_cycle`. Um `useRef`
//   marca a origem da última mudança para não disparar IG-02 na própria
//   escrita de IG-01.
//
// `production_cycle_uuid` é FUNCIONAL no servidor aqui (diferente do irmão
// F-251, onde é ignorado) — `F-230-plano-api.md §PASSO 4.1`: se
// `production_cycle_uuid` presente E `area_uuids` ausente, o servidor
// resolve as áreas do ciclo. Como a cascata IG-01 já preenche `areas` no
// cliente sempre que um ciclo é selecionado (e IG-02 reseta o ciclo se
// `areas` for editada manualmente depois), o payload final SEMPRE terá
// `areas` preenchido quando `production_cycle` estiver preenchido — nenhuma
// ação extra necessária no `buildParams`.
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

import { applicationManagementReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/application-management-report-filter-schema';

import {
  downloadApplicationManagementReportPdf,
  getApplicationManagementReportOptions,
} from '@/services/v2/Relatorios/application-management-report-service';

import type { Option } from '@/@types/option';
import type {
  ApplicationManagementProductionCycleOptionRef,
  ApplicationManagementReportFilterForm,
  ApplicationManagementReportParams,
} from '@/@types/v2/Relatorios/application-management-report';

const pristineValues: ApplicationManagementReportFilterForm = {
  production_cycle: null,
  areas: null,
  start_date: null,
  end_date: null,
};

/** Origem da última mudança nos campos `areas`/`start_date`/`end_date` —
 * guarda anti-loop de IG-02 (evita resetar `production_cycle` no MESMO
 * ciclo de render em que IG-01 acabou de preenchê-los). Mirror EXATO de
 * `CusteioAreaPecuariaRelatorio`. */
type CascadeOrigin = 'user' | 'cascade';

export default function AplicacaoManejoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.applicationManagementReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<ApplicationManagementReportFilterForm>(
    {
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: applicationManagementReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    }
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.applicationManagementReportOptions],
    queryFn: getApplicationManagementReportOptions,
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
  // campo do MESMO form, não hidratação de servidor.
  useEffect(() => {
    if (!productionCycleValue) return;

    const selectedCycle = productionCycles.find(
      (cycle: ApplicationManagementProductionCycleOptionRef) =>
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
    data: ApplicationManagementReportFilterForm
  ): ApplicationManagementReportParams {
    return {
      production_cycle_uuid: data.production_cycle?.value || undefined,
      area_uuids: data.areas?.length ? data.areas.map((area) => area.value) : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: ApplicationManagementReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadApplicationManagementReportPdf(buildParams(data));
      downloadBlob(blob, 'aplicacao-manejo.pdf');
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
