// src/pages/Relatorios/Frotas/Manutencoes/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Frotas > Manutenções" (F-276, execução 97-Esteiras/078,
// TASK-F276-F03). Rota `/relatorios/frotas/manutencoes`, materializa o item
// de menu FILHO `rel-gfr-manutencoes`, 3º filho do grupo `rel-gfr` ("Gestão
// de Frotas", `navigationTree.ts`), ao lado de "Máquinas"/"Abastecimentos".
//
// Mirror ESTRUTURAL DUPLO (F-276-plano-frontend.md §Tarefas fatiadas):
//   - `Relatorios/Frotas/Abastecimentos/index.tsx` (F-277, twin direto) —
//     bundle ÚNICO `/machines-maintenance-report/options` ({machines,farms,
//     warehouses}, 1 `useQuery`, 3 `useMemo` derivando os catálogos),
//     `CheckboxListField` para `equipment_ids`/`farm_ids` (busca
//     client-side), `equipment_ids` ÚNICO filtro obrigatório (min 1, botão
//     gated).
//   - `Relatorios/Estoque/RequisicaoSaida/index.tsx` (F-312) — 2 botões
//     PDF/Excel independentes (`isExportingPdf`/`isExportingXlsx`, SEM
//     `useMutation` para binário), `warehouse_id` via `Select` estático,
//     `product_id` via `SelectAsyncPaginate` SINGLE (`listProductOptions`,
//     tenant-wide), guardrail de reset na troca de fazenda ativa
//     (`useEffect([activeFarmUuid])`).
//
// Endpoint DELIVERED (path FLAT, NÃO `/reports/...`):
// `GET /machines-maintenance-report` (+ `/options`). Nome do arquivo Excel
// FIXO: `relatorio_manutencoes.xlsx` (CLM-07).
//
// Renderização do PDF (3 blocos por equipamento, LST-03 gated OFF por
// default — SFC-276-SERVICES) é 100% server-side; esta tela só monta o
// filtro e baixa o binário (FRONT-18, NAO_APLICAVEL ao front).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { machinesMaintenanceReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/machines-maintenance-report-filter-schema';

import {
  downloadMachinesMaintenanceReportExcel,
  downloadMachinesMaintenanceReportPdf,
  listMachinesMaintenanceReportOptions,
  toMachinesMaintenanceReportParams,
} from '@/services/v2/MachinesMaintenanceReport/machines-maintenance-report-service';
import { listProductOptions } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { MachinesMaintenanceReportFormValues } from '@/@types/v2/MachinesMaintenanceReport';
import type { ProductOption } from '@/@types/v2/Products';

const pristineValues: MachinesMaintenanceReportFormValues = {
  equipment_ids: [],
  farm_ids: [],
  warehouse_id: null,
  product_id: null,
  start_date: null,
  end_date: null,
};

function mapProductOption(item: ProductOption): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

