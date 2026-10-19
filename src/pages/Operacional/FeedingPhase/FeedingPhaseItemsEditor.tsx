// src/pages/Operacional/FeedingPhase/FeedingPhaseItemsEditor.tsx
// -----------------------------------------------------------------------------
// Repeater da COMPOSIÇÃO (itens) de Fase de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-03). Consumido pelo
// formulário completo create/edit (`CreateOrUpdateFeedingPhase.tsx`, campo
// `items` de `FeedingPhaseForm`). Mirror estrutural de
// `DietIngredientsEditor.tsx`.
//
// Decisão estrutural (mirror `DietIngredientsEditor`): NÃO instancia seu
// próprio `useFieldArray` — `fields`/`append`/`remove` chegam via props; o
// `useFieldArray({ name: 'items' })` vive no formulário PAI
// (`CreateOrUpdateFeedingPhase.tsx`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Alert, Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { feedingPhaseChangeRuleOptions } from '@/constants/feeding-phase/options';

import type { LanguageDate } from '@/@types/language';
import type { FeedingPhaseForm } from '@/@types/v2/FeedingPhases';

import { FeedingPhaseItemRow } from './FeedingPhaseItemRow';

import type { FeedingPhaseItemsFieldValues } from './FeedingPhaseItemRow';

export interface FeedingPhaseItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`FeedingPhaseForm`, TASK-FP-FE-03). */
  control: Control<FeedingPhaseForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<FeedingPhaseItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<FeedingPhaseItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<FeedingPhaseForm>;
  /** `getValues`/`setError`/`clearErrors` do `useForm` do PAI — repassados
   *  a cada `FeedingPhaseItemRow` para a validação IMEDIATA cross-item
   *  (Esteira 051), que precisa enxergar TODOS os itens. */
  getValues: UseFormGetValues<FeedingPhaseForm>;
  setError: UseFormSetError<FeedingPhaseForm>;
  clearErrors: UseFormClearErrors<FeedingPhaseForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function FeedingPhaseItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  getValues,
  setError,
  clearErrors,
  languageGB,
  disabled = false,
}: FeedingPhaseItemsEditorProps) {
  const text = languageGB.feedingPhases.feedingPhase.form.items;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `DietIngredientsEditor::genericControl`: resolve os paths concretos
  // contra `FeedingPhaseItemsFieldValues`.
  const genericControl = control as unknown as Control<FeedingPhaseItemsFieldValues>;
  const genericGetValues = getValues as unknown as UseFormGetValues<FeedingPhaseItemsFieldValues>;
  const genericSetError = setError as unknown as UseFormSetError<FeedingPhaseItemsFieldValues>;
  const genericClearErrors =
    clearErrors as unknown as UseFormClearErrors<FeedingPhaseItemsFieldValues>;

  // Erro de nível de ARRAY (`.min(1)` do Yup) — mesmo cast pragmático de
  // `DietIngredientsEditor::arrayError`.
  const arrayError = (errors as any)?.items?.message as string | undefined;

  function handleAdd() {
    append({
      diet_id: null,
      change_rule: feedingPhaseChangeRuleOptions.getOption('PD', languageGB),
      minimum_start: '',
      maximum_end: '',
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {text.title}
        </Text>
      </Flex>

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
            {arrayError || text.title}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <FeedingPhaseItemRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              languageGB={languageGB}
              disabled={disabled}
              getValues={genericGetValues}
              setError={genericSetError}
              clearErrors={genericClearErrors}
            />
          ))}
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

export default FeedingPhaseItemsEditor;
