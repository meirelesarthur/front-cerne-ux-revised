// src/pages/Administrativo/Fabrica/FoodBeat/FoodBeatStockItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens do ramo ESTOQUE da Batida (FoodBeat — Fábrica, baixa direta
// de um Produto do estoque, TASK-FB-FE-04). Consumido pelo formulário
// completo create/edit (`TASK-FB-FE-06`, campo `stockItems` de `FoodBeatForm`).
//
// UX-GAP confirmado (ver ficha) — mesma nota de `FoodBeatFormulationItemsEditor.tsx`.
// Referências REAIS: `FoodFeedstocksEditor.tsx`/`MovementAllocationEditor.tsx`.
//
// Decisão estrutural (mirror os 2 precedentes): NÃO instancia seu próprio
// `useFieldArray` — `fields`/`append`/`remove` chegam via props, o
// `useFieldArray({ name: 'stockItems' })` vive no formulário PAI
// (`TASK-FB-FE-06`). DIFERENTE do ramo Formulação (`FoodBeatFormulationItemsEditor`):
// aqui o CONJUNTO de linhas É controlado pelo usuário — cada linha é uma
// baixa independente de um Produto/Estoque escolhido livremente (sem
// composição fixa de Ração) — por isso `append`/`remove` SÃO acionados por
// esta UI (botão "Adicionar Item" + ícone de remoção por linha, mirror
// `FoodFeedstocksEditor`/`MovementAllocationEditor`).
//
// Cascata Armazém→Estoque: `stock_id` só habilita depois de `warehouse_id`
// escolhido (`listStocks({ warehouse_uuid })`); ao trocar o armazém da
// própria linha, o estoque selecionado é limpo (mirror Doc Bruta Food regra
// 12 — reconstrução da lista de opções ao trocar o filtro pai).
//
// Validação de duplicidade de `stock_id` entre linhas (Doc Bruta `§12.3`
// linha 2, "Esse produto já foi selecionado em outra linha") — client-side,
// via comparação contra as DEMAIS linhas do próprio `useWatch`, SEM endpoint
// dedicado (não existe um no contrato novo).
//
// Autofill `stock_quantity`/`amount`/`measurement_id` (unidade, Decisão 1 da
// ficha — TEXTO readonly, sem Select de conversão) ao selecionar `stock_id`:
// mesmo cache local (`Map<uuid, StockListItem>`) documentado em
// `FoodBeatFormulationItemsEditor.tsx` — dado real da MESMA resposta que
// popula o dropdown, sem endpoint novo.
//
// Rodapé `vl_total` (Total Geral) — soma de `total` de todas as linhas,
// 100% cosmético/client-side (`useWatch`), NUNCA no payload — exposto ao
// formulário PAI via `onTotalChange` (mirror `FoodFeedstocksEditor::onTotalChange`).
//
// 2 Gaps de API documentados pela ficha (`## Leitura do dev`) — NENHUM
// resolvido com endpoint novo ou mock, ambos rastreados:
//   1. Conversão de unidade por linha (`measurement_id`) — sem endpoint
//      equivalente no contrato novo; DEFAULT aceito = TEXTO readonly (ver
//      acima). Gap real de API se o dono quiser paridade completa.
//   2. Validação de lote duplicado em tempo real (`provider_lot`, campo do
//      CABEÇALHO da Batida, fora do array `stockItems` deste arquivo) — já
//      documentada em `food-beat-schema.ts`/`TASK-FB-FE-02` (422 do submit,
//      sem ajax dedicado); não há campo `provider_lot` neste editor de
//      itens, nada a fazer aqui além de registrar o ponteiro.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useEffect, useRef } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { listStocks } from '@/services/v2/Stocks/stock-service';
import {
  listWarehouseOptions,
  type ListWarehouseOptionsParams,
} from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { FoodBeatForm, FoodBeatStockItemForm } from '@/@types/v2/FoodBeats';
import type { StockListItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

export interface StockItemsFieldValues {
  stockItems: FoodBeatStockItemForm[];
}

export interface FoodBeatStockItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`FoodBeatForm`, TASK-FB-FE-06). */
  control: Control<FoodBeatForm>;
  /** `fields` do `useFieldArray({ control, name: 'stockItems' })` do PAI. */
  fields: FieldArrayWithId<StockItemsFieldValues, 'stockItems', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<StockItemsFieldValues, 'stockItems'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<FoodBeatForm>;
  languageGB: LanguageDate;
  /** Gate de permissão/trava de edição do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
  /** Reflete o `vl_total` calculado (cosmético) para o PAI (TASK-FB-FE-06). */
  onTotalChange?: (total: number) => void;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Lookup de armazéns NÃO paginado (`GET /warehouses/options`): `pageSize` acima
