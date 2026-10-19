// src/pages/Operacional/Reproducao/Acasalamento/sections/SimplifiedSection.tsx
// -----------------------------------------------------------------------------
// Subcadastro `bm-subform-simplified` (BreedingMating, F-016, 97-Esteiras/001,
// TASK-BM-FE-05, contrato de tela §6.3.3, CLM-004). Renderizado só quando
// `type.value !== 1 && launch_type.value === 2` (Simplificado) — casca
// condicional em `CreateOrUpdateAcasalamento.tsx`, NUNCA `Tabs.*`.
//
// `useFieldArray({control, name:'simplified_animals'})` vive no PAI — mirror
// EXATO `ProtocolSection.tsx`/`ProtocolSeasonItemsFieldArray.tsx`.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { BreedingMatingForm, EntityOptionRef } from '@/@types/v2/BreedingMating';

import { SimplifiedRow } from './SimplifiedRow';
import { SimplifiedTotalizer } from './SimplifiedTotalizer';

import { buildDefaultSimplifiedAnimalRow } from '../acasalamento-form-mapper';

export interface SimplifiedSectionProps {
  control: Control<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  trigger: UseFormTrigger<BreedingMatingForm>;
  fields: FieldArrayWithId<BreedingMatingForm, 'simplified_animals', 'id'>[];
  append: UseFieldArrayAppend<BreedingMatingForm, 'simplified_animals'>;
  remove: UseFieldArrayRemove;
  arrayErrorMessage?: string;
  languageGB: LanguageDate;
  disabled: boolean;
  warehouseOptions: EntityOptionRef[];
  providerOptions: EntityOptionRef[];
}

export function SimplifiedSection({
  control,
  setValue,
  trigger,
  fields,
  append,
  remove,
  arrayErrorMessage,
  languageGB,
  disabled,
  warehouseOptions,
  providerOptions,
}: SimplifiedSectionProps) {
  function handleAdd() {
    append(buildDefaultSimplifiedAnimalRow());
  }

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      {arrayErrorMessage && fields.length > 0 && (
        <Text fontSize="sm" color="fg.error" mb={4}>
          {arrayErrorMessage}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color={arrayErrorMessage ? 'fg.error' : 'fg.muted'}>
            {arrayErrorMessage || languageGB.breedingMatings.breedingMating.form.sections.simplified.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <SimplifiedRow
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              trigger={trigger}
              languageGB={languageGB}
              disabled={disabled}
              warehouseOptions={warehouseOptions}
              providerOptions={providerOptions}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={languageGB.defaltStrings.add}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <SimplifiedTotalizer control={control} languageGB={languageGB} />
    </Box>
  );
}

export default SimplifiedSection;
