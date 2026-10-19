// src/pages/Administrativo/WarehouseTransfer/WarehouseTransferItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens da tela de CRIAÇÃO em lote de Trans. Armazém
// (WarehouseTransfer — Estoque, TASK-WT-FE-03). Consumido por
// `CreateWarehouseTransfer.tsx` (campo `items` de `WarehouseTransferCreateForm`).
//
// Molde ESTRUTURAL (não literal) de `FoodBeatStockItemsEditor.tsx`
// (`useFieldArray` vive no formulário PAI — `fields`/`append`/`remove`
// chegam via props, mesmo racional documentado naquele arquivo).
//
// DIVERGÊNCIA ESTRUTURAL do molde FoodBeat (achado do Arquiteto, TASK-WT-FE-03
// "Leitura do dev" — NÃO REPLICAR o padrão per-linha do FoodBeat aqui): no
// Blade legado (`_forms.blade.php`+`create.blade.php:61-63`, função JS global
// `getProducts(warehouse_id)`), o Armazém de ORIGEM é um ÚNICO select no
// CABEÇALHO do formulário PAI, compartilhado por TODAS as linhas — não há
// select de armazém por linha aqui. Este editor recebe o armazém de origem
// via prop (`originWarehouseUuid`), não gerencia esse estado.
//
// Cascata Origem→Estoque: `stock_id` só habilita depois de
// `originWarehouseUuid` escolhido no CABEÇALHO (`listStocks({ warehouse_uuid
// })`); `cacheUniqs={[originWarehouseUuid]}` força o `AsyncPaginate` a
// descartar o cache de opções quando o armazém do cabeçalho muda (mesmo
// mecanismo já usado em `AppropriationStockTab.tsx`).
//
// Risco 1 (`value` SEMPRE readonly em criação, `_forms.blade.php:67`,
// autofill de `Stock.average_cost`) — diferente da tela de EDIÇÃO
// (TASK-WT-FE-04), onde é editável. `amount` (Valor Total) SEMPRE readonly e
// calculado = `quantity × value` (`useEffect`, sincronizado ao RHF — mirror
// `FoodBeatStockItemRow::totalField`).
//
// Risco 2 (duplicidade de `stock_id` entre linhas, mirror
// `create.blade.php:74-80`, `has_duplicated`) — client-side, via comparação
// contra as DEMAIS linhas do próprio `useWatch`, toast + limpa o campo, mesma
// técnica de `FoodBeatStockItemsEditor::handleStockChange`.
//
// Risco 4 (validação de saldo insuficiente, `quantity > stock_quantity`) —
// client-side no `onBlur`, mirror EXATO
// `FoodBeatStockItemsEditor::handleQuantityBlur` (toast + limpa o campo). O
// backend também valida (422, `ValidateSufficientStockAction`) — client-side
// é só feedback antecipado, não substitui a validação real.
//
// GAP DECLARADO, não implementado nesta Tarefa (não-bloqueante): alerta de
// "estoque abaixo do mínimo" (`create.blade.php:122-126`, `data-min_stock`) —
// `StockListItem` (`GET /stocks`, endpoint reusado para este dropdown) NÃO
// expõe `min_stock` (confirmado por leitura do tipo em `TASK-WT-FE-01`). O
// contrato da API (`WarehouseTransfer-contrato.md ## 8` item 2) já trata esse
// alerta como responsabilidade só do frontend, informativo, não bloqueante —
// sem o dado, não implementado aqui (SEM MOCK).
//
// Todos os botões (`Adicionar Item`/remoção por linha) usam `type="button"`
// EXPLÍCITO — dentro de um `<form>`, um `<button>` sem `type` default para
// `submit` e dispararia o envio do formulário ao ser clicado.
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
import type { StockListItem } from '@/@types/v2/Stocks';
import type {
  WarehouseTransferCreateForm,
  WarehouseTransferItemForm,
} from '@/@types/v2/WarehouseTransfers';

export interface WarehouseTransferItemsFieldValues {
  items: WarehouseTransferItemForm[];
}

export interface WarehouseTransferItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`WarehouseTransferCreateForm`, TASK-WT-FE-03). */
  control: Control<WarehouseTransferCreateForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<WarehouseTransferItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<WarehouseTransferItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<WarehouseTransferCreateForm>;
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

interface WarehouseTransferItemRowProps {
  control: Control<WarehouseTransferItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  originWarehouseUuid: string | null;
  /** `stock_id.value` das DEMAIS linhas — usado só para o bloqueio de duplicidade. */
  otherRowsStockUuids: string[];
}

function WarehouseTransferItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  originWarehouseUuid,
  otherRowsStockUuids,
}: WarehouseTransferItemRowProps) {
  const text = languageGB.warehouseTransfers.warehouseTransfer;
  const itemText = text.form.fields.item;

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mesmo
  // racional documentado em `FoodBeatStockItemsEditor.tsx`. Dado real da
  // MESMA resposta que popula o dropdown, sem endpoint novo.
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
  // pelo Armazém (origem) ÚNICO do cabeçalho (`DA-WT-12`). NUNCA
  // `listStockAvailability`/`/stocks/available` (sem `uuid`/`average_cost`,
  // ver `warehouse-transfer-service.ts`).
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

  // `amount` precisa estar sincronizado no RHF — `CreateWarehouseTransfer`
  // extrai `items[i].amount` para `WarehouseTransferItemPayload.amount`
  // (`## 9` item 2 — confiar no cliente, sem recompute no servidor).
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
      // Mirror `create.blade.php:81-84` — duplicidade rejeita a seleção
      // (select2 volta a `''`) e reaplica o `readonly()` de `quantity`
      // (`_forms.blade.php:63`), limpando o valor já digitado.
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
    // Risco 1 — `value` autofill de `Stock.average_cost`, SEMPRE readonly em
    // criação (nunca editado pelo usuário neste modo).
    valueField.onChange(stock?.average_cost ?? 0);

    if (!option) {
      // Produto limpo — `quantity` volta a vazio (mirror
      // `create.blade.php:96-97`, `!value` reaplica `readonly()` + limpa o
      // valor); o estado `disabled` abaixo já reflete `!stockField.value`.
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
        {/* Mirror `_forms.blade.php:63` (`quantity[]` nasce `readonly()`) +
            `create.blade.php:88` (`removeAttr('readonly')` só após produto
            selecionado) + `create.blade.php:96-97` (`!value` reaplica
            `readonly()`) — `quantity` só é editável com estoque escolhido. */}
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

      {/* Risco 1 — SEMPRE readonly em criação (autofill de `average_cost`),
          diferente da tela de EDIÇÃO (TASK-WT-FE-04), onde é editável. */}
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

export function WarehouseTransferItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  originWarehouseUuid,
  disabled = false,
}: WarehouseTransferItemsEditorProps) {
  const text = languageGB.warehouseTransfers.warehouseTransfer;
  const itemText = text.form.fields.item;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `FoodBeatStockItemsEditor::genericControl`.
  const genericControl = control as unknown as Control<WarehouseTransferItemsFieldValues>;

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
              <WarehouseTransferItemRow
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

export default WarehouseTransferItemsEditor;
