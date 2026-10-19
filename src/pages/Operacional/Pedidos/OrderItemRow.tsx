// src/pages/Operacional/Pedidos/OrderItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens do Pedido (Order — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-04). Consumida por `OrderItemsEditor.tsx`
// (`items.${index}` de `OrderForm`, `useFieldArray` no PAI —
// `CreateOrUpdateOrder.tsx`, PED-FE-03).
//
// Mirror estrutural de `Budget/BudgetItemsEditor.tsx` (`BudgetItemRow`) +
// `Romaneios/RomaneioItemRow.tsx` (remoção com confirmação `useState` +
// `DeleteConfirmDialog`, mirror EXATO — F-014/IG-009).
//
// PED-FE-08 — botão "+"/"editar" (`InlineProductModal`) ao lado do select de
// produto (SURF-020..025, IG-022/026, mirror `clientModalDisclosure` de
// `CreateOrUpdateOrder.tsx`/PED-FE-07): cada linha tem seu PRÓPRIO
// `useDisclosure` local (várias linhas independentes, ao contrário do
// cliente único do cabeçalho). Ao salvar, o produto novo/editado é injetado
// no `productCacheRef` desta linha (mesmo shape do `ProductOptionItem` já
// cacheado pela busca AJAX) e selecionado via `handleProductChange` — "UM" e
// demais efeitos em cascata (IG-001) disparam pelo MESMO caminho de uma
// seleção manual, sem duplicar lógica.
//
// Campos (F-007..F-014, contrato-tela §6.1):
//   - `product` — `SelectAsyncPaginate` sobre `listProductOptions` (SEM
//     filtro `category_type` — o contrato de tela não pede paridade com o
//     filtro de PRODUCTION usado em Budget; Pedidos vende qualquer produto
//     do catálogo). `change` hidrata `um` (IG-001) a partir do CACHE local
//     da própria resposta paginada (`ProductOptionResource.measurement` já
//     vem embutido — SEM 2º request, ao contrário do GAP-BG-FE-08 de Budget,
//     que precisava buscar o produto completo só para o `las_price`; aqui
//     não há default de preço a hidratar, `price` nasce sempre vazio/0
//     conforme F-010).
//   - `um` — `InputReadOnly`, populada pelo cache acima. Nunca submetida
//     (F-008, `OrderItemPayload` não tem `um`).
//   - `quantity`/`price` — `NumberInput` 4 casas (F-009/F-010). Blur dispara
//     recompute de `total_amount` (IG-002/003) — na prática um `useEffect`
//     seguro (mirror `BudgetItemRow`/`RomaneioItemRow`), já que `total` nunca
//     é editado pelo usuário.
//   - `discount` — `MoneyInput` 2 casas (F-011). Blur (IG-004): recomputa
//     `discount_percent` e VALIDA `discount ≤ quantity×price` — excesso é
//     clampado ao teto + toast com a mensagem literal do legado (mesma usada
//     pelo `.test()` cruzado do Yup, `order-schema.ts`, defesa em profundidade
//     no submit).
//   - `discount_percent` — `PercentInput` (F-012, não submetido). Blur
//     (IG-005): recomputa `discount` e VALIDA `≤100` — excesso é clampado a
//     100 + toast (mesma mensagem do teste Yup). Guarda CLM-030 (div-by-zero
//     quando `quantity×price=0`): a base do percentual usa `base<=0 ? 0 :
//     …`, nunca `NaN`/`Infinity`.
//   - `total_amount` — `InputReadOnly`, `useEffect`: `(quantity×price) −
//     discount`, arredondado 2c (CV-003) — cobre IG-002..005 (todo blur que
//     muda `quantity`/`price`/`discount` recalcula o total via este único
//     efeito, sem duplicar a fórmula em 3 handlers).
//   - `olds` — NUNCA renderizado/registrado nesta linha (PARADA-DEF-D,
//     mirror do comentário em `CreateOrUpdateOrder.tsx`): o valor inicial
//     vem de `append()`(create, ausente) ou `reset()`(edit,
//     `order_item.uuid`, `fillOrderForm`) e permanece intocado no estado do
//     RHF sem precisar de `useController` — registrar um input para ele só
//     arriscaria uma reescrita acidental.
//
// Todos os botões usam `type="button"` EXPLÍCITO — dentro do `<form>` do
// pai, um `<button>` sem `type` default para `submit`.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, useDisclosure } from '@chakra-ui/react';
import { Control, UseFieldArrayRemove, useController } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type {
  ListProductOptionsParams,
  ProductOptionItem,
} from '@/services/v2/Products/product-service';

