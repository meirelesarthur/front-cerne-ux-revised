// src/pages/Operacional/Diet/DietIngredientsEditor.tsx
// -----------------------------------------------------------------------------
// Repeater da COMPOSIÇÃO (ingredientes) de Dieta (Diet — Operacional/
// Pecuária, TASK-FE-DIET-03). Consumido pelo formulário completo create/
// edit (`CreateOrUpdateDiet.tsx`, campo `ingredients` de `DietForm`). Mirror
// estrutural de `FoodFeedstocksEditor.tsx`.
//
// Decisão estrutural (mirror `FoodFeedstocksEditor`): NÃO instancia seu
// próprio `useFieldArray` — `fields`/`append`/`remove` chegam via props; o
// `useFieldArray({ name: 'ingredients' })` vive no formulário PAI
// (`CreateOrUpdateDiet.tsx`).
//
// Rótulo de `quantity`/total muda por `type` (P/U), mirror
// `FoodFeedstocksEditor`. Total é 100% client-side/cosmético (`useWatch`),
// NUNCA chega ao payload — exposto ao formulário PAI via `onTotalChange`; a
// trava real de DESABILITAR o "Salvar" fica no formulário pai (SR-BTN-07).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Alert, Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { DIET_TYPE } from '@/constants/diet/diet-type';

import type { LanguageDate } from '@/@types/language';
import type { DietForm, DietType } from '@/@types/v2/Diets';

import { DietIngredientRow } from './DietIngredientRow';

import type { DietIngredientsFieldValues } from './DietIngredientRow';

export interface DietIngredientsEditorProps {
  /** `control` do `useForm` do formulário PAI (`DietForm`, TASK-FE-DIET-03). */
  control: Control<DietForm>;
  /** `fields` do `useFieldArray({ control, name: 'ingredients' })` do PAI. */
  fields: FieldArrayWithId<DietIngredientsFieldValues, 'ingredients', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<DietIngredientsFieldValues, 'ingredients'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `Diet.type` do cabeçalho — governa o rótulo dinâmico (P/U) e a trava visual de soma=100%. */
  type: DietType;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<DietForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** Reflete o total calculado (cosmético) para o PAI decidir se trava o submit. */
  onTotalChange?: (total: number) => void;
}

export function DietIngredientsEditor({
  control,
  fields,
  append,
  remove,
  type,
  errors,
  languageGB,
  disabled = false,
  onTotalChange,
}: DietIngredientsEditorProps) {
  const text = languageGB.diets.diet.form.fields;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `FoodFeedstocksEditor::genericControl`: resolve os paths concretos de
  // `useWatch` contra `DietIngredientsFieldValues`.
  const genericControl = control as unknown as Control<DietIngredientsFieldValues>;

  // Erro de nível de ARRAY (`.min(1)` do Yup) — mesmo cast pragmático de
  // `FoodFeedstocksEditor::arrayError`.
  const arrayError = (errors as any)?.ingredients?.message as string | undefined;

  const isPercentageType = type === DIET_TYPE.PERCENTAGE;
  const totalLabel = isPercentageType
    ? `${text.ingredientQuantityP}`
    : `${text.ingredientQuantityU}`;

  // Total — 100% client-side/cosmético (`useWatch`), nunca chega ao payload.
  const watchedIngredients = useWatch({ control: genericControl, name: 'ingredients' }) ?? [];
  const total = watchedIngredients.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
  const roundedTotal = Math.round(total * 100) / 100;
  const isSumInvalid = isPercentageType && Math.abs(roundedTotal - 100) >= 0.01;

  // `useEffect` (não durante o render) — evita "Cannot update a component
  // while rendering a different component" (mirror `FoodFeedstocksEditor`).
  useEffect(() => {
    onTotalChange?.(roundedTotal);
  }, [roundedTotal, onTotalChange]);

  function handleAdd() {
    append({
      product_id: null,
      measurement_id: null,
      dry_matter: 0,
      cost_value: 0,
      quantity: 0,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {text.ingredients}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {totalLabel}:
          </Text>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={isSumInvalid ? 'fg.error' : 'fg.default'}
          >
            {isPercentageType
              ? `${roundedTotal.toLocaleString('pt-BR')}%`
              : roundedTotal.toLocaleString('pt-BR')}
          </Text>
        </Flex>
      </Flex>

      {isSumInvalid && (
        <Alert.Root status="warning" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {languageGB.diets.diet.form.validation.ingredientsSumMustBe100}
            </Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {arrayError && fields.length > 0 && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{arrayError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.ingredients}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <DietIngredientRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              type={type}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addIngredient}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default DietIngredientsEditor;
