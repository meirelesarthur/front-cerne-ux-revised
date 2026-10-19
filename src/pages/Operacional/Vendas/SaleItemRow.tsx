// src/pages/Operacional/Vendas/SaleItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens da Venda COMERCIAL (Sale — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-04, `FM003`/
// `_card-item.blade.php`). Consumida por `SaleItemsEditor.tsx`
// (`items.${index}` de `SaleForm`, `useFieldArray` no PAI —
// `CreateOrUpdateSale.tsx`).
//
// Mirror ESTRUTURAL de `Operacional/Pedidos/OrderItemRow.tsx` (desconto
// valor↔percentual bidirecional, remoção com confirmação/`isOnlyRow`),
// cruzado com `Operacional/Carregamento/ChargeItemRow.tsx` (armazém+produto+
// estoque+UM, satélite de armazém PLANO + cascata de estoque por linha).
//
// Cascatas (`IG002..IG011`, contrato-tela §6.1/§7.4):
//   - IG002 — armazém OU produto muda → `listStockAvailability(warehouse,
//     product)` (`enabled` só com os dois preenchidos, `queryKey:
//     [queryKey.sales.saleStockAvailability, warehouse, product]`) → `qtd_
//     stock`. SEM armazém: estoque em branco (o legado só consulta com
//     armazém escolhido) — trocar o armazém limpa `qtd_stock` na mesma hora
//     (a query fica `disabled` e não dispara evento algum).
//   - IG003 — produto muda → `um` do `measurement` (cache do PRÓPRIO
//     `/products/options`, mirror `OrderItemRow.productCacheRef` — sem 2º
//     request) OU do lookup de estoque quando ele resolve (autoridade mais
//     recente sobrescreve).
//   - IG004 — total da linha SEMPRE calculado (`quantity×price−discount`,
//     `useEffect` seguro pois `total_amount` nunca é editado pelo usuário,
//     mirror `OrderItemRow`/`BudgetItemRow`).
//   - IG005/IG006 — `discount`/`discount_percent` blur, bidirecional, guarda
//     de divisão por zero (`base<=0 -> 0`); excesso é clampado + toast (mesma
//     mensagem do `.test()` cruzado do Yup, `sale-schema.ts`).
//   - IG007 — `quantity` blur: `qty > qtd_stock` clampa ao estoque + toast
//     fiel ao Swal legado (`{informed}`/`{available}`); aditivo funcional
//     (`D003` corrigido): `qtd_stock − qty < min_stock` avisa "estoque abaixo
//     do mínimo" (`StockAvailabilityItem.min_stock`, dado real do endpoint —
//     o legado só lia um atributo `data-min-stock` nunca renderizado).
//   - PARADA-4 — Produto **readonly** em linha EXISTENTE no modo edição
//     (`uuid` presente); editável em linha NOVA (`uuid` ausente).
//
// `qtd_stock`/`um`/`discount_percent`/`total_amount` NUNCA vão ao payload
// (`CreateOrUpdateSale.tsx::tryPersistSale`) — confirmado por leitura direta.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Control, UseFieldArrayRemove, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { categoryProductType } from '@/constants/CategoryProducts/category-product-type';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { SaleForm, SaleItemForm } from '@/@types/v2/Sales';

import { useSaleWarehouseOptions } from './useSales';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// CLM-030 (mirror `OrderItemRow`) — guarda div-by-zero: sem base
// (`quantity×price=0`), o percentual é sempre 0 (nunca `NaN`/`Infinity`).
function computeDiscountPercent(discount: number, base: number): number {
  if (base <= 0) return 0;
  return roundTo2((discount / base) * 100);
}

function computeDiscountFromPercent(percent: number, base: number): number {
  if (base <= 0) return 0;
  return roundTo2((percent / 100) * base);
}

