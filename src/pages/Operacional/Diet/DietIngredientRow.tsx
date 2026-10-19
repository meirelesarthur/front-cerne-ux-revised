// src/pages/Operacional/Diet/DietIngredientRow.tsx
// -----------------------------------------------------------------------------
// Linha de composição (ingrediente) de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-03). Extraída em arquivo próprio (mirror `diet-beat-columns`/
// convenção do task-packet), diferente de `FoodFeedstockRow` (que vive
// dentro de `FoodFeedstocksEditor.tsx`) — mesma técnica (`useController` por
// campo, cascata Produto→Unidade via `useProductMeasurementOptions`
// REUSADO de `Fabrica/`, SEM handler global por seletor de classe).
//
// Campos (FD-DIETS-R-01..06, `arquitetura-frontend-dieta.md`): `product_id`
// (SelectAsyncPaginate, `food_eligibility=feedstock`, GAP-DIET-FE-01),
// `measurement_id` (cascata), `quantity` (money/percent dual conforme
// `Diet.type` — mirror `Food.percentage`), `cost_value` (money, autofill
// CV-05 — sugestão, editável), `total` (readonly, preview `quantity*
// cost_value`, AD-06), `dry_matter` (%, money).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

// Reuso EXPLÍCITO instruído pelo contrato — molde 1:1 de Food (não
// duplicado): cascata Produto→Unidade de Medida.
import { useProductMeasurementOptions } from '@/pages/Administrativo/Fabrica/useProductMeasurementOptions';

import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { DIET_TYPE } from '@/constants/diet/diet-type';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { LanguageDate } from '@/@types/language';
import type { DietIngredientItemForm, DietType } from '@/@types/v2/Diets';

import { useProductCostValue } from './useProductCostValue';

// Select de ingrediente (matéria-prima) — mirror EXATO de `listProductOptions`
// com `food_eligibility: 'feedstock'` (GAP-DIET-FE-01: reuso do padrão de
// `Food`, paridade de categoria a confirmar pelo Tester).
async function listFeedstockProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'feedstock' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface DietIngredientsFieldValues {
  ingredients: DietIngredientItemForm[];
}

interface DietIngredientRowProps {
  control: Control<DietIngredientsFieldValues>;
  index: number;
  remove: (index: number) => void;
  type: DietType;
  languageGB: LanguageDate;
  disabled: boolean;
}

export function DietIngredientRow({
  control,
  index,
  remove,
  type,
  languageGB,
  disabled,
}: DietIngredientRowProps) {
  const text = languageGB.diets.diet.form.fields;
  const isPercentageType = type === DIET_TYPE.PERCENTAGE;

  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `ingredients.${index}.product_id`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `ingredients.${index}.measurement_id`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `ingredients.${index}.quantity`,
  });
  const { field: costValueField, fieldState: costValueFieldState } = useController({
    control,
    name: `ingredients.${index}.cost_value`,
  });
  const { field: dryMatterField, fieldState: dryMatterFieldState } = useController({
    control,
    name: `ingredients.${index}.dry_matter`,
  });

  const productUuid = productField.value?.value ?? null;
  const measurementUuid = measurementField.value?.value ?? null;

  const { options: measurementOptions, isLoading: isLoadingMeasurements } =
    useProductMeasurementOptions(productUuid);

  // CV-05 — sugestão de `cost_value` (preview, editável). Só sugere quando o
  // campo ainda está zerado/vazio — NÃO sobrescreve um valor já digitado
  // pelo usuário (mirror do racional "autofill não pisa em edição manual").
  const { suggestedCostValue } = useProductCostValue(productUuid, measurementUuid);
  useEffect(() => {
    if (productUuid && !Number(costValueField.value)) {
      costValueField.onChange(suggestedCostValue);
    }
  }, [productUuid, measurementUuid, suggestedCostValue]);

  // Total da linha — PREVIEW client-side (`quantity*cost_value`, CV-01/AD-06),
  // NUNCA enviado no payload (o servidor recalcula).
  const rowTotal = (Number(quantityField.value) || 0) * (Number(costValueField.value) || 0);

  function handleProductChange(option: { label: string; value: string } | null) {
    const nextUuid = option?.value ?? null;
    const previousUuid = productField.value?.value ?? null;
    productField.onChange(option ?? null);
    if (nextUuid !== previousUuid) {
      measurementField.onChange(null);
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={productField.name}
          label={text.ingredientProduct}
          service={listFeedstockProductOptions}
          mapOptions={mapProductOption}
          findParams={findParamsFromSearch}
          value={productField.value ?? undefined}
          onChange={handleProductChange as any}
          error={productFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box flex="1" minW="160px">
        <Select
          name={measurementField.name}
          label={text.ingredientMeasurement}
          value={measurementField.value ?? undefined}
          onChange={measurementField.onChange}
          options={measurementOptions}
          isDisabled={disabled || !productUuid}
          loading={isLoadingMeasurements}
          error={measurementFieldState.error?.message}
          isRequired
        />
      </Box>

      <Box w={{ base: 'full', sm: '150px' }}>
        <NumberInput
          name={dryMatterField.name}
          label={text.ingredientDryMatter}
          allowDot
          decimalPlaces={2}
          min={0}
          value={Number(dryMatterField.value) || 0}
          onValueChange={(value) => dryMatterField.onChange(value ?? 0)}
          disabled={disabled}
          error={dryMatterFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '150px' }}>
        <NumberInput
          name={costValueField.name}
          label={text.ingredientCostValue}
          allowDot
          decimalPlaces={2}
          min={0}
          value={Number(costValueField.value) || 0}
          onValueChange={(value) => costValueField.onChange(value ?? 0)}
          disabled={disabled}
          error={costValueFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '150px' }}>
        {isPercentageType ? (
          <PercentInput
            name={quantityField.name}
            label={text.ingredientQuantityP}
            value={Number(quantityField.value) || 0}
            maxValue={100}
            disabled={disabled}
            onValueChange={quantityField.onChange}
            error={quantityFieldState.error?.message}
          />
        ) : (
          <NumberInput
            name={quantityField.name}
            label={text.ingredientQuantityU}
            allowDot
            decimalPlaces={2}
            min={0}
            value={Number(quantityField.value) || 0}
            onValueChange={(value) => quantityField.onChange(value ?? 0)}
            disabled={disabled}
            error={quantityFieldState.error?.message}
          />
        )}
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <Text fontSize="sm" color="fg.muted" mb={1}>
          {text.ingredientTotal}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" fontVariantNumeric="tabular-nums">
          {rowTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeIngredient}
        </Flex>
        <IconButtonTable
          aria-label={text.removeIngredient}
          mensegerTooltip={text.removeIngredient}
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
