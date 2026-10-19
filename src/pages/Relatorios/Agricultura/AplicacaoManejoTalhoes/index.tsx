// src/pages/Relatorios/Agricultura/AplicacaoManejoTalhoes/index.tsx
// -----------------------------------------------------------------------------
// Tela "Aplicação/Manejo Talhões — Relatório" (F-220, execução 059,
// `CONTRATO-F220-aplicacao-manejo-talhoes.md`, TASK-220-FE-02). Rota
// (a registrar, ver BLOCO DE FIAÇÃO) `/relatorios/agricultura/aplicacao-
// manejo-talhoes`, item de menu FILHO sob o grupo/submenu `rel-agr`
// ("Agricultura", `navigationTree.ts`).
//
// UX-GAP declarado no contrato de API (`CONTRATO-F220-aplicacao-manejo-
// talhoes.md §"UX-GAP"`): nenhuma referência a "Aplicação/Manejo Talhões" no
// Storybook `cerne` nem no front atual — tela nova, SEM Referência UX 1:1.
// Fan-out por COMPOSIÇÃO de 3 mirrors já homologados no mesmo domínio de
// relatório download-only (adaptação, não cópia de Storybook — `get_spa_ux_
// fidelity_pattern`):
//   - `Relatorios/Agricultura/ProducaoCusteioArea/index.tsx` (F-298,
//     canário) — casca `FormContainer`+footer+`<Form onSubmit={preventDefault}>`,
//     cascata IG-01/IG-02 100% CLIENT-SIDE (`production_cycle`→`area_uuids`/
//     datas), `useRef` de origem da última mudança.
//   - `Relatorios/Estoque/StockAbcReport/index.tsx` (F-322) — campo `format`
//     (PDF/Excel) com `Select` `noClearable` + 1 único botão de download, a
//     extensão do arquivo decidida pelo próprio `format.value`.
//   - `CadastrosBase/Produtos/Catalogo/FilterSideCatalogo.tsx` — cascata REAL
//     Grupo→Categoria→Classe via `SelectAsyncPaginate` (`listCategoryProductOptions`/
//     `listKindOptions`, endpoints GENÉRICOS já existentes, ZERO Tarefa nova
//     de API — mirror `CONTRATO-F220 §"O que muda para o dev"`). `group_uuid`
//     é `Select` PLANO (não async) — universo carregado inteiro pelo PRÓPRIO
//     `/options` deste relatório (`groups`), diferente de `category_uuid`/
//     `kind_uuid` que cascateiam por paginação assíncrona.
//
// `production_cycle` é CLIENT-SIDE PURO (DEC-265, contrato §"Leitura do
// dev") — alimenta a cascata IG-01 (preenche `area_uuids`/`start_date`/
// `end_date`) mas NUNCA compõe `AgricultureApplicationManagementReportParams`
// (o DTO real da API não tem esse campo, diferente do canário F-298 que
// ainda envia `production_cycle_uuid` ignorado no servidor).
//
// `report_type` é filtro de RENDER no servidor (Action monta os 3 blocos
// sempre; campo vazio = os 3 aparecem) — `Select` CLEARABLE, sem default.
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
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { agricultureApplicationManagementReportFormatOptions } from '@/constants/Relatorios/agriculture-application-management-report/options/agriculture-application-management-report-format-options';
import { agricultureApplicationManagementReportTypeOptions } from '@/constants/Relatorios/agriculture-application-management-report/options/agriculture-application-management-report-type-options';

import { agricultureApplicationManagementReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/agriculture-application-management-report-filter-schema';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import {
  downloadAgricultureApplicationManagementReport,
  getAgricultureApplicationManagementReportOptions,
} from '@/services/v2/Relatorios/agriculture-application-management-report-service';

import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindOption } from '@/@types/v2/Kinds';
import type {
  AgricultureApplicationManagementReportFilterForm,
  AgricultureApplicationManagementReportParams,
  AgricultureApplicationManagementReportProductionCycleRef,
} from '@/@types/v2/Relatorios/agriculture-application-management-report';

const pristineValues: AgricultureApplicationManagementReportFilterForm = {
  production_cycle: null,
  area_uuids: null,
  start_date: null,
  end_date: null,
  report_type: null,
  group_uuid: null,
  category_uuid: null,
  kind_uuid: null,
  format: null,
};

/** Origem da última mudança nos campos `area_uuids`/`start_date`/`end_date`
 * — guarda anti-loop de IG-02 (mirror `ProducaoCusteioArea/index.tsx`). */
type CascadeOrigin = 'user' | 'cascade';

export default function AplicacaoManejoTalhoesRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.agricultureApplicationManagementReport.report;

  const buildPristineValues = (): AgricultureApplicationManagementReportFilterForm => ({
    ...pristineValues,
    format: agricultureApplicationManagementReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch, setValue } =
    useForm<AgricultureApplicationManagementReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: agricultureApplicationManagementReportFilterSchemaResolver(languageGB),
      defaultValues: buildPristineValues(),
    });

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.agricultureApplicationManagementReportOptions],
    queryFn: getAgricultureApplicationManagementReportOptions,
  });

  const productionCycles = optionsQuery.data?.productionCycles ?? [];
  const areasUniverse = optionsQuery.data?.areas ?? [];
  const groups = optionsQuery.data?.groups ?? [];

  const productionCycleOptions: Option<string>[] = productionCycles.map((cycle) => ({
    value: cycle.uuid,
    label: cycle.code,
  }));

  const areasOptions: Option<string>[] = areasUniverse.map((area) => ({
    value: area.uuid,
    label: area.description,
  }));

  const groupOptions: Option<string>[] = groups.map((group) => ({
    value: group.uuid,
    label: group.label,
  }));

  const productionCycleValue = watch('production_cycle');
  const groupValue = watch('group_uuid');
  const categoryValue = watch('category_uuid');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // IG-01 — cascata client-side: ao selecionar um ciclo de produção, deriva
  // `area_uuids`/`start_date`/`end_date` do MESMO payload de `/options` (sem
  // 2ª chamada de rede). `production_cycle` NUNCA é enviado ao servidor
  // (DEC-265) — só governa este preenchimento.
  useEffect(() => {
    if (!productionCycleValue) return;

    const selectedCycle = productionCycles.find(
      (cycle: AgricultureApplicationManagementReportProductionCycleRef) =>
        cycle.uuid === productionCycleValue.value
    );
    if (!selectedCycle) return;

    cascadeOriginRef.current = 'cascade';
    setValue(
      'area_uuids',
      selectedCycle.areas.map((area) => ({ value: area.uuid, label: area.description })),
      { shouldDirty: false }
    );
    setValue('start_date', selectedCycle.start_date, { shouldDirty: false });
    setValue('end_date', selectedCycle.end_date, { shouldDirty: false });
    // Dependência intencionalmente restrita a `productionCycleValue` —
    // `productionCycles`/`setValue` são estáveis por render (mirror
    // `ProducaoCusteioArea/index.tsx`).
  }, [productionCycleValue]);

  // IG-02 — editar manualmente `area_uuids`/`start_date`/`end_date` DEPOIS
  // de IG-01 ter rodado desfaz a associação visual ao ciclo.
  function handleManualAreasChange(value: Option<string>[] | null) {
    if (cascadeOriginRef.current !== 'cascade') {
      setValue('production_cycle', null, { shouldDirty: false });
    }
    cascadeOriginRef.current = 'user';
    setValue('area_uuids', value, { shouldDirty: true });
  }

  function handleManualDateChange(field: 'start_date' | 'end_date', value: string | null) {
    if (cascadeOriginRef.current !== 'cascade') {
      setValue('production_cycle', null, { shouldDirty: false });
    }
    cascadeOriginRef.current = 'user';
    setValue(field, value, { shouldDirty: true });
  }

  function buildParams(
    data: AgricultureApplicationManagementReportFilterForm
  ): AgricultureApplicationManagementReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      area_uuids: data.area_uuids?.length ? data.area_uuids.map((area) => area.value) : undefined,
      report_type: data.report_type?.value || undefined,
      group_uuid: data.group_uuid?.value || undefined,
      category_uuid: data.category_uuid?.value || undefined,
      kind_uuid: data.kind_uuid?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: AgricultureApplicationManagementReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadAgricultureApplicationManagementReport(params);
      downloadBlob(blob, `aplicacao-manejo-talhoes.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
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
                name="area_uuids"
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
              name="report_type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.reportType}
                  placeholder={text.reportTypePlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<'inputs' | 'services' | 'occurrences'> | null) =>
                    onChange(option)
                  }
                  options={agricultureApplicationManagementReportTypeOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="group_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.group}
                  placeholder={text.groupPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => {
                    onChange(option);
                    // CASCATA — trocar o Grupo reseta Categoria e Classe no
                    // MESMO onChange (mirror `FilterSideCatalogo.tsx`).
                    setValue('category_uuid', null);
                    setValue('kind_uuid', null);
                  }}
                  options={groupOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="category_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.category}
                  placeholder={groupValue ? text.categoryPlaceholder : text.categoryDisabledHint}
                  isDisabled={!groupValue}
                  service={listCategoryProductOptions}
                  mapOptions={(item: CategoryProductOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    group_uuid: groupValue?.value,
                  })}
                  cacheUniqs={[groupValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    // CASCATA — trocar a Categoria reseta a Classe.
                    setValue('kind_uuid', null);
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="kind_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.kind}
                  placeholder={categoryValue ? text.kindPlaceholder : text.kindDisabledHint}
                  isDisabled={!categoryValue}
                  service={listKindOptions}
                  mapOptions={(item: KindOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    category_uuid: categoryValue?.value,
                  })}
                  cacheUniqs={[categoryValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
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
                  options={agricultureApplicationManagementReportFormatOptions.options(languageGB)}
                  noClearable
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
