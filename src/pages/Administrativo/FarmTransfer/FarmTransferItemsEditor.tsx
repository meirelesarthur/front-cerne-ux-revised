// src/pages/Administrativo/FarmTransfer/FarmTransferItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens da tela de CRIAÇÃO em lote de Trans. Fazendas
// (FarmTransfer — Estoque, Tarefa 02). Consumido por `CreateFarmTransfer.tsx`
// (campo `items` de `FarmTransferCreateForm`). Mirror ESTRUTURAL DIRETO de
// `WarehouseTransferItemsEditor.tsx` — MESMO idioma (`useFieldArray` vive no
// formulário PAI, cascata Armazém origem→Estoque via
// `originWarehouseUuid`, validação de duplicidade e de saldo insuficiente
// idênticas).
//
// Única divergência funcional vs. o irmão: `cost_center_id` é OPCIONAL
// aqui (mirror `FarmTransferRequest.items.*.cost_center_uuid: sometimes`,
// ao contrário do irmão que o exige) — o Select correspondente NÃO usa
// `isRequired`.
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

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FarmTransferCreateForm, FarmTransferItemForm } from '@/@types/v2/FarmTransfers';
import type { StockListItem } from '@/@types/v2/Stocks';

export interface FarmTransferItemsFieldValues {
  items: FarmTransferItemForm[];
}

export interface FarmTransferItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`FarmTransferCreateForm`, Tarefa 02). */
  control: Control<FarmTransferCreateForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<FarmTransferItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<FarmTransferItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<FarmTransferCreateForm>;
  languageGB: LanguageDate;
  /** Armazém (origem) do CABEÇALHO — filtro CLIENT-ONLY compartilhado por
   *  TODAS as linhas (`DA-WT-12`). `null` desabilita o select de Produto de
   *  cada linha. */
  originWarehouseUuid: string | null;
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

interface FarmTransferItemRowProps {
  control: Control<FarmTransferItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  originWarehouseUuid: string | null;
  /** `stock_id.value` das DEMAIS linhas — usado só para o bloqueio de duplicidade. */
  otherRowsStockUuids: string[];
}

function FarmTransferItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  originWarehouseUuid,
  otherRowsStockUuids,
}: FarmTransferItemRowProps) {
  const text = languageGB.farmTransfers.farmTransfer;
  const itemText = text.form.fields.item;

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mirror
  // `WarehouseTransferItemsEditor.tsx`.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

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
  const { field: costCenterField, fieldState: costCenterFieldState } = useController({
    control,
    name: `items.${index}.cost_center_id`,
  });

  // `listStocks({ warehouse_uuid })` — Produto/estoque de origem, filtrado
  // pelo Armazém (origem) ÚNICO do cabeçalho (`DA-WT-12`). Mirror exato do
  // irmão.
  const listRowStocks = useCallback(
    async (params: ListStocksParams) => {
      const response = await listStocks({
        ...params,
        warehouse_uuid: originWarehouseUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [originWarehouseUuid]
  );

  const stockQuantity = Number(stockQuantityField.value) || 0;
  const value = Number(valueField.value) || 0;
  const quantity = Number(quantityField.value) || 0;
  const roundedAmount = roundTo2(quantity * value);

  useEffect(() => {
    if (Number(amountField.value) !== roundedAmount) {
      amountField.onChange(roundedAmount);
    }
  }, [roundedAmount]);

  function handleStockChange(option: Option<string> | null) {
    if (option && otherRowsStockUuids.includes(option.value)) {
      toaster.error({
        title: text.singularLabel,
        description: itemText.duplicateStock,
      });
      stockField.onChange(null);
      measurementField.onChange('');
      stockQuantityField.onChange(0);
      valueField.onChange(0);
      quantityField.onChange('');
      return;
    }

    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    measurementField.onChange(stock?.unit ?? '');
    stockQuantityField.onChange(stock?.quantity ?? 0);
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
          cacheUniqs={[originWarehouseUuid]}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isRequired
          isDisabled={disabled || !originWarehouseUuid}
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
          onValueChange={(nextValue) => quantityField.onChange(nextValue ?? 0)}
          onBlur={handleQuantityBlur}
          disabled={disabled || !stockField.value}
          error={quantityFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <InputReadOnly
          name={valueField.name}
          label={itemText.unitValue}
          value={formatNumber(value)}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <InputReadOnly
          name={amountField.name}
          label={itemText.totalValue}
          value={formatNumber(roundedAmount)}
          error={amountFieldState.error?.message}
        />
      </Box>

      {/* `cost_center_id` OPCIONAL (diverge do irmão) — mirror
          `FarmTransferRequest.items.*.cost_center_uuid: sometimes`, sem
          `isRequired`. */}
      <Box flex="1" minW="200px">
        <SelectAsyncPaginate
          name={costCenterField.name}
          label={itemText.costCenter}
          service={listCostCenterOptions}
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

export function FarmTransferItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  originWarehouseUuid,
  disabled = false,
}: FarmTransferItemsEditorProps) {
  const text = languageGB.farmTransfers.farmTransfer;
  const itemText = text.form.fields.item;

  const genericControl = control as unknown as Control<FarmTransferItemsFieldValues>;

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
              <FarmTransferItemRow
                key={field.id}
                control={genericControl}
                index={index}
                remove={remove}
                languageGB={languageGB}
                disabled={disabled}
                originWarehouseUuid={originWarehouseUuid}
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

export default FarmTransferItemsEditor;
