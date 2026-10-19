// src/pages/Relatorios/Frotas/Abastecimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Abastecimentos — Relatório" (F-277, TASK-054-277-FE-02, esteira
// 97-Esteiras/054). Rota `/relatorios/frotas/abastecimentos`, materializa o
// item de menu FILHO `rel-gfr-abastecimentos`, 2º filho do grupo/submenu
// `rel-gfr` ("Gestão de Frotas", `navigationTree.ts`), ao lado de "Máquinas"
// (F-278, EM PRODUÇÃO).
//
// Mirror ESTRUTURAL DUPLO (roteiro-front-F277-abastecimentos.md §1/§4.1):
//   - `Relatorios/Frotas/Maquinas/index.tsx` (F-278) — mesma casca
//     `FormContainer` + footer, `isDownloading` (SEM `useMutation` para
//     binário), botão único "Gerar relatório" desabilitado sem
//     `equipment_ids`.
//   - `Relatorios/Financeiro/ContasAPagar/index.tsx` — mesmo padrão de
//     `Select` estático (`warehouse_id`, mirror `farm_id`/`proprietary_id`)
//     e `CheckboxListField` REMOTO/paginado (`product_ids`, mirror
//     `categories`/`providers`).
//
// D-FE-01 (roteiro §3.2) — DIVERGÊNCIA DELIBERADA em relação ao F-278: os 3
// primeiros pickers (`equipment_ids`/`farm_ids`/`warehouse_id`) NÃO usam
// `useOptionsChecklistQuery`/`useOptionsSelectQuery` (remoto/paginado por
// entidade) — o backend expõe 1 ÚNICO endpoint
// `GET /machines-supply-report/options` que devolve os 3 catálogos JÁ
// filtrados (família de equipamento, farm-scope, estoque de categoria), SEM
// paginação nem busca server-side. Por isso: 1 `useQuery` CRU buscando o
// bundle uma única vez + `useMemo` derivando as 3 listas, mirror EXATO do que
// o PRÓPRIO `Maquinas/index.tsx` já faz para `farm_ids` (`farmsQuery`/
// `allFarmItems`/`farmItems`), generalizado agora às 3 listas.
// `isLoading`/`isError`/`onRetry` dos 2 `CheckboxListField` (equipment/farm)
// vêm TODOS do mesmo `optionsQuery` (1 loading/error COMPARTILHADO, não 3
// independentes) — diferente do F-278. O `Select` de `warehouse_id` (D-FE-02,
// §3.3) só recebe `loading` (o componente `Select` do projeto não expõe
// `isError`/`onRetry` — erro de leitura do bundle é reportado via
// `useQueryError`/toast, mesmo mecanismo já usado para `farmsQuery` no
// F-278).
//
// `product_ids` (§3.4) é o ÚNICO picker remoto/paginado desta tela —
// `listProductOptions` reusado TAL QUAL (sem parâmetro de categoria, a
// pendência `category_products.id=2` é 100% backend), `queryKey`
// `queryKey.products.productsList` (chave JÁ EXISTENTE, sem cunhar nova).
//
// ⚠️ Contra o contrato ainda não implementado (roteiro API
// `CONTRATO_AUTOAPROVADO`, TASK-01/02/03 pendentes) — ajuste mecânico se o
// Resource real divergir do `MachinesSupplyReportOptionItem` premissado.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { machinesSupplyReportFilterSchemaResolver } from '@/validations/schemas/MachinesSupplyReport/machines-supply-report-filter-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadMachinesSupplyReport,
  getMachinesSupplyReportOptions,
} from '@/services/v2/MachinesSupplyReport/machines-supply-report-service';

import type { LanguageDate } from '@/@types/language';
import type {
  MachinesSupplyReportFilterForm,
  MachinesSupplyReportParams,
} from '@/@types/v2/MachinesSupplyReport';

function buildPristineValues(languageGB: LanguageDate): MachinesSupplyReportFilterForm {
  return {
    equipment_ids: [],
    farm_ids: [],
    product_ids: [],
    warehouse_id: null,
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function AbastecimentosRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.machinesSupplyReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MachinesSupplyReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: machinesSupplyReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Bundle ÚNICO (D-FE-01) — máquinas/fazendas/armazéns, 1 única
  // chamada de rede, filtro CLIENT-SIDE por `useMemo` (mirror
  // `Maquinas/index.tsx::farmsQuery`, generalizado às 3 listas). --------
  const optionsQuery = useQuery({
    queryKey: [queryKey.machinesSupplyReport.options],
    queryFn: getMachinesSupplyReportOptions,
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

  const warehouseOptions = useMemo(
    () =>
      (optionsQuery.data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.uuid,
        label: warehouse.description,
      })),
    [optionsQuery.data]
  );

  // ---- Produtos (ÚNICO picker remoto/paginado desta tela, D-FE-01 §3.4) —
  // `supply_only:true` (PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.2/§3 F-277,
  // DECISÃO DE ESCOPO #1) restringe à categoria de Suprimento (combustível/
  // lubrificante, `CATEGORY_ID_SUPPLY`), fiel ao legado `category_id=2`. --
  const [productSearch, setProductSearch] = useState('');
  const productsQuery = useOptionsChecklistQuery({
    asyncFunction: listProductOptions,
    queryKey: queryKey.products.productsList,
    search: productSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { supply_only: true },
  });

  const equipmentIdsValue = watch('equipment_ids');

  function buildParams(data: MachinesSupplyReportFilterForm): MachinesSupplyReportParams {
    return {
      equipment_ids: data.equipment_ids,
      farm_ids: data.farm_ids.length > 0 ? data.farm_ids : undefined,
      product_ids: data.product_ids.length > 0 ? data.product_ids : undefined,
      warehouse_id: data.warehouse_id?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: MachinesSupplyReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadMachinesSupplyReport(params);
      downloadBlob(blob, `relatorio-abastecimentos.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `Maquinas`/`ContasAPagar`).
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
            disabled={isDownloading || equipmentIdsValue.length === 0}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
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

            {/* Armazém — `Select` simples sobre o bundle (D-FE-02, §3.3):
                catálogo já vem completo, SEM `SelectAsyncPaginate`. */}
            <Controller
              name="warehouse_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.warehouseId}
                  placeholder={text.warehousePlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={warehouseOptions}
                  loading={optionsQuery.isLoading}
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
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Máquinas — CheckboxListField sobre o bundle ÚNICO (D-FE-01),
              ÚNICO filtro obrigatório (min 1). */}
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

          {/* Fazendas — CheckboxListField sobre o MESMO bundle ÚNICO
              (D-FE-01), opcional. */}
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

          {/* Produtos — CheckboxListField REMOTO/paginado (§3.4), ÚNICA
              chamada de rede separada desta tela. */}
          <Box>
            <Controller
              name="product_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.productIds}
                  items={productsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={productSearch}
                  onSearchChange={setProductSearch}
                  searchPlaceholder={text.productsSearchPlaceholder}
                  selectAllLabel={text.productsSelectAll}
                  deselectAllLabel={text.productsDeselectAll}
                  selectedCountLabel={text.productsSelectedCount}
                  emptyLabel={text.productsEmptyLabel}
                  isLoading={productsQuery.isLoading}
                  isError={productsQuery.isError}
                  onRetry={productsQuery.refetch}
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
