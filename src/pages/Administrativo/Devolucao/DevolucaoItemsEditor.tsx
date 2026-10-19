// src/pages/Administrativo/Devolucao/DevolucaoItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens da tela de CRIAÇÃO em lote de Devolução/Entrada
// (Devolution — Estoque, 97-Esteiras/037, Tarefa 08). Consumido por
// `CreateDevolucao.tsx` (campo `items` de `DevolutionCreateForm`).
//
// Mirror ESTRUTURAL DIRETO de `RequisitionItemsEditor.tsx` (`useFieldArray`
// vive no formulário PAI). ÚNICA divergência estrutural: `warehouse_id` é
// CLIENT-ONLY — filtra a cascata de estoque desta linha, mas NUNCA entra em
// `DevolutionItemPayload` (`StoreDevolutionItemData` não tem
// `warehouse_uuid`, diferente de `Requisition`) — por isso NÃO é `isRequired`
// no Select (sem validação de negócio, só UX de busca, mirror da Leitura do
// dev #4/schema `devolution-create-schema.ts`).
//
// Cascata Armazém→Estoque POR LINHA, Risco 1 (`value` sempre readonly,
// autofill `average_cost`), Risco 2 (duplicidade de `stock_id` entre
// linhas) e Risco 4 (validação de saldo insuficiente) — todos mirror EXATO
// do irmão.
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

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';
import type { ListStocksParams } from '@/services/v2/Stocks/stock-service';
import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { DevolutionCreateForm, DevolutionItemForm } from '@/@types/v2/Devolutions';
import type { StockListItem } from '@/@types/v2/Stocks';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';

function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

export interface DevolutionItemsFieldValues {
  items: DevolutionItemForm[];
}

export interface DevolutionItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`DevolutionCreateForm`, Tarefa 08). */
  control: Control<DevolutionCreateForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<DevolutionItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<DevolutionItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<DevolutionCreateForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

interface DevolutionItemRowProps {
  control: Control<DevolutionItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  /** `stock_id.value` das DEMAIS linhas — usado só para o bloqueio de duplicidade. */
  otherRowsStockUuids: string[];
}

function DevolutionItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  otherRowsStockUuids,
}: DevolutionItemRowProps) {
  const text = languageGB.devolutions.devolution;
  const itemText = text.form.fields.item;

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mesmo
  // racional de `RequisitionItemsEditor.tsx`.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  const isFirstRender = useRef(true);

  // DEV-1 (CORRECAO-R2, mirror EXATO do E4 de `EntradaInsumosItemsTab.tsx`)
  // — flag do ÚLTIMO campo editado pelo usuário (`quantity`/`value` vs.
  // `amount`) — evita o loop de recálculo: o cálculo DIRETO (abaixo) só
  // roda quando quem disparou a mudança NÃO foi o próprio `amount`.
  const lastEditedFieldRef = useRef<'quantity_or_value' | 'amount'>('quantity_or_value');

  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `items.${index}.stock_id`,
  });
  const { field: measurementField } = useController({
    control,
    name: `items.${index}.measurement`,
  });
  const { field: stockQuantityField } = useController({
    control,
    name: `items.${index}.stock_quantity`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: valueField } = useController({
    control,
    name: `items.${index}.value`,
  });
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: `items.${index}.amount`,
  });
  // Armazém DESTA linha — CLIENT-ONLY, filtra a cascata de Estoque desta
  // linha, NUNCA entra em `DevolutionItemPayload` (divergência #4 vs. Requisição).
  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `items.${index}.warehouse_id`,
  });
  // Centro de Custo DESTA linha — mirror direto de `RequisitionItemRow`,
  // `only_analytic: true`.
  const { field: costCenterField, fieldState: costCenterFieldState } = useController({
    control,
    name: `items.${index}.cost_center_id`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;

  // `listStocks({ warehouse_uuid })` — Produto/estoque, filtrado pelo
  // Armazém DESTA linha (filtro CLIENT-ONLY).
  const listRowStocks = useCallback(
    async (params: ListStocksParams) => {
      const response = await listStocks({
        ...params,
        warehouse_uuid: warehouseUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [warehouseUuid]
  );

  const stockQuantity = Number(stockQuantityField.value) || 0;
  const value = Number(valueField.value) || 0;
  const quantity = Number(quantityField.value) || 0;
  const roundedAmount = roundTo2(quantity * value);

  // Troca do Armazém DESTA linha — reseta SÓ os campos desta linha.
  function handleWarehouseChange(option: Option<string> | null) {
    const previousUuid = warehouseUuid;
    warehouseField.onChange(option ?? null);

    if ((option?.value ?? null) === previousUuid) return;

    stockField.onChange(null);
    measurementField.onChange('');
    stockQuantityField.onChange(0);
    lastEditedFieldRef.current = 'quantity_or_value';
    valueField.onChange(0);
    quantityField.onChange('');
  }

  // DEV-1 (CORRECAO-R2) — Cálculo DIRETO: `quantity × value → amount`
  // (preview client-side, mesma técnica anti-loop do E4). `amount` precisa
  // permanecer sincronizado no RHF — `CreateDevolucao` extrai
  // `items[i].amount` para `DevolutionItemPayload.amount`.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lastEditedFieldRef.current === 'amount') return;
    amountField.onChange(roundedAmount);
  }, [quantity, value]);

  // DEV-1 (CORRECAO-R2) — Recálculo INVERSO: editar "Vl. Total" com
  // `quantity > 0` ajusta `value = amount / quantity` (4 casas), mirror
  // `handleTotalValueChange` de `EntradaInsumosItemsTab.tsx`.
  function handleAmountChange(nextValue: number | null) {
    lastEditedFieldRef.current = 'amount';
    amountField.onChange(nextValue ?? 0);

    if (quantity > 0) {
      const nextValueField = Math.round(((nextValue ?? 0) / quantity) * 10000) / 10000;
      valueField.onChange(nextValueField);
    }
  }

  function handleStockChange(option: Option<string> | null) {
    if (option && otherRowsStockUuids.includes(option.value)) {
      toaster.error({
        title: text.singularLabel,
        description: itemText.duplicateStock,
      });
      stockField.onChange(null);
      measurementField.onChange('');
      stockQuantityField.onChange(0);
      lastEditedFieldRef.current = 'quantity_or_value';
      valueField.onChange(0);
      quantityField.onChange('');
      return;
    }

    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    measurementField.onChange(stock?.unit ?? '');
    stockQuantityField.onChange(stock?.quantity ?? 0);
    // DEV-1 (CORRECAO-R2) — `value` recebe o PREFILL de `Stock.average_cost`
    // (conveniência), mas é EDITÁVEL — o usuário pode sobrescrever. Troca de
    // estoque conta como edição de "quantity_or_value" (recalcula `amount`).
    lastEditedFieldRef.current = 'quantity_or_value';
    valueField.onChange(stock?.average_cost ?? 0);

    if (!option) {
      quantityField.onChange('');
    }
  }

  function handleQuantityBlur() {
    if (!stockField.value) return;
    const enteredQuantity = Number(quantityField.value) || 0;
    if (enteredQuantity > stockQuantity) {
      quantityField.onChange('');
      toaster.error({
        title: text.singularLabel,
        description: itemText.insufficientStock,
      });
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      {/* CORRECAO-R1/D2 — Armazém movido para a PRIMEIRA coluna da linha,
          antes de Produto (só ordem visual; a cascata Produto `isDisabled`
          até haver `warehouseUuid` já estava correta). */}
      <Box flex="1" minW="200px">
        <SelectAsyncPaginate
          name={warehouseField.name}
          label={itemText.warehouse}
          service={listWarehouses}
          mapOptions={mapWarehouseOption}
          findParams={findParamsFromSearch}
          value={warehouseField.value ?? null}
          onChange={handleWarehouseChange as any}
          error={warehouseFieldState.error?.message}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={disabled}
        />
      </Box>

      <Box flex="2" minW="220px">
        <SelectAsyncPaginate
          name={stockField.name}
          label={itemText.product}
          service={listRowStocks}
          mapOptions={(item: StockListItem) => ({
            label: `${item.product.code} — ${item.info}`,
            value: item.uuid,
          })}
          findParams={findParamsFromSearch}
          value={stockField.value ?? null}
          onChange={handleStockChange as any}
          error={stockFieldState.error?.message}
          cacheUniqs={[warehouseUuid]}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isRequired
          isDisabled={disabled || !warehouseUuid}
        />
      </Box>

      <Box w={{ base: 'full', sm: '130px' }}>
        <InputReadOnly
          name={stockQuantityField.name}
          label={itemText.stockAvailable}
          value={formatNumber(stockQuantity)}
        />
      </Box>

      <Box w={{ base: 'full', sm: '110px' }}>
        <InputReadOnly
          name={measurementField.name}
          label={itemText.measurement}
          value={measurementField.value || '—'}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={quantityField.name}
          label={itemText.quantity}
          allowDot
          decimalPlaces={2}
          min={0}
          value={quantity}
          onValueChange={(nextValue) => {
            lastEditedFieldRef.current = 'quantity_or_value';
            quantityField.onChange(nextValue ?? 0);
          }}
          onBlur={handleQuantityBlur}
          disabled={disabled || !stockField.value}
          error={quantityFieldState.error?.message}
        />
      </Box>

      {/* DEV-1 (CORRECAO-R2) — EDITÁVEL (deixou de ser hard-readonly);
          prefill de `average_cost` ao selecionar o Estoque continua (ver
          `handleStockChange`), mas o usuário pode sobrescrever. Cálculo
          mútuo com `amount` via `lastEditedFieldRef` (anti-loop, mirror E4). */}
      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={valueField.name}
          label={itemText.unitValue}
          allowDot
          decimalPlaces={4}
          value={value}
          onValueChange={(nextValue) => {
            lastEditedFieldRef.current = 'quantity_or_value';
            valueField.onChange(nextValue ?? 0);
          }}
          disabled={disabled || !stockField.value}
        />
      </Box>

      {/* DEV-1 (CORRECAO-R2) — EDITÁVEL; recálculo INVERSO ajusta `value`
          quando `quantity > 0` (`handleAmountChange`, mirror
          `handleTotalValueChange` de `EntradaInsumosItemsTab.tsx`). */}
      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={amountField.name}
          label={itemText.totalValue}
          allowDot
          decimalPlaces={2}
          value={amountField.value ?? null}
          onValueChange={handleAmountChange}
          disabled={disabled || !stockField.value}
          error={amountFieldState.error?.message}
        />
      </Box>

      {/* `cost_center_id` DESTA linha — mirror direto de
          `RequisitionItemRow::costCenterField`, `only_analytic: true`. */}
      <Box flex="1" minW="200px">
        <SelectAsyncPaginate
          name={costCenterField.name}
          label={itemText.costCenter}
          service={(params) => listCostCenterOptions({ ...params, only_analytic: true })}
          mapOptions={(item: CostCenterRef) => ({
            label: `${item.code} — ${item.description}`,
            value: item.uuid,
          })}
          findParams={findParamsFromSearch}
          value={costCenterField.value ?? null}
          onChange={(option: any) => costCenterField.onChange(option ?? null)}
          error={costCenterFieldState.error?.message}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {itemText.removeItem}
        </Flex>
        <IconButtonTable
          type="button"
          aria-label={itemText.removeItem}
          mensegerTooltip={itemText.removeItem}
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

export function DevolucaoItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: DevolutionItemsEditorProps) {
  const text = languageGB.devolutions.devolution;
  const itemText = text.form.fields.item;

  const genericControl = control as unknown as Control<DevolutionItemsFieldValues>;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  const watchedItems = useWatch({ control: genericControl, name: 'items' }) ?? [];
  const grandTotal = watchedItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const roundedGrandTotal = roundTo2(grandTotal);

  function handleAdd() {
    append({
      stock_id: null,
      measurement: '',
      stock_quantity: 0,
      quantity: '',
      value: 0,
      amount: 0,
      warehouse_id: null,
      cost_center_id: null,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {itemText.sectionTitle}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {itemText.footerTotalLabel}:
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
            {arrayError || itemText.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const otherRowsStockUuids = watchedItems
              .filter((_, otherIndex) => otherIndex !== index)
              .map((item) => item?.stock_id?.value)
              .filter((value): value is string => !!value);

            return (
              <DevolutionItemRow
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
        type="button"
        title={itemText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default DevolucaoItemsEditor;