function formatQuantity4(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapProductOption(item: ProductOptionItem): Option<string> {
  return {
    label: item.code ? `${item.code} — ${item.description}` : item.description,
    value: item.uuid,
  };
}

/**
 * Linha NOVA — usada por "Adicionar item" (`SaleItemsEditor.handleAdd`) e por
 * `defaultValues.items` de `CreateOrUpdateSale.tsx` em modo CRIAÇÃO. SEM
 * `uuid` (linha nova, cai no branch de criação do servidor — SE003).
 *
 * @return {SaleItemForm} Objeto vazio, pronto para `append`/`defaultValues`.
 */
export function createEmptySaleItem(): SaleItemForm {
  return {
    warehouse: null,
    product: null,
    qtd_stock: null,
    um: '',
    quantity: '',
    price: '',
    discount: 0,
    discount_percent: 0,
    total_amount: 0,
    note: null,
  };
}

/**
 * IG010 — gate de completude ("Adicionar item" só clona se a linha atual
 * tiver produto+qtd+preço, mirror `isOrderItemRowComplete`).
 *
 * @param {SaleItemForm | undefined} item Linha do `useFieldArray('items')`.
 * @return {boolean} `true` quando `product`/`quantity`/`price` estão
 *   preenchidos e a linha pode ser clonada por "Adicionar item".
 */
export function isSaleItemRowComplete(item: SaleItemForm | undefined): boolean {
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

export interface SaleItemRowProps {
  control: Control<SaleForm>;
  index: number;
  remove: UseFieldArrayRemove;
  /** `true` quando esta é a ÚLTIMA linha restante — recusa remover sem
   *  diálogo (IG011/PARADA-3, mín. 1 linha sempre). */
  isOnlyRow: boolean;
  /** PARADA-4 — modo EDIÇÃO do form pai (`!!uuid` da rota). Produto fica
   *  readonly só quando a PRÓPRIA linha já existe no servidor (`item.uuid`
   *  presente); linha nova continua editável mesmo em edição. */
  isEditingSale: boolean;
  languageGB: LanguageDate;
  disabled: boolean;
}

export function SaleItemRow({
  control,
  index,
  remove,
  isOnlyRow,
  isEditingSale,
  languageGB,
  disabled,
}: SaleItemRowProps) {
  const text = languageGB.sales.sale;
  const itemText = text.form.fields.item;
  const messages = text.form.validation;

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const { field: uuidField } = useController({ control, name: `items.${index}.uuid` });
  const { field: warehouseField } = useController({ control, name: `items.${index}.warehouse` });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product`,
  });
  const { field: qtdStockField } = useController({ control, name: `items.${index}.qtd_stock` });
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
  const { field: noteField } = useController({ control, name: `items.${index}.note` });

  // PARADA-4 — readonly só em linha EXISTENTE (`uuid` do `SaleItemData`
  // original) no modo edição; linha nova (`append`, sem `uuid`) continua
  // editável mesmo dentro de uma Venda em edição.
  const isProductReadonly = isEditingSale && !!uuidField.value;

  // ---- Satélite PLANO de Armazém (mirror `useChargeItemWarehouseOptions`) --
  const warehouseQuery = useSaleWarehouseOptions();
  const noStockOption: Option<string> = { label: itemText.noStockOption, value: '' };
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item) => ({ label: `${item.initials} — ${item.description}`, value: item.uuid })
  );
  const warehouseUuid = warehouseField.value?.value || undefined;

  // ---- Cache local do Produto (mirror `OrderItemRow.productCacheRef`) — UM
  // hidratada do MESMO Resource enxuto do catálogo, sem 2º request. --------
  const productCacheRef = useRef(new Map<string, ProductOptionItem>());

  async function listRowProducts(params: Parameters<typeof listProductOptions>[0]) {
    const response = await listProductOptions({
      ...params,
      category_type: categoryProductType.production,
    });
    response.data.items.forEach((item) => productCacheRef.current.set(item.uuid, item));
    return response;
  }

  const productUuid = productField.value?.value || undefined;

  // ---- IG002 — lookup de estoque, SÓ com armazém+produto preenchidos -------
  const stockQuery = useQuery({
    queryKey: [queryKey.sales.saleStockAvailability, warehouseUuid, productUuid],
    queryFn: () =>
      listStockAvailability({ warehouse_uuid: warehouseUuid, product_uuid: productUuid }),
    enabled: !!warehouseUuid && !!productUuid,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const stockItem = stockQuery.data?.data.items?.[0];

  // IG002/IG003 — o lookup de estoque é a fonte MAIS recente/autoritativa de
  // `qtd_stock`/`um` quando resolve (sobrescreve o hint do cache de produto).
  // Sem armazém OU sem produto: a query fica `disabled`, este efeito não
  // dispara — `qtd_stock` é limpo IMPERATIVAMENTE nos handlers de `onChange`
  // abaixo (mirror `ChargeItemRow`, IG-01).
  useEffect(() => {
    if (!warehouseUuid || !productUuid) return;
    if (stockItem) {
      qtdStockField.onChange(stockItem.quantity);
      if (stockItem.measurement?.name) {
        umField.onChange(stockItem.measurement.name);
      }
    } else if (stockQuery.isFetched) {
      qtdStockField.onChange(null);
    }
  }, [stockItem, stockQuery.isFetched, warehouseUuid, productUuid]);

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? noStockOption);
    // Sem armazém: estoque em branco (o legado só consulta com armazém
    // escolhido) — limpeza IMEDIATA, a query nem chega a rodar.
    if (!option?.value) {
      qtdStockField.onChange(null);
    }
  }

  // IG001/IG003 — cascata produto→UM IMPERATIVA (dispara no `change`, fiel ao
  // "no change" do legado); troca de produto invalida o `qtd_stock` anterior
  // (contexto de estoque mudou) até o lookup (IG002) resolver de novo.
  function handleProductChange(option: Option<string> | null) {
    productField.onChange(option ?? null);
    qtdStockField.onChange(null);

    if (!option) {
      umField.onChange('');
      return;
    }

    const cached = productCacheRef.current.get(option.value);
    umField.onChange(cached?.measurement?.description ?? '');
  }

  const quantity = Number(quantityField.value) || 0;
  const price = Number(priceField.value) || 0;
  const discount = Number(discountField.value) || 0;
  const base = roundTo2(quantity * price);
  const lineTotal = roundTo2(base - discount);

  // IG004 — total da linha SEMPRE calculado (`quantity×price−discount`),
  // nunca editável — `useEffect` seguro (mirror `OrderItemRow`/`BudgetItemRow`).
  useEffect(() => {
    if (Number(totalField.value) !== lineTotal) {
      totalField.onChange(lineTotal);
    }
  }, [lineTotal]);

  // IG007 — `quantity` blur: clampa ao estoque disponível + toast fiel ao
  // Swal legado; aditivo funcional (`D003` corrigido) — aviso de estoque
  // mínimo quando o saldo remanescente cai abaixo de `min_stock`.
  function handleQuantityBlur() {
    if (!warehouseUuid || qtdStockField.value == null) return;

    const stock = Number(qtdStockField.value);
    let effectiveQuantity = quantity;

    if (effectiveQuantity > stock) {
      const message = messages.itemQuantityExceedsStockTemplate
        .replace('{informed}', formatQuantity4(effectiveQuantity))
        .replace('{available}', formatQuantity4(stock));
      toaster.warning({ title: itemText.quantity, description: message });
      effectiveQuantity = stock;
      quantityField.onChange(effectiveQuantity);
    }

    const minStock = stockItem?.min_stock;
    const remaining = stock - effectiveQuantity;
    if (minStock != null && remaining >= 0 && remaining < minStock) {
      toaster.warning({ title: itemText.quantity, description: messages.itemMinStockWarning });
    }
  }

  // IG005 — `discount` blur: recomputa `discount_percent` + valida
  // `discount ≤ quantity×price`; excesso é clampado ao teto e avisado (mesma
  // mensagem do `.test()` cruzado do Yup, defesa em profundidade).
  function handleDiscountBlur() {
    let nextDiscount = discount;
    if (nextDiscount > base) {
      toaster.warning({ title: itemText.discount, description: messages.itemDiscountExceedsTotal });
      nextDiscount = 0;
      discountField.onChange(nextDiscount);
    }
    discountPercentField.onChange(computeDiscountPercent(nextDiscount, base));
  }

  // IG006 — `discount_percent` blur: recomputa `discount` + valida `≤100`;
  // excesso é clampado a 0 e avisado. Guarda CLM-030 embutida em
  // `computeDiscountFromPercent` (base<=0 -> 0).
  function handleDiscountPercentBlur() {
    const currentPercent = Number(discountPercentField.value) || 0;
    let nextPercent = currentPercent;
    if (nextPercent > 100) {
      toaster.warning({
        title: itemText.discountPercent,
        description: messages.itemDiscountPercentMax,
      });
      nextPercent = 0;
      discountPercentField.onChange(nextPercent);
    }
    discountField.onChange(computeDiscountFromPercent(nextPercent, base));
  }

  // IG011/PARADA-3 — mantém pelo menos 1 linha (`isOnlyRow`, gate do PAI):
  // recusa direto, sem diálogo. Caso contrário, confirma antes de remover.
  function handleRemoveClick() {
    if (isOnlyRow) {
      toaster.error({ title: itemText.removeItem, description: itemText.removeLastError });
      return;
    }
    setConfirmRemoveOpen(true);
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Select
          name={warehouseField.name}
          label={itemText.warehouse}
          placeholder={itemText.warehousePlaceholder}
          value={warehouseField.value ?? noStockOption}
          onChange={(option: Option<string> | null) => handleWarehouseChange(option)}
          options={[noStockOption, ...warehouseCatalogOptions]}
          loading={warehouseQuery.isLoading}
          noClearable
          isDisabled={disabled}
        />

        <SelectAsyncPaginate
          name={productField.name}
          label={itemText.product}
          placeholder={itemText.productPlaceholder}
          service={listRowProducts}
          mapOptions={mapProductOption}
          findParams={findParamsFromSearch}
          cacheUniqs={[categoryProductType.production]}
          value={productField.value ?? null}
          onChange={(option: any) => handleProductChange(option ?? null)}
          error={productFieldState.error?.message}
          isRequired
          isDisabled={disabled || isProductReadonly}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />

        <InputReadOnly
          label={itemText.qtdStock}
          value={qtdStockField.value != null ? formatQuantity4(Number(qtdStockField.value)) : '—'}
        />

        <InputReadOnly label={itemText.um} value={umField.value || '—'} />

        <NumberInput
          name={quantityField.name}
          label={itemText.quantity}
          allowDot
          decimalPlaces={4}
          value={quantity}
          onValueChange={(value) => quantityField.onChange(value ?? '')}
          onBlur={handleQuantityBlur}
          error={quantityFieldState.error?.message}
          isRequired
          disabled={disabled}
        />

        <NumberInput
          name={priceField.name}
          label={itemText.price}
          allowDot
          decimalPlaces={4}
          value={price}
          onValueChange={(value) => priceField.onChange(value ?? '')}
          error={priceFieldState.error?.message}
          isRequired
          disabled={disabled}
        />

        <MoneyInput
          name={discountField.name}
          label={itemText.discount}
          value={discount}
          onValueChange={(value) => discountField.onChange(value)}
          onBlur={handleDiscountBlur}
          error={discountFieldState.error?.message}
          disabled={disabled}
        />

        <PercentInput
          name={discountPercentField.name}
          label={itemText.discountPercent}
          maxValue={100}
          value={Number(discountPercentField.value) || 0}
          onValueChange={(value) => discountPercentField.onChange(value)}
          onBlur={handleDiscountPercentBlur}
          error={discountPercentFieldState.error?.message}
          disabled={disabled}
        />

        <InputReadOnly
          name={totalField.name}
          label={itemText.total}
          value={formatCurrencyBRL(lineTotal)}
        />

        <Input
          label={itemText.note}
          name={noteField.name}
          value={noteField.value ?? ''}
          onChange={(e) => noteField.onChange(e.target.value)}
          disabled={disabled}
        />
      </SimpleGrid>

      {stockQuery.isError && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {itemText.stockLoadError}
        </Text>
      )}

      <Flex justify="flex-end" mt={3}>
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
    </Box>
  );
}

export default SaleItemRow;
