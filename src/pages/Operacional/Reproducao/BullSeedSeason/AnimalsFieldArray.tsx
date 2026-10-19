// src/pages/Operacional/Reproducao/BullSeedSeason/AnimalsFieldArray.tsx
// -----------------------------------------------------------------------------
// Repetidor "Animais" do formulário de Touros/Sêmen/Embrião (Tarefa 25,
// contrato de tela §5.3) — sem combobox multi-valor no fork
// (`isMulti`/`MultiSelect` não existem em `src/`, busca negativa confirmada
// pelo Arquiteto), o vínculo é um REPETIDOR `useFieldArray`: cada linha = 1
// `Select`+`useQuery` sobre `animal-options`. Mirror ESTRUTURAL de
// `RequisitionItemsEditor.tsx` (`useFieldArray` vive no formulário PAI —
// `fields`/`append`/`remove` chegam via props), simplificado (1 campo por
// linha, sem cascata).
//
// `animalOptions` é UMA ÚNICA chamada compartilhada por TODAS as linhas
// (contrato §5.2) — resolvida no formulário PAI (`useQuery` sobre
// `animal-options`) e passada por prop, nunca refeita por linha.
//
// Sem `.min(1)` no schema (`GAP-BSS-06`) e sem guard de duplicidade
// OBRIGATÓRIO (contrato §5.3 — decisão de UX do Executor, sem regra de
// negócio a violar se permitir duplicata, a API também não valida).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  BullSeedSeasonAnimalFieldValue,
  BullSeedSeasonForm,
} from '@/@types/v2/BullSeedSeason';

export interface AnimalsFieldValues {
  animals: BullSeedSeasonAnimalFieldValue[];
}

export interface AnimalsFieldArrayProps {
  /** `control` do `useForm` do formulário PAI (`BullSeedSeasonForm`). */
  control: Control<BullSeedSeasonForm>;
  /** `fields` do `useFieldArray({ control, name: 'animals' })` do PAI. */
  fields: FieldArrayWithId<AnimalsFieldValues, 'animals', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<AnimalsFieldValues, 'animals'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** Opções de `animal-options` — 1 única chamada compartilhada (resolvida no PAI). */
  animalOptions: Option<string>[];
  animalOptionsLoading: boolean;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function AnimalsFieldArray({
  control,
  fields,
  append,
  remove,
  animalOptions,
  animalOptionsLoading,
  languageGB,
  disabled = false,
}: AnimalsFieldArrayProps) {
  const text = languageGB.bullSeedSeason.bullSeedSeason.form.animals;

  const genericControl = control as unknown as Control<AnimalsFieldValues>;

  function handleAdd() {
    append({ animal: null });
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
        <Flex direction="column" gap={3} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start">
              <Box flex="1" minW="220px">
                <Controller
                  name={`animals.${index}.animal`}
                  control={genericControl}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      name={name}
                      label={text.animalLabel}
                      options={animalOptions}
                      value={value ?? null}
                      onChange={(option: Option<string> | null) => onChange(option ?? null)}
                      error={error?.message}
                      loading={animalOptionsLoading}
                      isRequired
                      isDisabled={disabled}
                    />
                  )}
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

export default AnimalsFieldArray;
