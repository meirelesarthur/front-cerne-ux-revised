// src/pages/Operacional/Processamentos/ProcessingAnimalIdentificationsSection.tsx
// -----------------------------------------------------------------------------
// Sub-repeater `identifications[]` de UMA linha de animal (TASK-FE-039-PROC-03)
// — mirror `Operacional/Nascimentos/BirthAnimalIdentificationsSection.tsx`,
// adaptado para viver DENTRO de `ProcessingAnimalRow`: o `useFieldArray`
// deste sub-repeater é LOCAL a esta seção (mirror do racional do
// front-plan-proc.md §3.4.2 — "cada linha usa `useFieldArray({control, name:
// 'animals.${index}.identifications'})` local", diferente do repeater de
// `animals[]`, cujo `useFieldArray` vive no PAI DA TELA).
//
// MÍNIMO 1 IDENTIFICAÇÃO por animal (mirror `required|array|min:1` real do
// backend, `ProcessingRequest::rules()`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Control, useFieldArray, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

import { ProcessingAnimalIdentificationRow } from './ProcessingAnimalIdentificationRow';

export interface ProcessingAnimalIdentificationsSectionProps {
  control: Control<FinishProcessingForm>;
  setValue: UseFormSetValue<FinishProcessingForm>;
  getValues: UseFormGetValues<FinishProcessingForm>;
  animalIndex: number;
  /** Total de animais do array — PROC-08, propagação Compra-only da 1ª identificação (só relevante quando `animalIndex===0`). */
  animalsCount: number;
  /** FQCN do morph da origem (`App\Models\X`; linhas legadas `App\X`) — mirror `type` de `ProcessingDetail`, normalizado por `isMovementPurchaseOrigin`; habilita a propagação só para Compra. */
  originType?: string;
  disabled: boolean;
  languageGB: LanguageDate;
  /** Erro de nível de ARRAY (`.min(1)`) desta linha — computado pelo pai (`ProcessingAnimalRow`) via `errors.animals?.[animalIndex]?.identifications?.message`. */
  arrayError?: string;
}

export function ProcessingAnimalIdentificationsSection({
  control,
  setValue,
  getValues,
  animalIndex,
  animalsCount,
  originType,
  disabled,
  languageGB,
  arrayError,
}: ProcessingAnimalIdentificationsSectionProps) {
  const identificationText = languageGB.processamentos.processing.form.fields.identification;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `animals.${animalIndex}.identifications`,
  });

  function handleAdd() {
    append({ id_animal_uuid: null, identification: '' });
  }

  return (
    <Box
      bg="bg.subtle"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="md"
      p={3}
      mt={4}
    >
      <Text fontSize="xs" fontWeight="semibold" mb={3}>
        {identificationText.sectionTitle}
      </Text>

      {fields.length === 0 ? (
        <Box py={1}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || identificationText.emptyRows}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={3} mb={3}>
          {fields.map((field, index) => (
            <ProcessingAnimalIdentificationRow
              key={field.id}
              control={control}
              setValue={setValue}
              getValues={getValues}
              animalIndex={animalIndex}
              index={index}
              animalsCount={animalsCount}
              originType={originType}
              onRemove={remove}
              // Mínimo 1 identificação SEMPRE — desabilita "remover" na
              // ÚLTIMA linha restante.
              canRemove={fields.length > 1}
              disabled={disabled}
              languageGB={languageGB}
            />
          ))}
        </Flex>
      )}

      <Button
        title={identificationText.addRow}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}
