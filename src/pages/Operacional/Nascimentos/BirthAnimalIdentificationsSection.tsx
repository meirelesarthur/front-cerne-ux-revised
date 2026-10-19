// src/pages/Operacional/Nascimentos/BirthAnimalIdentificationsSection.tsx
// -----------------------------------------------------------------------------
// Bloco de identificação dinâmica (`useFieldArray`) do formulário de
// Nascimentos (TASK-NASC-FE-02, frontend-contract-nascimentos.md §7.2).
// `useFieldArray` fica no componente PAI (`CreateOrUpdateBirthAnimal.tsx`) —
// mirror `IdentificationsSection` de `CadastrosBase/Rebanho/
// CreateOrUpdateAnimal.tsx:1714-1779`.
//
// MÍNIMO 1 LINHA SEMPRE (diferente de Animal, onde a seção é OCULTA quando
// `type === 'Sem Identificação'`) — `BirthAnimalRequest::rules()` real:
// `id_animals` é `required|array|min:1` INCONDICIONAL, não existe um "tipo
// de nascimento sem identificação" que dispense a tabela (contrato §7.2).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormSetValue,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { BirthAnimalForm } from '@/@types/v2/BirthAnimals';

import { BirthAnimalIdentificationRow } from './BirthAnimalIdentificationRow';

export interface BirthAnimalIdentificationsSectionProps {
  fields: FieldArrayWithId<BirthAnimalForm, 'identifications', 'id'>[];
  control: Control<BirthAnimalForm>;
  errors: FieldErrors<BirthAnimalForm>;
  setValue: UseFormSetValue<BirthAnimalForm>;
  onAdd: () => void;
  onRemove: UseFieldArrayRemove;
  canSave: boolean;
  isLoading: boolean;
  text: LanguageDate['birthAnimals']['birthAnimal']['form'];
  isEditing: boolean;
  excludeUuid?: string;
}

export function BirthAnimalIdentificationsSection({
  fields,
  control,
  errors,
  setValue,
  onAdd,
  onRemove,
  canSave,
  isLoading,
  text,
  isEditing,
  excludeUuid,
}: BirthAnimalIdentificationsSectionProps) {
  const identificationsText = text.identifications;
  const isDisabled = !canSave || isLoading;
  // Erro de nível de ARRAY (`.min(1)` — obrigatório sempre, contrato §7.2) —
  // `errors.identifications` é `Merge<FieldError, ...[]>` no react-hook-form:
  // tem `.message` próprio E é indexável por linha.
  const arrayError = errors.identifications?.message;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {identificationsText.sectionTitle}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={0.5}>
          {identificationsText.sectionHint}
        </Text>
      </Box>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || identificationsText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <BirthAnimalIdentificationRow
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              isDisabled={isDisabled}
              onRemove={onRemove}
              // Mínimo 1 linha SEMPRE (contrato §7.2, checklist item 6) —
              // desabilita o botão de remover na ÚLTIMA linha restante.
              canRemove={fields.length > 1}
              text={text}
              isEditing={isEditing}
              excludeUuid={excludeUuid}
            />
          ))}
        </Flex>
      )}

      <Button
        title={identificationsText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        onClick={onAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