// do volume real evita 2ª página fantasma no `SelectAsyncPaginate`.
const FLAT_CATALOG_PAGE_SIZE = 200;

// Armazém de origem (tipo E) — fazenda ativa, ativos, qualquer tipo (paridade
// legado). `/warehouses/options` filtra pela fazenda ativa, sem `warehouses_view`.
async function listAllTypeWarehouses(params: ListWarehouseOptionsParams) {
  return listWarehouseOptions({ search: params.search, all_types: true });
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

interface FoodBeatStockItemRowProps {
  control: Control<StockItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  /** `stock_id.value` das DEMAIS linhas — usado só para o bloqueio de duplicidade. */
  otherRowsStockUuids: string[];
}

function FoodBeatStockItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  otherRowsStockUuids,
}: FoodBeatStockItemRowProps) {
  const text = languageGB.foodBeats.foodBeat.form.fields.stockItem;

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mesmo
  // racional documentado em `FoodBeatFormulationItemsEditor.tsx`.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `stockItems.${index}.warehouse_id`,
  });
  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `stockItems.${index}.stock_id`,
  });
  const { field: measurementField } = useController({
    control,
    name: `stockItems.${index}.measurement_id`,
  });
  const { field: stockQuantityField } = useController({
    control,
    name: `stockItems.${index}.stock_quantity`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `stockItems.${index}.quantity`,
  });
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: `stockItems.${index}.amount`,
  });
  const { field: totalField, fieldState: totalFieldState } = useController({
    control,
    name: `stockItems.${index}.total`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;

  const listRowStocks = useCallback(
    async (params: PaginationQueryParams & { search?: string }) => {
      const response = await listStocks({ ...params, warehouse_uuid: warehouseUuid ?? undefined });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [warehouseUuid]
  );

  const stockQuantity = Number(stockQuantityField.value) || 0;
  const amount = Number(amountField.value) || 0;
  const quantity = Number(quantityField.value) || 0;
  const total = quantity * amount;
  const roundedTotal = roundTo2(total);

  // `total` precisa estar sincronizado no RHF — `TASK-FB-FE-06` extrai
  // `stockItems[i].total` para `FoodBeatStockItemPayload.total`.
  useEffect(() => {
    if (Number(totalField.value) !== roundedTotal) {
      totalField.onChange(roundedTotal);
    }
  }, [roundedTotal]);

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? null);
    // Reconstrução da lista de estoques (mirror Doc Bruta Food regra 12) — o
    // estoque anterior deixa de ser válido quando o armazém muda.
    stockField.onChange(null);
    measurementField.onChange(null);
    stockQuantityField.onChange(0);
    amountField.onChange(0);
  }

  function handleStockChange(option: Option<string> | null) {
    if (option && otherRowsStockUuids.includes(option.value)) {
      toaster.error({
        title: languageGB.foodBeats.foodBeat.singularLabel,
        description: text.duplicateStock,
      });
      return;
    }

    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    // `DA-FB-08` — captura o valor do stock ESCOLHIDO agora, via `onChange`
    // direto, re-hidratando mesmo se `quantity` já tinha sido editada.
    measurementField.onChange(stock?.unit ?? null);
    stockQuantityField.onChange(stock?.quantity ?? 0);
    amountField.onChange(stock?.average_cost ?? 0);
  }

  function handleQuantityBlur() {
    const value = Number(quantityField.value) || 0;
    if (value > stockQuantity) {
      quantityField.onChange('');
      toaster.error({
        title: languageGB.foodBeats.foodBeat.singularLabel,
        description: text.insufficientStock,
      });
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="200px">
        <SelectAsyncPaginate
          name={warehouseField.name}
          label={text.warehouse}
          service={listAllTypeWarehouses}
          pageSize={FLAT_CATALOG_PAGE_SIZE}
          mapOptions={(item: WarehouseOption) => ({
            label: `${item.initials} — ${item.description}`,
            value: item.uuid,
          })}
          findParams={findParamsFromSearch}
          value={warehouseField.value ?? undefined}
          onChange={handleWarehouseChange as any}
          error={warehouseFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={stockField.name}
          label={text.stock}
          service={listRowStocks}
          cacheUniqs={[warehouseUuid]}
          mapOptions={(item: StockListItem) => ({
            label: `${item.product.code} — ${item.info}`,
            value: item.uuid,
          })}
          findParams={findParamsFromSearch}
          value={stockField.value ?? null}
          onChange={handleStockChange as any}
          error={stockFieldState.error?.message}
          isRequired
          isDisabled={disabled || !warehouseUuid}
        />
      </Box>

      <Box w={{ base: 'full', sm: '120px' }}>
        <InputReadOnly
          name={measurementField.name}
          label={text.measurement}
          value={measurementField.value || '—'}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <InputReadOnly
          name={stockQuantityField.name}
          label={text.stockAvailable}
          value={formatNumber(stockQuantity)}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={quantityField.name}
          label={text.quantity}
          allowDot
          decimalPlaces={2}
          min={0}
          value={quantity}
          onValueChange={(value) => quantityField.onChange(value ?? 0)}
          onBlur={handleQuantityBlur}
          disabled={disabled}
          error={quantityFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <InputReadOnly
          name={amountField.name}
          label={text.amount}
          value={formatNumber(amount)}
          error={amountFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <InputReadOnly
          name={totalField.name}
          label={text.total}
          value={formatNumber(roundedTotal)}
          error={totalFieldState.error?.message}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeItem}
        </Flex>
        <IconButtonTable
          aria-label={text.removeItem}
          mensegerTooltip={text.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

export function FoodBeatStockItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
  onTotalChange,
}: FoodBeatStockItemsEditorProps) {
  const text = languageGB.foodBeats.foodBeat.form.fields.stockItem;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `FoodFeedstocksEditor::genericControl`.
  const genericControl = control as unknown as Control<StockItemsFieldValues>;

  const arrayError = (errors as any)?.stockItems?.message as string | undefined;

  // `vl_total` (Total Geral) — 100% client-side/cosmético, nunca no payload.
  const watchedStockItems = useWatch({ control: genericControl, name: 'stockItems' }) ?? [];
  const grandTotal = watchedStockItems.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);
  const roundedGrandTotal = roundTo2(grandTotal);

  useEffect(() => {
    onTotalChange?.(roundedGrandTotal);
  }, [roundedGrandTotal, onTotalChange]);

  function handleAdd() {
    append({
      warehouse_id: null,
      stock_id: null,
      measurement_id: null,
      stock_quantity: 0,
      quantity: '',
      amount: 0,
      total: 0,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {text.sectionTitle}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.footerTotalLabel}:
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {formatNumber(roundedGrandTotal)}
          </Text>
        </Flex>
      </Flex>

      {arrayError && fields.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const otherRowsStockUuids = watchedStockItems
              .filter((_, otherIndex) => otherIndex !== index)
              .map((item) => item?.stock_id?.value)
              .filter((value): value is string => !!value);

            return (
              <FoodBeatStockItemRow
                key={field.id}
                control={genericControl}
                index={index}
                remove={remove}
                languageGB={languageGB}
                disabled={disabled}
                otherRowsStockUuids={otherRowsStockUuids}
              />
            );
          })}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default FoodBeatStockItemsEditor;
