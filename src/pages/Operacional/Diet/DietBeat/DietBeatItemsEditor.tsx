// src/pages/Operacional/Diet/DietBeat/DietBeatItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens DERIVADOS da Dieta selecionada (DietBeat — Operacional/
// Pecuária, TASK-FE-DIET-06). Molde EXATO
// `FoodBeat/FoodBeatFormulationItemsEditor.tsx` — NÃO instancia seu próprio
// `useFieldArray`; `fields` chega via props, `useFieldArray({ name: 'items'
// })` vive no formulário PAI (`CreateOrUpdateDietBeat.tsx`), que faz
// `replace()` ao trocar a Dieta (`getDiet(uuid)` → 1 linha por ingrediente).
//
// `ingredientProductUuids` — prop ADICIONAL por linha (alinhada por índice a
// `fields`/`Diet.ingredients[]`), resolvida pelo formulário PAI. Cada linha
// usa o próprio uuid para filtrar `listStocks({ product_uuid })`.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { Control, FieldArrayWithId, FieldErrors } from 'react-hook-form';

import type { LanguageDate } from '@/@types/language';
import type { DietBeatForm } from '@/@types/v2/DietBeats';

import { DietBeatItemRow } from './DietBeatItemRow';

import type { DietBeatItemsFieldValues } from './DietBeatItemRow';

export interface DietBeatItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`DietBeatForm`, TASK-FE-DIET-06). */
  control: Control<DietBeatForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<DietBeatItemsFieldValues, 'items', 'id'>[];
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<DietBeatForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** `DietBeatForm.quantity` do cabeçalho (Quantidade Produzida). */
  headerQuantity: number;
  /** `Diet.quantity` da Dieta escolhida (Quantidade Referência). */
  dietReferenceQuantity: number;
  /** `Diet.type` da Dieta escolhida — governa `/100` de CV-06. */
  isPercentageDiet: boolean;
  /** uuid do produto (ingrediente) de CADA linha, alinhado por índice com
   *  `fields`/`Diet.ingredients[]` — resolvido pelo formulário PAI ao
   *  carregar a Dieta via `getDiet`. */
  ingredientProductUuids: (string | null)[];
}

export function DietBeatItemsEditor({
  control,
  fields,
  errors,
  languageGB,
  disabled = false,
  headerQuantity,
  dietReferenceQuantity,
  isPercentageDiet,
  ingredientProductUuids,
}: DietBeatItemsEditorProps) {
  const text = languageGB.dietBeats.dietBeat.form.fields.item;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `FoodBeatFormulationItemsEditor::genericControl`.
  const genericControl = control as unknown as Control<DietBeatItemsFieldValues>;

  // Erro de nível de ARRAY (`.min(1)` do Yup).
  const arrayError = (errors as any)?.items?.message as string | undefined;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {arrayError && fields.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyUntilDiet}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4}>
          {fields.map((field, index) => (
            <DietBeatItemRow
              key={field.id}
              control={genericControl}
              index={index}
              languageGB={languageGB}
              disabled={disabled}
              headerQuantity={headerQuantity}
              dietReferenceQuantity={dietReferenceQuantity}
              isPercentageDiet={isPercentageDiet}
              ingredientProductUuid={ingredientProductUuids[index] ?? null}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}

export default DietBeatItemsEditor;