export default function ManutencoesRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.machinesMaintenanceReport.report;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MachinesMaintenanceReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: machinesMaintenanceReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // ---- Bundle ÚNICO (mirror D-FE-01 Abastecimentos) — máquinas/fazendas/
  // armazéns, 1 única chamada de rede farm-scoped, filtro CLIENT-SIDE por
  // `useMemo` (equipment/farm). ------------------------------------------
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.machinesMaintenanceReportOptions, activeFarmUuid],
    queryFn: listMachinesMaintenanceReportOptions,
  });
  useQueryError([optionsQuery]);

  const [equipmentSearch, setEquipmentSearch] = useState('');
  const allEquipmentItems = useMemo(
    () =>
      (optionsQuery.data?.machines ?? []).map((machine) => ({
        value: machine.uuid,
        label: machine.description,
      })),
    [optionsQuery.data]
  );
  const equipmentItems = useMemo(
    () =>
      allEquipmentItems.filter((item) =>
        item.label.toLowerCase().includes(equipmentSearch.trim().toLowerCase())
      ),
    [allEquipmentItems, equipmentSearch]
  );

  const [farmSearch, setFarmSearch] = useState('');
  const allFarmItems = useMemo(
    () =>
      (optionsQuery.data?.farms ?? []).map((farm) => ({
        value: farm.uuid,
        label: farm.description,
      })),
    [optionsQuery.data]
  );
  const farmItems = useMemo(
    () =>
      allFarmItems.filter((item) =>
        item.label.toLowerCase().includes(farmSearch.trim().toLowerCase())
      ),
    [allFarmItems, farmSearch]
  );

  const warehouseOptions: Option<string>[] = useMemo(
    () =>
      (optionsQuery.data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.uuid,
        label: warehouse.description,
      })),
    [optionsQuery.data]
  );

  // Guardrail farm-scoped (FRONT-19) — os 4 selects são resetados na troca
  // de fazenda ativa (mirror `filtro_farm_scoped_reset_na_troca_de_fazenda`):
  // a seleção anterior deixaria de existir no universo da nova fazenda e
  // causaria 422/lista órfã. A queryKey de `optionsQuery` já inclui
  // `activeFarmUuid` — refetch automático do bundle.
  useEffect(() => {
    setValue('equipment_ids', [], { shouldDirty: false });
    setValue('farm_ids', [], { shouldDirty: false });
    setValue('warehouse_id', null, { shouldDirty: false });
    setValue('product_id', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  const equipmentIdsValue = watch('equipment_ids');

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `RequisicaoSaida`/
  // `Abastecimentos`).
  async function notifyDownloadError(error: unknown) {
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
  }

  async function handleDownloadPdf(values: MachinesMaintenanceReportFormValues) {
    const params = toMachinesMaintenanceReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadMachinesMaintenanceReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `RequisicaoSaida`/`SaidasCentroCusto`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: MachinesMaintenanceReportFormValues) {
    const params = toMachinesMaintenanceReportParams(values, 'xlsx');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadMachinesMaintenanceReportExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingXlsx(false);
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
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx || equipmentIdsValue.length === 0}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx || equipmentIdsValue.length === 0}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            {/* Armazém — `Select` simples sobre o bundle ÚNICO, SEM
                `SelectAsyncPaginate` (catálogo já vem completo). */}
            <Controller
              name="warehouse_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.warehouse}
                  placeholder={text.warehousePlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={warehouseOptions}
                  loading={optionsQuery.isFetching}
                />
              )}
            />

            {/* Produto — ÚNICO picker remoto/paginado desta tela (R2: UI
                SINGLE, fiel ao legado/task-packet; wire serializado como
                array de 0..1 elemento no service). */}
            <Controller
              name="product_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  placeholder={text.productPlaceholder}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />
          </SimpleGrid>

          {/* Máquinas — CheckboxListField sobre o bundle ÚNICO, ÚNICO filtro
              obrigatório (min 1). */}
          <Box>
            <Controller
              name="equipment_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={`${text.fields.equipmentIds} *`}
                  items={equipmentItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={equipmentSearch}
                  onSearchChange={setEquipmentSearch}
                  searchPlaceholder={text.equipmentsSearchPlaceholder}
                  selectAllLabel={text.equipmentsSelectAll}
                  deselectAllLabel={text.equipmentsDeselectAll}
                  selectedCountLabel={text.equipmentsSelectedCount}
                  emptyLabel={text.equipmentsEmptyLabel}
                  errorLabel={text.equipmentsErrorLabel}
                  retryLabel={text.equipmentsRetryLabel}
                  isLoading={optionsQuery.isLoading}
                  isError={optionsQuery.isError}
                  onRetry={optionsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
            {errors.equipment_ids?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.equipment_ids?.message}
              </Text>
            )}
          </Box>

          {/* Fazendas — CheckboxListField sobre o MESMO bundle ÚNICO,
              opcional. */}
          <Box>
            <Controller
              name="farm_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.farmIds}
                  items={farmItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={farmSearch}
                  onSearchChange={setFarmSearch}
                  searchPlaceholder={text.farmsSearchPlaceholder}
                  selectAllLabel={text.farmsSelectAll}
                  deselectAllLabel={text.farmsDeselectAll}
                  selectedCountLabel={text.farmsSelectedCount}
                  emptyLabel={text.farmsEmptyLabel}
                  errorLabel={text.farmsErrorLabel}
                  retryLabel={text.farmsRetryLabel}
                  isLoading={optionsQuery.isLoading}
                  isError={optionsQuery.isError}
                  onRetry={optionsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
