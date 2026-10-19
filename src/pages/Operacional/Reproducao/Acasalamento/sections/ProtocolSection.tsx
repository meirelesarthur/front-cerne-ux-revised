// src/pages/Operacional/Reproducao/Acasalamento/sections/ProtocolSection.tsx
// -----------------------------------------------------------------------------
// Subcadastro `bm-subform-protocol` (BreedingMating, F-016, 97-Esteiras/001,
// TASK-BM-FE-05, contrato de tela §6.3.2). Renderizado só quando
// `type.value !== 1 && launch_type.value === 1` (IATF/FIV, modo Normal) —
// casca condicional em `CreateOrUpdateAcasalamento.tsx`, NUNCA `Tabs.*`.
//
// `useFieldArray({control, name:'protocol_animals'})` vive no PAI
// (`CreateOrUpdateAcasalamento.tsx`) — mirror EXATO
// `ProtocolSeasonItemsFieldArray.tsx`/`BatchesFieldArray.tsx`:
// `fields`/`append`/`remove` chegam por prop, este componente só RENDERIZA a
// lista + o totalizador.
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  AnimalOptionRef,
  BreedingMatingForm,
  BreedingMatingTypeValue,
  BreedingProtocolStockItem,
  BreedingSeedStockProduct,
  EntityOptionRef,
} from '@/@types/v2/BreedingMating';

import { ProtocolRow } from './ProtocolRow';
import { ProtocolTotalizer } from './ProtocolTotalizer';

import { buildDefaultProtocolAnimalRow } from '../acasalamento-form-mapper';
import {
  buildProtocolProductOptions,
  buildSeedProductOptions,
} from '../acasalamento-protocol-products';

export interface ProtocolSectionProps {
  control: Control<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  fields: FieldArrayWithId<BreedingMatingForm, 'protocol_animals', 'id'>[];
  append: UseFieldArrayAppend<BreedingMatingForm, 'protocol_animals'>;
  remove: UseFieldArrayRemove;
  arrayErrorMessage?: string;
  languageGB: LanguageDate;
  disabled: boolean;
  breedingMatingType: BreedingMatingTypeValue | undefined;
  eligibleAnimals: AnimalOptionRef[];
  isLoadingAnimals?: boolean;
  bodyScoreOptions: EntityOptionRef[];
  providerOptions: EntityOptionRef[];
  batchOptions: Option<string>[];
  isLoadingBatchOptions?: boolean;
  protocolItems: BreedingProtocolStockItem[];
  seedProducts: BreedingSeedStockProduct[];
  onRequestBatchTransfer: (index: number, animal: Option<string>) => void;
}

export function ProtocolSection({
  control,
  setValue,
  fields,
  append,
  remove,
  arrayErrorMessage,
  languageGB,
  disabled,
  breedingMatingType,
  eligibleAnimals,
  isLoadingAnimals,
  bodyScoreOptions,
  providerOptions,
  batchOptions,
  isLoadingBatchOptions,
  protocolItems,
  seedProducts,
  onRequestBatchTransfer,
}: ProtocolSectionProps) {
  const protocolProductOptions = useMemo(
    () => buildProtocolProductOptions(protocolItems),
    [protocolItems]
  );
  const seedProductOptions = useMemo(() => buildSeedProductOptions(seedProducts), [seedProducts]);

  function handleAdd() {
    const previousRow = fields[fields.length - 1];
    append(buildDefaultProtocolAnimalRow(previousRow, protocolProductOptions));
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
            {arrayErrorMessage ||
              languageGB.breedingMatings.breedingMating.form.sections.protocol.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <ProtocolRow
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              languageGB={languageGB}
              disabled={disabled}
              breedingMatingType={breedingMatingType}
              eligibleAnimals={eligibleAnimals}
              isLoadingAnimals={isLoadingAnimals}
              bodyScoreOptions={bodyScoreOptions}
              providerOptions={providerOptions}
              batchOptions={batchOptions}
              isLoadingBatchOptions={isLoadingBatchOptions}
              protocolProductOptions={protocolProductOptions}
              seedProductOptions={seedProductOptions}
              onRequestBatchTransfer={(animal) => onRequestBatchTransfer(index, animal)}
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

      <ProtocolTotalizer
        control={control}
        languageGB={languageGB}
        protocolItems={protocolItems}
        seedProducts={seedProducts}
      />
    </Box>
  );
}

export default ProtocolSection;
