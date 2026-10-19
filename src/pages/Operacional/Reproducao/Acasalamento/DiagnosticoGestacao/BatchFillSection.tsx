// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/BatchFillSection.tsx
// -----------------------------------------------------------------------------
// Subcadastro `pd-subform-batch-fill` — "Preenchimento em Lote"
// (PregnancyDiagnosis, F-016, 97-Esteiras/001, TASK-BM-FE-08, contrato de
// tela §6.6, regra 6). `useForm` PRÓPRIO (`PregnancyDiagnosisBatchFillFormValue`)
// — este subcadastro NUNCA é submetido ao servidor; `Aplicar` é 100%
// CLIENT-SIDE (regra 2 da Tarefa).
//
// `Aplicar`: exige ≥1 animal + inseminador + técnica + DG (senão avisa via
// toast e aborta, regra 6); cria um `AnimalDiagnosisCard` por animal
// selecionado com os MESMOS valores (`buildAnimalCardFromBatchFill`, mapper)
// e **limpa o bloco** (`reset`). O pai (`CreateDiagnosticoGestacao.tsx`)
// decide o `append()` no `useFieldArray` — este componente só devolve os
// valores por `onApply`.
//
// `availableAnimals` já chega FILTRADO do pai (exclui animais que já
// viraram card, regra 6 — "Animais que viraram card ficam indisponíveis no
// SelectMulti") — este componente nunca calcula essa exclusão sozinho.
//
// `Ressincronização` só existe no DOM quando `resyncFieldVisible` é `true`
// (`batch_fill_enabled.resync`, regra 9 da Tarefa/K5 do manifesto FID-G3F) —
// renderização CONDICIONAL, nunca `disabled`.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { resyncOptions } from '@/constants/breedingMating/options/resync-options';
import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalOptionRef, EntityOptionRef } from '@/@types/v2/BreedingMating';
import type { PregnancyDiagnosisBatchFillFormValue } from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

import {
  buildDefaultBatchFillFormValues,
  mapAnimalOptionRefToOption,
  mapEntityOptionRefToOption,
} from './diagnostico-gestacao-form-mapper';

export interface BatchFillSectionProps {
  availableAnimals: AnimalOptionRef[];
  isLoadingAnimals?: boolean;
  providerOptions: EntityOptionRef[];
  techniqueOptions: EntityOptionRef[];
  diagnosisOptions: EntityOptionRef[];
  batchOptions: EntityOptionRef[];
  resyncFieldVisible: boolean;
  disabled: boolean;
  languageGB: LanguageDate;
  onApply: (values: PregnancyDiagnosisBatchFillFormValue) => void;
}

export function BatchFillSection({
  availableAnimals,
  isLoadingAnimals = false,
  providerOptions,
  techniqueOptions,
  diagnosisOptions,
  batchOptions,
  resyncFieldVisible,
  disabled,
  languageGB,
  onApply,
}: BatchFillSectionProps) {
  const text = languageGB.breedingMatings.pregnancyDiagnosis.form.batchFillSection;

  const { control, getValues, reset, setValue } = useForm<PregnancyDiagnosisBatchFillFormValue>({
    mode: 'onChange',
    defaultValues: buildDefaultBatchFillFormValues(),
  });

  // Contrato de tela §8/item 6 — `Ressincronização` e `Transferir Lote`
  // continuam mutuamente exclusivos também no bloco de lote (mesmo
  // princípio da cascata 2 de `AnimalDiagnosisCard.tsx`).
  const resync = useWatch({ control, name: 'resync' }) ?? false;

  const animalOptions = availableAnimals.map(mapAnimalOptionRefToOption);
  const inseminatorSelectOptions = providerOptions.map(mapEntityOptionRefToOption);
  const techniqueSelectOptions = techniqueOptions.map(mapEntityOptionRefToOption);
  const diagnosisSelectOptions = diagnosisOptions.map(mapEntityOptionRefToOption);
  const batchSelectOptions = batchOptions.map(mapEntityOptionRefToOption);

  function handleResyncChange(option: Option<boolean> | null) {
    const nextResync = option?.value ?? false;
    setValue('resync', nextResync, { shouldDirty: true });
    if (nextResync) {
      setValue('batch', null, { shouldDirty: true });
    }
  }

  function handleApply() {
    const values = getValues();

    if (
      values.animals.length === 0 ||
      !values.inseminator ||
      !values.technique ||
      !values.diagnosis
    ) {
      toaster.error({
        title: text.title,
        description: text.applyValidationError,
        duration: 6000,
      });
      return;
    }

    onApply(values);
    reset(buildDefaultBatchFillFormValues());
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
      <Box mb={4} fontWeight="semibold" color="fg.default">
        {text.title}
      </Box>

      <Box mb={4}>
        <Controller
          name="animals"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.animals}
              options={animalOptions}
              value={field.value ?? []}
              multiple
              onChange={(options: Option<string>[] | null) => field.onChange(options ?? [])}
              loading={isLoadingAnimals}
              isDisabled={disabled}
            />
          )}
        />
      </Box>

      <SimpleGrid columns={columnsForm.default} gap={4} mb={4}>
        <Controller
          name="inseminator"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.inseminator}
              options={inseminatorSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="technique"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.technique}
              options={techniqueSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="diagnosis"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.diagnosis}
              options={diagnosisSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        {/* `Ressincronização` — condicional, NUNCA `disabled` (regra 9 da
            Tarefa/K5 do manifesto FID-G3F). */}
        {resyncFieldVisible && (
          <Controller
            name="resync"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.resync}
                options={resyncOptions.options(languageGB)}
                value={resyncOptions.getOption(field.value ?? false, languageGB)}
                onChange={handleResyncChange}
                noClearable
                isDisabled={disabled}
              />
            )}
          />
        )}

        <Controller
          name="batch"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.batchTransfer}
              options={batchSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled || resync}
            />
          )}
        />
      </SimpleGrid>

      <Box mb={4}>
        <Controller
          name="observation"
          control={control}
          render={({ field }) => (
            <Textarea
              name={field.name}
              label={text.observations}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value || null)}
              maxLength={190}
              disabled={disabled}
            />
          )}
        />
      </Box>

      <Flex justify="flex-end">
        <Button
          type="button"
          title={text.applyButton}
          variant="outline"
          onClick={handleApply}
          disabled={disabled}
        />
      </Flex>
    </Box>
  );
}

export default BatchFillSection;
