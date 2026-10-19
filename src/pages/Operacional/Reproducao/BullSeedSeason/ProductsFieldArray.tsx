// src/pages/Operacional/Reproducao/BullSeedSeason/ProductsFieldArray.tsx
// -----------------------------------------------------------------------------
// Repetidor "Produtos" do formulário de Touros/Sêmen/Embrião (Tarefa 25,
// contrato de tela §5.3) — cascata OPCIONAL Armazém→Produto por linha.
// Mirror ESTRUTURAL DIRETO de `RequisitionItemsEditor.tsx`/
// `WarehouseTransferItemsEditor.tsx` (`useFieldArray` vive no formulário PAI,
// `useController` por campo dentro da linha), com a ÚNICA diferença de
// contrato: armazém é NULLABLE por linha (`GAP-BSS` da API) — quando a linha
// não tem armazém, o Produto vem de `product-options` (catálogo geral);
// quando tem, vem de `products-by-warehouse` (filtrado por estoque).
//
// `warehouseOptions` é compartilhado (1 chamada, resolvida no PAI, passada
// por prop) — mirror `animalOptions` de `AnimalsFieldArray.tsx`.
//
// `productsQuery` é POR LINHA (armadilha 4 do contrato de tela): a queryKey
// inclui `warehouseUuid ?? 'all'` — trocar o armazém da linha NUNCA reutiliza
// o cache de outra linha com armazém diferente, e todas as linhas SEM
// armazém compartilham naturalmente a entrada `'all'` (mesmo racional de
// dedupe do TanStack Query usado para `animalOptions`/`warehouseOptions`).
//
// `productDetailQuery` é disparado pela SELEÇÃO do produto (nunca pelo
// armazém, armadilha 6) — resolve UM/Estoque (`InputReadOnly` ×2), sempre
// read-only, nunca no payload. Quando a linha tem armazém, a "Estoque"
// exibida é a quantidade NAQUELE armazém (match por uuid); sem armazém, é a
// soma de todos os armazéns do produto (decisão de UX do Executor — o
// contrato não define o comportamento sem armazém, apenas que a exibição é
// sempre read-only).
//
// Trocar o Armazém da linha reseta SÓ Produto/Quantidade DAQUELA linha
// (armadilha 5, mirror `RequisitionItemsEditor::handleWarehouseChange`) —
// nunca as outras linhas, nunca o repetidor de Animais.
//
// Sem checagem de estoque no client (`GAP-BSS-07`) e sem `.min(1)` no schema
// (`GAP-BSS-06`) — mirror exato dos GAPs já documentados no contrato de API.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import { queryKey } from '@/constants/query-key';

import {
  getProductDetail,
  listProductOptions,
  listProductsByWarehouse,
} from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  BullSeedSeasonForm,
  BullSeedSeasonProductFieldValue,
  ProductOption,
} from '@/@types/v2/BullSeedSeason';

import type { FieldArrayWithId } from 'react-hook-form';

export interface ProductsFieldValues {
  products: BullSeedSeasonProductFieldValue[];
}

export interface ProductsFieldArrayProps {
  /** `control` do `useForm` do formulário PAI (`BullSeedSeasonForm`). */
  control: Control<BullSeedSeasonForm>;
  /** `fields` do `useFieldArray({ control, name: 'products' })` do PAI. */
  fields: FieldArrayWithId<ProductsFieldValues, 'products', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<ProductsFieldValues, 'products'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  errors: FieldErrors<BullSeedSeasonForm>;
  /** Opções de `warehouse-options` — 1 única chamada compartilhada (resolvida no PAI). */
  warehouseOptions: Option<string>[];
  warehouseOptionsLoading: boolean;
  languageGB: LanguageDate;
  disabled?: boolean;
}

