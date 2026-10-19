// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotSanitaryItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de itens do diálogo Sanitário Múltiplo — TASK-FE-042-215.
// Adaptação estrutural DIRETA de `ProcessingSanitaryItemRow.tsx` (execução
// 039): mesma cascata Produto↔Un.Medida + saldo convertido + aviso de saldo
// insuficiente (client-side, NÃO bloqueia submit).
//
// GAP-FE-244 (correção de fidelidade exec-042) — 3 correções:
//   1. Saldo (`Estoque`) deixa de vir de uma 2ª chamada
//      (`getSanitaryWarehouseStock`, rota genérica `/sanitary/warehouse-stock/
//      {a}/{b}` sob gate `processing_create` — risco de 403 para quem só tem
//      `feedlot-map_manage`) e passa a vir DIRETO da opção de Produto
//      selecionada (`quantity`), mirror `product.quantity` do legado
//      `ModalSanitario.js@handleProductChange`. Sem chamada extra.
//   2. Cada opção do Select de Produto é agora uma LINHA de `Stock`
//      (produto+LOTE) — `listFeedlotMapSanitaryProductsByWarehouse` retorna
//      `FeedlotCorralSanitaryStockOption[]` (não mais `ProductOption[]`
//      deduplicado). `value` = uuid do `Stock` (vira `stock_uuid` no
//      submit), rótulo sufixado com o lote quando presente — mirror
//      `CONCAT(description, " - Lote: ", provider_lot)` do legado.
//   3. Cascata confirmada como Armazém→Produto (nunca o reverso): o
//      fallback que buscava produtos SEM armazém selecionado
//      (`listProductOptions`) foi removido — sem armazém, a lista de
//      produtos fica vazia (Select desabilitado), mirror
//      `newItems[index].products = []` do legado quando `warehouseId` é
//      vazio.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Icon } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { queryKey } from '@/constants/query-key';

import type {
  MultipleSanitariesFormValues,
  SanitaryStockFieldOption,
} from '@/validations/schemas/FeedlotMap/multipleSanitaries-schema';

