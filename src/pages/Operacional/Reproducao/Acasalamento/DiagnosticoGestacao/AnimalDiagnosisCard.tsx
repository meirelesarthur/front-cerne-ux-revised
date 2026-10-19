// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/AnimalDiagnosisCard.tsx
// -----------------------------------------------------------------------------
// Card `pd-subform-animal-card` (PregnancyDiagnosis, F-016, 97-Esteiras/001,
// TASK-BM-FE-08, contrato de tela §6.6, regras 7/8/9/10). 9 campos na ordem
// do legado (`_card-animal.blade.php`) + botão de remover. `useFieldArray`
// vive no PAI (`CreateDiagnosticoGestacao.tsx`, mirror `ProtocolRow.tsx`) —
// este componente só RENDERIZA a linha e aplica as 5 cascatas POR CARD.
//
// ⛔ Nenhuma cascata aqui compara `diagnosis.value`/`id` com um literal
// numérico fixo, nem decide a semântica de gestação por um rótulo de texto
// hardcoded — ela vem SEMPRE de `cascadeRules` (`EP-PD-02.cascade_rules`,
// GAP-BM-01). Reintroduzir esse literal recriaria a lacuna do contrato legado.
//
// As 5 cascatas (contrato de tela §6.6):
//   1. `DG` muda → prenhe habilita+calcula `Tempo de Gestação`; não-prenhe
//      bloqueia (limpa+desabilita) gestação e touro; não-prenhe+elegível
//      habilita `Ressincronização` (senão ela é desabilitada e forçada a
//      `false`).
//   2. `Ressincronização = Sim` → limpa e trava `Transferir Lote` e o botão `+`.
//   3. `Tempo de Gestação` alterado À MÃO (evento do próprio input, nunca a
//      pré-carga automática da cascata 1/4) → habilita e exige `Touro`.
//   4. `Data` do cabeçalho muda → recalcula `Tempo de Gestação` de todo card
//      prenhe e REDESABILITA `Touro` (novo cálculo, novo consentimento).
//   5. Remover card → tratado no PAI (`DeleteConfirmDialog`, "Tem certeza?");
//      o animal "volta" ao `SelectMulti` do lote por construção (o PAI
//      deriva `availableAnimals` dos animais IN USE nos cards atuais — ver
//      `CreateDiagnosticoGestacao.tsx`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { resyncOptions } from '@/constants/breedingMating/options/resync-options';
import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { EntityOptionRef } from '@/@types/v2/BreedingMating';
import type {
  PregnancyDiagnosisCascadeRules,
  PregnancyDiagnosisForm,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

import {
  calculateGestationDays,
  mapEntityOptionRefToOption,
} from './diagnostico-gestacao-form-mapper';

export interface AnimalDiagnosisCardProps {
  index: number;
  control: Control<PregnancyDiagnosisForm>;
  setValue: UseFormSetValue<PregnancyDiagnosisForm>;
  languageGB: LanguageDate;
  disabled: boolean;
  headerDate: string;
  lastProtocolDate: string | null;
  cascadeRules: PregnancyDiagnosisCascadeRules;
  /** `batch_fill_enabled.resync` — governa a EXISTÊNCIA da `Ressincronização`
   *  no DOM (regra 9 da Tarefa), não só o `disabled`. */
  resyncFieldVisible: boolean;
  /** Oculta `Ressincronização` e `Transferir Lote` no modo acompanhamento
   *  (regra 10 da Tarefa, `_card-animal.blade.php:16-25`). */
  followUp: boolean;
  inseminatorOptions: EntityOptionRef[];
  techniqueOptions: EntityOptionRef[];
  diagnosisOptions: EntityOptionRef[];
  batchOptions: EntityOptionRef[];
  bullOptions: EntityOptionRef[];
  onRequestBatchTransfer: (animal: Option<string>) => void;
  onRemove: () => void;
}

export function AnimalDiagnosisCard({
  index,
  control,
  setValue,
  languageGB,
  disabled,
  headerDate,
  lastProtocolDate,
  cascadeRules,
  resyncFieldVisible,
  followUp,
  inseminatorOptions,
  techniqueOptions,
  diagnosisOptions,
  batchOptions,
  bullOptions,
  onRequestBatchTransfer,
  onRemove,
}: AnimalDiagnosisCardProps) {
  const text = languageGB.breedingMatings.pregnancyDiagnosis.form.animalCard;

  const inseminatorSelectOptions = inseminatorOptions.map(mapEntityOptionRefToOption);
  const techniqueSelectOptions = techniqueOptions.map(mapEntityOptionRefToOption);
  const diagnosisSelectOptions = diagnosisOptions.map(mapEntityOptionRefToOption);
  const batchSelectOptions = batchOptions.map(mapEntityOptionRefToOption);
  const bullSelectOptions = bullOptions.map(mapEntityOptionRefToOption);

  const rowAnimal = useWatch({ control, name: `animals.${index}.animal` });
  const diagnosis = useWatch({ control, name: `animals.${index}.diagnosis` });
  const resync = useWatch({ control, name: `animals.${index}.resync` }) ?? false;

  const isPregnant =
    !!diagnosis && cascadeRules.pregnant_diagnosis_pregnancy_uuids.includes(diagnosis.value);
  const isResyncEligible =
    !!diagnosis && cascadeRules.resync_eligible_diagnosis_pregnancy_uuids.includes(diagnosis.value);

  // Cascata 3 — `Touro` só habilita quando o PRÓPRIO usuário edita `Tempo de
  // Gestação` (nunca pela pré-carga automática das cascatas 1/4).
  const [bullUnlocked, setBullUnlocked] = useState(false);

  // Cascata 1 — `DG` muda (dispara também na montagem: cobre o card nascido
  // do `Preenchimento em Lote` já com um `DG` preenchido).
  useEffect(() => {
    if (isPregnant) {
      setValue(
        `animals.${index}.gestation_days`,
        calculateGestationDays(headerDate, lastProtocolDate),
        { shouldDirty: true }
      );
    } else {
      setValue(`animals.${index}.gestation_days`, null, { shouldDirty: true });
      setValue(`animals.${index}.bull`, null, { shouldDirty: true });
      setBullUnlocked(false);
    }

    if (!isResyncEligible) {
      setValue(`animals.${index}.resync`, false, { shouldDirty: true });
    }
    // eslint-disable-next-line
  }, [diagnosis?.value]);

  // Cascata 4 — `Data` do cabeçalho muda: recalcula gestação de todo card
  // PRENHE e redesabilita `Touro` (novo cálculo, novo consentimento).
  useEffect(() => {
    if (isPregnant) {
      setValue(
        `animals.${index}.gestation_days`,
        calculateGestationDays(headerDate, lastProtocolDate),
        { shouldDirty: true }
      );
      setValue(`animals.${index}.bull`, null, { shouldDirty: true });
      setBullUnlocked(false);
    }
    // eslint-disable-next-line
  }, [headerDate]);

  // Cascata 2 — `Ressincronização = Sim` limpa e trava `Transferir Lote`.
  function handleResyncChange(option: Option<boolean> | null) {
    const nextResync = option?.value ?? false;
    setValue(`animals.${index}.resync`, nextResync, { shouldDirty: true });
    if (nextResync) {
      setValue(`animals.${index}.batch`, null, { shouldDirty: true });
    }
  }

  // Cascata 3 — edição manual do próprio campo habilita/exige `Touro`.
  function handleGestationDaysManualChange(value: number | null) {
    setValue(`animals.${index}.gestation_days`, value, { shouldDirty: true });
    setBullUnlocked(true);
  }

  const showResyncField = resyncFieldVisible && !followUp;
  const showBatchTransferField = !followUp;

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <InputReadOnly
          name={`animals.${index}.animal`}
          label={text.animal}
          value={rowAnimal?.label ?? ''}
        />

        <Controller
          name={`animals.${index}.inseminator`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.inseminator}
              options={inseminatorSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              isDisabled={disabled}
              isRequired
            />
          )}
        />

        <Controller
          name={`animals.${index}.technique`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.technique}
              options={techniqueSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              isDisabled={disabled}
              isRequired
            />
          )}
        />

        <Controller
          name={`animals.${index}.diagnosis`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.diagnosis}
              options={diagnosisSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              isDisabled={disabled}
              isRequired
            />
          )}
        />

        {showResyncField && (
          <Controller
            name={`animals.${index}.resync`}
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.resync}
                options={resyncOptions.options(languageGB)}
                value={resyncOptions.getOption(field.value ?? false, languageGB)}
                onChange={handleResyncChange}
                noClearable
                isDisabled={disabled || !isResyncEligible}
                isRequired={isResyncEligible}
              />
            )}
          />
        )}

        {showBatchTransferField && (
          <Flex gap={2} align="flex-end">
            <Box flex="1">
              <Controller
                name={`animals.${index}.batch`}
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
            </Box>
            <IconButtonTable
              aria-label={text.addBatchTransferButton}
              mensegerTooltip={text.addBatchTransferButton}
              size="sm"
              variant="outline"
              disabled={disabled || resync || !rowAnimal}
              onClick={() => rowAnimal && onRequestBatchTransfer(rowAnimal)}
            >
              <Icon as={FiPlus as ElementType} />
            </IconButtonTable>
          </Flex>
        )}

        <Controller
          name={`animals.${index}.observation`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Textarea
              name={field.name}
              label={text.observation}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value || null)}
              maxLength={190}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`animals.${index}.gestation_days`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              name={field.name}
              label={text.gestationDays}
              allowDot={false}
              decimalPlaces={0}
              min={0}
              value={field.value}
              onValueChange={handleGestationDaysManualChange}
              error={error?.message}
              isRequired={isPregnant}
              disabled={disabled || !isPregnant}
            />
          )}
        />

        {/* `Touro` — inicia desabilitado; só habilita quando o usuário edita
            `Tempo de Gestação` À MÃO (regra 7/8 da Tarefa). */}
        <Controller
          name={`animals.${index}.bull`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.bull}
              options={bullSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              isDisabled={disabled || !bullUnlocked}
              isRequired={bullUnlocked}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeRowButton}
          mensegerTooltip={text.removeRowButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2 as ElementType} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export default AnimalDiagnosisCard;