function mapProductOption(item: ProductOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ProductRowProps {
  control: Control<ProductsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  warehouseOptions: Option<string>[];
  warehouseOptionsLoading: boolean;
  languageGB: LanguageDate;
  disabled: boolean;
}

function ProductRow({
  control,
  index,
  remove,
  warehouseOptions,
  warehouseOptionsLoading,
  languageGB,
  disabled,
}: ProductRowProps) {
  const text = languageGB.bullSeedSeason.bullSeedSeason.form.products;

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `products.${index}.warehouse`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `products.${index}.product`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `products.${index}.quantity`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;
  const productUuid = productField.value?.value ?? null;

  // Cascata condicional (armadilha 3/4) — queryKey inclui o uuid do
  // armazém DESTA linha (ou 'all'); nunca compartilha cache entre linhas
  // com armazéns diferentes. Linhas SEM armazém compartilham a mesma
  // entrada 'all' naturalmente (mesmo racional de `animalOptions`).
  const productsQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'products', warehouseUuid ?? 'all'],
    queryFn: () => (warehouseUuid ? listProductsByWarehouse(warehouseUuid) : listProductOptions()),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const productOptions = (productsQuery.data ?? []).map(mapProductOption);

  // Disparado pela SELEÇÃO do produto (armadilha 6), nunca pelo armazém.
  const productDetailQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'product-detail', productUuid],
    queryFn: () => getProductDetail(productUuid as string),
    enabled: !!productUuid,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const measurement = productDetailQuery.data?.measurement ?? '—';
  const stocks = productDetailQuery.data?.stocks ?? [];
  const stockQuantity = productUuid
    ? warehouseUuid
      ? (stocks.find((stock) => stock.warehouse?.uuid === warehouseUuid)?.quantity ?? 0)
      : stocks.reduce((sum, stock) => sum + stock.quantity, 0)
    : null;

  // Troca do Armazém DESTA linha — reseta SÓ Produto/Quantidade desta linha
  // (armadilha 5, mirror `RequisitionItemsEditor::handleWarehouseChange`).
  function handleWarehouseChange(option: Option<string> | null) {
    const previousUuid = warehouseUuid;
    warehouseField.onChange(option ?? null);

    if ((option?.value ?? null) === previousUuid) return;

    productField.onChange(null);
    quantityField.onChange('');
  }

  function handleProductChange(option: Option<string> | null) {
    productField.onChange(option ?? null);
    if (!option) {
      quantityField.onChange('');
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="200px">
        <Select
          name={warehouseField.name}
          label={text.warehouseLabel}
          options={warehouseOptions}
          value={warehouseField.value ?? null}
          onChange={handleWarehouseChange}
          error={warehouseFieldState.error?.message}
          loading={warehouseOptionsLoading}
          isDisabled={disabled}
        />
      </Box>

      <Box flex="2" minW="220px">
        <Select
          name={productField.name}
          label={text.productLabel}
          options={productOptions}
          value={productField.value ?? null}
          onChange={handleProductChange}
          error={productFieldState.error?.message}
          loading={productsQuery.isLoading}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box w={{ base: 'full', sm: '110px' }}>
        <InputReadOnly
          name={`products.${index}.measurement-display`}
          label={text.measurementLabel}
          value={productUuid ? measurement : '—'}
          loading={!!productUuid && productDetailQuery.isLoading}
        />
      </Box>

      <Box w={{ base: 'full', sm: '130px' }}>
        <InputReadOnly
          name={`products.${index}.stock-display`}
          label={text.stockLabel}
          value={stockQuantity !== null ? formatQuantity(stockQuantity) : '—'}
          loading={!!productUuid && productDetailQuery.isLoading}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={quantityField.name}
          label={text.quantityLabel}
          allowDot
          decimalPlaces={2}
          min={0}
          value={quantityField.value === '' ? null : Number(quantityField.value)}
          onValueChange={(nextValue) => quantityField.onChange(nextValue ?? '')}
          error={quantityFieldState.error?.message}
          isRequired
          disabled={disabled || !productUuid}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeButton}
        </Flex>
        <IconButtonTable
          type="button"
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
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

export function ProductsFieldArray({
  control,
  fields,
  append,
  remove,
  warehouseOptions,
  warehouseOptionsLoading,
  languageGB,
  disabled = false,
}: ProductsFieldArrayProps) {
  const text = languageGB.bullSeedSeason.bullSeedSeason.form.products;

  const genericControl = control as unknown as Control<ProductsFieldValues>;

  function handleAdd() {
    append({ warehouse: null, product: null, quantity: '' });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyState}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <ProductRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              warehouseOptions={warehouseOptions}
              warehouseOptionsLoading={warehouseOptionsLoading}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default ProductsFieldArray;
