// src/pages/Relatorios/Agricultura/ProducaoColaborador/index.tsx
// -----------------------------------------------------------------------------
// Tela "Prod./Colaborador — Relatório" (F-300, esteira
// CORE_WORKSPACE/97-Esteiras/079, TASK-300-FE-03). Rota
// `/relatorios/agricultura/producao-colaborador`, materializa o item de menu
// FILHO `rel-agr-poc`, sob o grupo/submenu `rel-agr` ("Agricultura",
// `navigationTree.ts`). Fan-out do canário `ProducaoCusteioArea`
// (F-298, esteira 051) — mirror EXATO do casco/cascata, acrescido de 2
// selects (`teams`/`employees`) FORA da cascata IG-01/IG-02.
//
// Casco mirror `ProducaoCusteioArea/index.tsx` (F-298) — `FormContainer` +
// `footer` com 1 botão "Baixar PDF", SEM prévia (contrato de API só expõe
// binário), download via Blob + `downloadBlob` + `parseBlobError`.
//
// Referência UX: `EstoqueConsolidadoReportPage.tsx` (commit `86634905`,
// mesma âncora já usada pelo F-298 — sem drift detectado desde então,
// F-300-plano-frontend.md §A) — adaptação documentada: `MultiSelectField`/
// `FormSelect`/`ReportWorkspace` do Storybook NÃO são importados 1:1; a SPA
// já resolve "universo pequeno carregado inteiro via /options" com
// `<Select multiple>` nativo (`@/components/Form/Select`), sem
// paginação/busca no servidor (mirror LK-02 do F-298, aqui LK-01/LK-02/LK-03
// do plano de API).
//
// CASCATA (F-300-plano-frontend.md §C item IG-01/IG-02 — 100% CLIENT-SIDE
// sobre o payload ÚNICO de `/options`, sem endpoint de cascata dedicado,
// reuso LITERAL da implementação já testada de `ProducaoCusteioArea`):
//   IG-01 — ao selecionar um `production_cycle`, preenche `areas` (todas as
//   áreas do ciclo) + `start_date`/`end_date` do ciclo escolhido.
//   IG-02 — editar manualmente `areas`/`start_date`/`end_date` DEPOIS de
//   IG-01 ter rodado limpa a seleção de `production_cycle`. Um `useRef`
//   marca a origem da última mudança para não disparar IG-02 na própria
//   escrita de IG-01.
//
// `teams`/`employees` NÃO participam da cascata (nem disparam, nem são
// afetados) — ambos `<Select multiple>` nativos alimentados pelo MESMO
// payload de `/options` (FM-01/FM-06 do plano, matriz FID-G3F).
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

import { productionPerWorkerReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/production-per-worker-report-filter-schema';

import {
  downloadProductionPerWorkerReportPdf,
  getProductionPerWorkerReportOptions,
} from '@/services/v2/Relatorios/production-per-worker-report-service';

import type { Option } from '@/@types/option';
import type {
  ProductionCycleOptionRef,
  ProductionPerWorkerReportFilterForm,
  ProductionPerWorkerReportParams,
} from '@/@types/v2/Relatorios/production-per-worker-report';

const pristineValues: ProductionPerWorkerReportFilterForm = {
  teams: null,
  production_cycle: null,
  areas: null,
  start_date: null,
  end_date: null,
  employees: null,
};

/** Origem da última mudança nos campos `areas`/`start_date`/`end_date` —
 * guarda anti-loop de IG-02 (evita resetar `production_cycle` no MESMO
 * ciclo de render em que IG-01 acabou de preenchê-los). Reuso literal do
 * mecanismo já testado em `ProducaoCusteioArea`. */
type CascadeOrigin = 'user' | 'cascade';

export default function ProducaoColaboradorRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.productionPerWorkerReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<ProductionPerWorkerReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: productionPerWorkerReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.productionPerWorkerReportOptions],
    queryFn: getProductionPerWorkerReportOptions,
  });

  const teamsUniverse = optionsQuery.data?.teams ?? [];
  const employeesUniverse = optionsQuery.data?.employees ?? [];
  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areasUniverse = optionsQuery.data?.areas ?? [];

  const teamsOptions: Option<string>[] = teamsUniverse.map((team) => ({
    value: team.uuid,
    label: team.name,
  }));

  const employeesOptions: Option<string>[] = employeesUniverse.map((employee) => ({
    value: employee.uuid,
    label: employee.name,
  }));

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
  // aplica aqui, mirror `ProducaoCusteioArea`).
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
    // e `setValue` são estáveis por render (mirror do padrão já usado em `ProducaoCusteioArea`).
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

  function buildParams(data: ProductionPerWorkerReportFilterForm): ProductionPerWorkerReportParams {
    return {
      team_uuids: data.teams?.length ? data.teams.map((team) => team.value) : undefined,
      area_uuids: data.areas?.length ? data.areas.map((area) => area.value) : undefined,
      employee_uuids: data.employees?.length
        ? data.employees.map((employee) => employee.value)
        : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: ProductionPerWorkerReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadProductionPerWorkerReportPdf(buildParams(data));
      downloadBlob(blob, 'producao-colaborador.pdf');
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
              name="teams"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.teams}
                  placeholder={text.teamsPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string>[] | null) => onChange(option)}
                  options={teamsOptions}
                  multiple
                  loading={optionsQuery.isPending}
                />
              )}
            />

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

            <Controller
              name="employees"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.employees}
                  placeholder={text.employeesPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string>[] | null) => onChange(option)}
                  options={employeesOptions}
                  multiple
                  loading={optionsQuery.isPending}
                />
              )}
            />
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