import type { LanguageDate } from '@/@types/language';
import type { OrderForm, OrderItemForm } from '@/@types/v2/Orders';

import { InlineProductModal } from './dialogs/InlineProductModal';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// CLM-030 — guarda div-by-zero: sem base (`quantity×price=0`), o percentual
// é sempre 0 (nunca `NaN`/`Infinity`), nunca deriva do valor absoluto.
function computeDiscountPercent(discount: number, base: number): number {
  if (base <= 0) return 0;
  return roundTo2((discount / base) * 100);
}

function computeDiscountFromPercent(percent: number, base: number): number {
  if (base <= 0) return 0;
  return roundTo2((percent / 100) * base);
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

/**
 * Shape default de uma linha de item NOVA — usada pelo botão "Adicionar
 * item" (`OrderItemsEditor.handleAdd`) e pelo `defaultValues.items` de
 * `CreateOrUpdateOrder.tsx` em modo CRIAÇÃO (1 linha vazia já nasce, mirror
 * `createEmptyBudgetItem`/AJUSTE #3 de Budget). SEM `olds` (linha nova, cai
 * no branch de criação do servidor — PARADA-DEF-D).
 *
 * @return {OrderItemForm} Objeto vazio, pronto para `append`/`defaultValues`.
 */
export function createEmptyOrderItem(): OrderItemForm {
  return {
    product: null,
    um: '',
    quantity: '',
    price: '',
    discount: 0,
    discount_percent: 0,
    total_amount: 0,
  };
}

/**
 * Todos os campos preenchidos (product/quantity/price) — gate de IG-008
 * ("Adicionar item" só clona se a linha atual estiver completa, mirror
 * `isRowComplete` de `RomaneioItemsTab.tsx`). `discount`/`discount_percent`
 * nascem com default `0` (F-011/F-012) — sempre "preenchidos", não entram no
 * gate.
 *
 * @param {OrderItemForm | undefined} item Linha do `useFieldArray('items')`.
 * @return {boolean} `true` quando `product`/`quantity`/`price` estão
 *   preenchidos e a linha pode ser clonada por "Adicionar item".
 */
export function isOrderItemRowComplete(item: OrderItemForm | undefined): boolean {
  if (!item) return false;
  return (
    !!item.product?.value &&
    item.quantity !== null &&
    item.quantity !== undefined &&
    item.quantity !== '' &&
    Number(item.quantity) > 0 &&
    item.price !== null &&
    item.price !== undefined &&
    item.price !== ''
  );
}

export interface OrderItemRowProps {
  /** `control` do `useForm` do formulário PAI (`OrderForm`, PED-FE-03). */
  control: Control<OrderForm>;
  index: number;
  remove: UseFieldArrayRemove;
  /** `true` quando esta é a ÚLTIMA linha restante — bloqueia remover sem
   *  diálogo (IG-009, mirror `RomaneioItemsTab.handleRemove`). */
  isOnlyRow: boolean;
  languageGB: LanguageDate;
  disabled: boolean;
}

export function OrderItemRow({
  control,
  index,
  remove,
  isOnlyRow,
  languageGB,
  disabled,
}: OrderItemRowProps) {
  const text = languageGB.orders.order;
  const itemText = text.form.fields.item;
  const messages = text.form.validation;

  const { can } = usePermissions();
  const productModalDisclosure = useDisclosure();

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // Cache local (`uuid` -> registro completo do `ProductOptionItem`) — mesmo
  // racional de `productCacheRef` em `BudgetItemRow`: dado real da MESMA
  // resposta que popula o dropdown, sem endpoint novo (`measurement` já vem
  // no `ProductOptionResource`, sem o gap de preço que Budget tem).
  const productCacheRef = useRef(new Map<string, ProductOptionItem>());

  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product`,
  });
  const { field: umField } = useController({ control, name: `items.${index}.um` });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: priceField, fieldState: priceFieldState } = useController({
    control,
    name: `items.${index}.price`,
  });
  const { field: discountField, fieldState: discountFieldState } = useController({
    control,
    name: `items.${index}.discount`,
  });
  const { field: discountPercentField, fieldState: discountPercentFieldState } = useController({
    control,
    name: `items.${index}.discount_percent`,
  });
  const { field: totalField } = useController({ control, name: `items.${index}.total_amount` });

  async function listRowProducts(params: ListProductOptionsParams) {
    const response = await listProductOptions(params);
    response.data.items.forEach((item) => productCacheRef.current.set(item.uuid, item));
    return response;
  }

  const quantity = Number(quantityField.value) || 0;
  const price = Number(priceField.value) || 0;
  const discount = Number(discountField.value) || 0;
  const base = roundTo2(quantity * price);
  const lineTotal = roundTo2(base - discount);

  // CV-003 — total do item SEMPRE calculado (IG-002/003/004/005 convergem
  // aqui), nunca editável — `useEffect` é seguro pois `total_amount` não é
  // campo que o usuário edita (mirror `BudgetItemRow`/`RomaneioItemRow`).
  useEffect(() => {
    if (Number(totalField.value) !== lineTotal) {
      totalField.onChange(lineTotal);
    }
  }, [lineTotal]);

  // IG-001 — cascata produto→UM, IMPERATIVA (só dispara no `change` do
  // select, fiel ao "no change" do legado).
  function handleProductChange(option: { label: string; value: string } | null) {
    productField.onChange(option ?? null);

    if (!option) {
      umField.onChange('');
      return;
    }

    const cached = productCacheRef.current.get(option.value);
    umField.onChange(cached?.measurement?.description ?? '');
  }

  // IG-022/026 — `InlineProductModal` salvou (criar OU editar): injeta o
  // registro completo no MESMO cache local (`productCacheRef`, shape
  // `ProductOptionItem`) antes de selecionar — reusa `handleProductChange`
  // (IG-001) em vez de duplicar a hidratação de "UM", único caminho de
  // seleção de produto desta linha.
  function handleProductSaved(product: {
    uuid: string;
    code: string;
    description: string;
    measurement: { label: string; value: string } | null;
    measurementSecond?: { label: string; value: string } | null;
  }) {
    productCacheRef.current.set(product.uuid, {
      uuid: product.uuid,
      code: product.code,
      description: product.description,
      requires_coffee_fields: false,
      measurement: product.measurement
        ? { uuid: product.measurement.value, description: product.measurement.label }
        : undefined,
      measurement_second: product.measurementSecond
        ? { uuid: product.measurementSecond.value, description: product.measurementSecond.label }
        : null,
    } as ProductOptionItem);

    handleProductChange({
      label: `${product.code} — ${product.description}`,
      value: product.uuid,
    });
  }

  // IG-004 — `discount` blur: recomputa `discount_percent` + valida
  // `discount ≤ quantity×price`; excesso é clampado ao teto e avisado (mesma
  // mensagem do `.test()` cruzado do Yup, defesa em profundidade).
  function handleDiscountBlur() {
    let nextDiscount = discount;
    if (nextDiscount > base) {
      toaster.error({ title: itemText.discount, description: messages.itemDiscountExceedsTotal });
      nextDiscount = base;
      discountField.onChange(nextDiscount);
    }
    discountPercentField.onChange(computeDiscountPercent(nextDiscount, base));
  }

  // IG-005 — `discount_percent` blur: recomputa `discount` + valida `≤100`;
  // excesso é clampado a 100 e avisado. Guarda CLM-030 embutida em
  // `computeDiscountFromPercent` (base<=0 -> 0).
  function handleDiscountPercentBlur() {
    const currentPercent = Number(discountPercentField.value) || 0;
    let nextPercent = currentPercent;
    if (nextPercent > 100) {
      toaster.error({
        title: itemText.discountPercent,
        description: messages.itemDiscountPercentMax,
      });
      nextPercent = 100;
      discountPercentField.onChange(nextPercent);
    }
    discountField.onChange(computeDiscountFromPercent(nextPercent, base));
  }

  // IG-009 — mantém pelo menos um (`isOnlyRow`, gate do PAI): recusa direto,
  // sem diálogo (mirror `RomaneioItemsTab.handleRemove`). Caso contrário,
  // confirma antes de remover (SweetAlert→`DeleteConfirmDialog`, mirror
  // `RomaneioItemRow`).
  function handleRemoveClick() {
    if (isOnlyRow) {
      toaster.error({ title: itemText.removeItem, description: itemText.removeLastError });
      return;
    }
    setConfirmRemoveOpen(true);
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="240px">
          <SelectAsyncPaginate
            name={productField.name}
            label={itemText.product}
            placeholder={itemText.productPlaceholder}
            service={listRowProducts}
            mapOptions={mapProductOption}
            findParams={findParamsFromSearch}
            value={productField.value ?? null}
            onChange={handleProductChange as any}
            error={productFieldState.error?.message}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={disabled}
            // PED-FE-08 — botão "+"/"editar" (`InlineProductModal`) migrado
            // do `IconButton` avulso para o `labelAction`, mirror
            // `CreateOrUpdateOrder.tsx::clientModalDisclosure` (IG-022).
            labelActionTooltip={
              productField.value ? itemText.productModal.editAria : itemText.productModal.addAria
            }
            labelAction={
              <IconButton
                aria-label={
                  productField.value
                    ? itemText.productModal.editAria
                    : itemText.productModal.addAria
                }
                variant="ghost"
                size="2xs"
                minH="0"
                h="20px"
                w="20px"
                minW="0"
                p="0"
                disabled={disabled || !(can('products_create') || can('products_edit'))}
                onClick={productModalDisclosure.onOpen}
              >
                <Icon as={productField.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
              </IconButton>
            }
          />
        </Box>

        <Box w={{ base: 'full', sm: '100px' }}>
          <InputReadOnly name={umField.name} label={itemText.um} value={umField.value || '—'} />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={quantityField.name}
            label={itemText.quantity}
            allowDot
            decimalPlaces={4}
            min={0}
            value={quantity}
            onValueChange={(nextValue) => quantityField.onChange(nextValue ?? '')}
            disabled={disabled}
            error={quantityFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={priceField.name}
            label={itemText.price}
            allowDot
            decimalPlaces={4}
            min={0}
            value={price}
            onValueChange={(nextValue) => priceField.onChange(nextValue ?? '')}
            disabled={disabled}
            error={priceFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <MoneyInput
            name={discountField.name}
            label={itemText.discount}
            value={discount}
            onValueChange={(nextValue) => discountField.onChange(nextValue)}
            onBlur={handleDiscountBlur}
            disabled={disabled}
            error={discountFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '120px' }}>
          <PercentInput
            name={discountPercentField.name}
            label={itemText.discountPercent}
            value={Number(discountPercentField.value) || 0}
            onValueChange={(nextValue) => discountPercentField.onChange(nextValue)}
            onBlur={handleDiscountPercentBlur}
            disabled={disabled}
            error={discountPercentFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={totalField.name}
            label={itemText.total}
            value={formatCurrencyBRL(lineTotal)}
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
            onClick={handleRemoveClick}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>

      <DeleteConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={() => {
          setConfirmRemoveOpen(false);
          remove(index);
        }}
        title={itemText.removeConfirm.title}
        description={itemText.removeConfirm.description}
        warningText=""
        hideQuestionMark
        colorPalette="red"
      />

      <InlineProductModal
        isOpen={productModalDisclosure.open}
        onClose={productModalDisclosure.onClose}
        productUuid={productField.value?.value}
        onSaved={handleProductSaved}
      />
    </Box>
  );
}

export default OrderItemRow;