import {
  listFeedlotMapSanitaryMeasurements,
  listFeedlotMapSanitaryProductsByWarehouse,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { FeedlotCorralSanitaryStockOption } from '@/@types/v2/FeedlotMap/sanitary';
import type { MeasurementOption } from '@/@types/v2/Measurements';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const EMPTY_STOCK_OPTIONS_PAGE = {
  success: true,
  data: {
    items: [] as FeedlotCorralSanitaryStockOption[],
    pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
  },
};

interface ProductFactorInfo {
  secondMeasurementUuid: string | null;
  factorType: 'M' | 'D' | null;
  factor: number | null;
}

const EMPTY_PRODUCT_FACTOR_INFO: ProductFactorInfo = {
  secondMeasurementUuid: null,
  factorType: null,
  factor: null,
};

function formatStockQuantity(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Mirror `ProcessingSanitaryItemRow.convertStockToSelectedUnit` — secundária
// com `factor_type==='D'` divide pelo fator; qualquer outro `factor_type`
// multiplica.
function convertStockToSelectedUnit(
  rawStock: number,
  selectedMeasurementUuid: string | null,
  secondMeasurementUuid: string | null | undefined,
  factorType: 'M' | 'D' | null | undefined,
  factor: number | null | undefined
): number {
  const isSecondaryUnit =
    !!selectedMeasurementUuid &&
    !!secondMeasurementUuid &&
    selectedMeasurementUuid === secondMeasurementUuid;
  if (!isSecondaryUnit || !factor) return rawStock;
  return factorType === 'D' ? rawStock / factor : rawStock * factor;
}

function convertDoseToBaseUnit(
  dose: number,
  selectedMeasurementUuid: string | null,
  secondMeasurementUuid: string | null | undefined,
  factorType: 'M' | 'D' | null | undefined,
  factor: number | null | undefined
): number {
  const isSecondaryUnit =
    !!selectedMeasurementUuid &&
    !!secondMeasurementUuid &&
    selectedMeasurementUuid === secondMeasurementUuid;
  if (!isSecondaryUnit || !factor) return dose;
  return factorType === 'D' ? dose * factor : dose / factor;
}

export interface FeedlotSanitaryItemRowProps {
  control: Control<MultipleSanitariesFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  animalsCount: number;
  warehouseOptions: Option<string>[];
  languageGB: LanguageDate;
}

export function FeedlotSanitaryItemRow({
  control,
  index,
  canRemove,
  onRemove,
  animalsCount,
  warehouseOptions,
  languageGB,
}: FeedlotSanitaryItemRowProps) {
  const text = languageGB.feedlotMap.feedlotMap.sanitary;

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `items.${index}.warehouse_id`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product_id`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `items.${index}.measurement_id`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: noteField } = useController({ control, name: `items.${index}.note_item` });

  const warehouseUuid = warehouseField.value?.value ?? null;
  // GAP-FE-244 — `productField.value` agora é a linha de `Stock` (produto+
  // lote) selecionada; `productUuid` (para a cascata de medidas) vem de
  // `.product_uuid`, NUNCA de `.value` (que é o uuid do `Stock`).
  const productUuid = productField.value?.product_uuid ?? null;

  const measurementsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'sanitary-measurements', productUuid],
    queryFn: async () => (await listFeedlotMapSanitaryMeasurements(productUuid as string)).data,
    enabled: !!productUuid,
  });

  const measurementOptions: Option<string>[] = (measurementsQuery.data ?? []).map(
    (item: MeasurementOption) => ({ label: item.description || item.name, value: item.uuid })
  );

  useEffect(() => {
    if (measurementOptions.length === 1 && !measurementField.value) {
      measurementField.onChange(measurementOptions[0]);
    }
    // eslint-disable-next-line
  }, [measurementsQuery.data, productUuid]);

  // GAP-FE-244 item 1 — saldo (`Estoque`) vem DIRETO da opção de Produto
  // selecionada (`quantity` da linha de `Stock`), sem chamada extra —
  // mirror `product.quantity` do legado, remove o risco de 403 do endpoint
  // genérico `getSanitaryWarehouseStock` (gate `processing_create`).
  const stockBalance = productField.value?.quantity ?? null;

  const [productFactorInfo, setProductFactorInfo] =
    useState<ProductFactorInfo>(EMPTY_PRODUCT_FACTOR_INFO);
  const { secondMeasurementUuid, factorType, factor } = productFactorInfo;
  const selectedMeasurementUuid = measurementField.value?.value ?? null;

  const displayedStock =
    stockBalance != null
      ? convertStockToSelectedUnit(
          stockBalance,
          selectedMeasurementUuid,
          secondMeasurementUuid,
          factorType,
          factor
        )
      : null;

  useEffect(() => {
    if (stockBalance === null || !quantityField.value) return;
    const doseBase = convertDoseToBaseUnit(
      Number(quantityField.value),
      selectedMeasurementUuid,
      secondMeasurementUuid,
      factorType,
      factor
    );
    const totalDose = doseBase * animalsCount;
    if (totalDose > stockBalance) {
      toaster.create({
        type: 'warning',
        title: text.title,
        description: text.stockInsufficientWarning,
      });
    }
    // eslint-disable-next-line
  }, [quantityField.value, stockBalance, animalsCount, selectedMeasurementUuid, secondMeasurementUuid, factorType, factor]);

  // GAP-FE-244 item 3 — cascata CONFIRMADA como Armazém→Produto, nunca o
  // reverso: sem armazém selecionado, a lista de produtos é vazia (mirror
  // `newItems[index].products = []` do legado quando `warehouseId` é
  // vazio) — sem fallback para um lookup de produto sem armazém.
  // `pageParams.search` (TASK-FE-063-SANITARY-SEARCH-01) — o termo digitado
  // no Select vem via `findParamsFromSearch`/`SelectAsyncPaginate.
  // handleLoadOptions` (spread em `service(...)`); antes ficava sem uso e a
  // busca server-side nunca era acionada. Repassa ao service, mirror
  // `listRowWarehouses`/`listWarehouseOptions` (cascata Armazém→Produto do
  // Processamento).
  async function listRowProducts(pageParams: PaginationQueryParams & { search?: string }) {
    if (warehouseUuid) {
      return listFeedlotMapSanitaryProductsByWarehouse(warehouseUuid, pageParams.search);
    }
    return EMPTY_STOCK_OPTIONS_PAGE;
  }

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? null);
    // Armazém trocado invalida o produto/lote já escolhido (mirror
    // `handleWarehouseChange` legado — zera `product_id`/`lot`/`qnt_stock`).
    productField.onChange(null);
    measurementField.onChange(null);
    setProductFactorInfo(EMPTY_PRODUCT_FACTOR_INFO);
  }

  function handleProductChange(option: SanitaryStockFieldOption | null) {
    productField.onChange(option ?? null);
    measurementField.onChange(null);
    setProductFactorInfo(
      option
        ? {
            secondMeasurementUuid: option.measurement_second?.uuid ?? null,
            factorType: option.factor_type ?? null,
            factor: option.factor ?? null,
          }
        : EMPTY_PRODUCT_FACTOR_INFO
    );
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="220px">
          <Select
            label={text.fields.warehouse}
            name={warehouseField.name}
            value={warehouseField.value}
            onChange={handleWarehouseChange}
            options={warehouseOptions}
            error={warehouseFieldState.error?.message}
            isRequired
          />
        </Box>

        <Box flex="2" minW="220px">
          <SelectAsyncPaginate
            name={productField.name}
            label={text.fields.product}
            service={listRowProducts}
            mapOptions={(item: FeedlotCorralSanitaryStockOption) => ({
              // Rótulo sufixado com o lote (mirror `CONCAT(description, "
              // - Lote: ", provider_lot)` do legado `getProductsByWarehouse`).
              label: item.lot
                ? `${item.product.description} - Lote: ${item.lot}`
                : item.product.description,
              value: item.uuid,
              product_uuid: item.product.uuid,
              quantity: item.quantity,
              lot: item.lot,
              measurement: item.measurement,
              measurement_second: item.measurement_second,
              factor: item.factor,
              factor_type: item.factor_type,
            })}
            findParams={findParamsFromSearch}
            value={productField.value ?? null}
            onChange={handleProductChange as (option: unknown) => void}
            error={productFieldState.error?.message}
            cacheUniqs={[warehouseUuid]}
            isDisabled={!warehouseUuid}
            // TASK-063-MAPA3-02 (rejeição QA rodada 3, D2): este Select vive
            // dentro de `FeedlotCorralSanitaryDialog` (`Dialog.Root`/Ark UI).
            // `menuPortalTarget={document.body}` portaliza o menu FORA da
            // árvore de `Portal` do Dialog, que aplica `aria-hidden`/`inert`
            // nele — o menu abria visível porém inerte (não rolava, não
            // selecionava). `disablePortal` faz o menu renderizar INLINE,
            // dentro da árvore correta (ver docstring de `disablePortal` em
            // `SelectAsyncPaginate.tsx`).
            disablePortal
            isRequired
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Select
            label={text.fields.measurement}
            name={measurementField.name}
            value={measurementField.value ?? null}
            onChange={(option: Option<string> | null) => measurementField.onChange(option ?? null)}
            options={measurementOptions}
            error={measurementFieldState.error?.message}
            isRequired
            isDisabled={!productUuid}
          />
        </Box>

        <Box w={{ base: 'full', sm: '110px' }}>
          <InputReadOnly label={text.fields.stock} value={formatStockQuantity(displayedStock)} />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={quantityField.name}
            label={text.fields.quantity}
            allowDot
            decimalPlaces={2}
            min={0}
            value={quantityField.value === '' ? null : Number(quantityField.value)}
            onValueChange={(value) => quantityField.onChange(value ?? '')}
            error={quantityFieldState.error?.message}
            isRequired
          />
        </Box>

        <Box flex="2" minW="200px">
          <Input
            name={noteField.name}
            label={text.fields.note}
            value={noteField.value ?? ''}
            onChange={(event) => noteField.onChange(event.target.value)}
          />
        </Box>

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {text.removeItem}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={text.removeItem}
            mensegerTooltip={text.removeItem}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={!canRemove}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>
    </Box>
  );
}
