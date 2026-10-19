// src/pages/Operacional/Reproducao/Acasalamento/sections/NaturalSection.tsx
// -----------------------------------------------------------------------------
// Subcadastro `bm-subform-natural` (BreedingMating, F-016, 97-Esteiras/001,
// TASK-BM-FE-05, contrato de tela §6.3.1, CLM-018). Renderizado SÓ quando
// `type.value === 1` (Natural) — casca condicional em
// `CreateOrUpdateAcasalamento.tsx`, NUNCA `Tabs.*` (ADR-FE-BM-01/GAP-FE-BM-02).
//
// `Animais Lote de Reprodução` (`SelectMulti` = `Select multiple`, contrato B
// já existente no repositório — `src/components/Form/Select.tsx`, ver "Campos
// existentes" do contrato de tela §3) + ações `Marcar todos`/`Desmarcar
// todos`, `Touro` (`Select` simples) e 3 totalizadores read-only
// (`Vacas`/`Touros`/`Matriz-Touros`).
//
// Fonte dos animais elegíveis: `EP-BM-11` (`useBreedingBatchAnimalsCascade`,
// cascata C6 já aberta na TASK-BM-FE-04, `useAcasalamentos.tsx`) — resolvida
// no PAI (`CreateOrUpdateAcasalamento.tsx`) e recebida por prop
// (`eligibleAnimals`); este componente nunca busca dado sozinho.
//
// Validação (mínimo 1 touro E 1 vaca, mensagens literais `Selecione um touro`/
// `Selecione ao menos uma vaca`) já é 100% do schema Yup da Tarefa 02
// (`breeding-mating-schema.ts`) — aqui só exibimos `fieldState.error`.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';

import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalOptionRef, BreedingMatingForm } from '@/@types/v2/BreedingMating';

function mapAnimalOptionRefToOption(ref: AnimalOptionRef): Option<string> {
  return { label: ref.code, value: ref.uuid };
}

// `Matriz/Touros` — vacas ÷ touros, 2 casas decimais, `0` quando não há
// touro (DoD da Tarefa: nunca `NaN`/`Infinity` — o legado já protege esta
// divisão, aqui só reproduzimos o resultado).
function formatRatio(cowsCount: number, bullsCount: number): string {
  if (bullsCount === 0) return (0).toFixed(2);
  return (cowsCount / bullsCount).toFixed(2);
}

export interface NaturalSectionProps {
  control: Control<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  eligibleAnimals: AnimalOptionRef[];
  isLoadingAnimals?: boolean;
  disabled: boolean;
  languageGB: LanguageDate;
}

export function NaturalSection({
  control,
  setValue,
  eligibleAnimals,
  isLoadingAnimals = false,
  disabled,
  languageGB,
}: NaturalSectionProps) {
  const text = languageGB.breedingMatings.breedingMating.form.sections.natural;

  const animalOptions = eligibleAnimals.map(mapAnimalOptionRefToOption);

  const cows = useWatch({ control, name: 'natural.cows' }) ?? [];
  const bull = useWatch({ control, name: 'natural.bull' });
  const bullsCount = bull ? 1 : 0;

  function handleMarkAll() {
    setValue('natural.cows', animalOptions, { shouldDirty: true, shouldValidate: true });
  }

  function handleUnmarkAll() {
    setValue('natural.cows', [], { shouldDirty: true, shouldValidate: true });
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
      <Controller
        name="natural.cows"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box mb={4}>
            <Select
              name={field.name}
              label={text.animalsBreedingBatch}
              options={animalOptions}
              value={field.value ?? []}
              multiple
              // Nunca `null` — regra 2 da Tarefa (sempre inicializado com
              // `[]`, mesmo quando esvaziado pelo usuário).
              onChange={(options: Option<string>[] | null) => field.onChange(options ?? [])}
              error={error?.message}
              loading={isLoadingAnimals}
              isDisabled={disabled}
            />
            <Flex gap={2} mt={2}>
              <Button
                type="button"
                title={text.markAllButton}
                variant="outline"
                size="sm"
                onClick={handleMarkAll}
                disabled={disabled || animalOptions.length === 0}
              />
              <Button
                type="button"
                title={text.unmarkAllButton}
                variant="outline"
                size="sm"
                onClick={handleUnmarkAll}
                disabled={disabled || cows.length === 0}
              />
            </Flex>
          </Box>
        )}
      />

      <SimpleGrid columns={columnsForm.default} gap={6} mb={4}>
        <Controller
          name="natural.bull"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.bull}
              options={animalOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              loading={isLoadingAnimals}
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
        <InputReadOnly name="natural-cows-total" label={text.cows} value={String(cows.length)} />
        <InputReadOnly name="natural-bulls-total" label={text.bulls} value={String(bullsCount)} />
        <InputReadOnly
          name="natural-ratio"
          label={text.ratio}
          value={formatRatio(cows.length, bullsCount)}
        />
      </SimpleGrid>
    </Box>
  );
}

export default NaturalSection;
