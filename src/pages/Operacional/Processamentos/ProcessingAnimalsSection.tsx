// src/pages/Operacional/Processamentos/ProcessingAnimalsSection.tsx
// -----------------------------------------------------------------------------
// Repeater `animals[]` da tela de FINALIZAÇÃO — WIZARD 1-animal-por-vez
// (DEC-139, decisão do dono, SUBSTITUI o repeater plano da fatia original/
// UX-A do plano §3.5). `useFieldArray` continua no PAI DA TELA
// (`FinishProcessing.tsx`) — o wizard é SÓ composição de navegação por cima
// do MESMO contrato de dados (payload ao `finish` idêntico).
//
// Sem precedente de wizard-por-item repetido no `cerne`/`frontend_root` (só
// existe `Stepper` para N SEÇÕES FIXAS de um mesmo form) — casca montada a
// partir de primitivos (`Flex`/`Text`/`Button`), não uma adaptação forçada
// do `Stepper` existente (decisão registrada, não bloqueia).
//
// Navegação Próximo/Voltar (mirror do card-por-vez do legado
// `_card_animal.blade.php`) + contador "Animal N de M" — SEM validação de
// campo por passo (não é regra de dados nova, só navegação/apresentação; a
// validação Yup continua rodando no submit final, escopo inalterado).
//
// "Remover" remove a etapa ATUAL (`currentStep`), ajustando o índice ativo
// para permanecer dentro dos limites. Mínimo 1 animal SEMPRE preservado.
//
// REWORK (039, PROCFID-01 §3.6) — "Adicionar Animal" REMOVIDO: o conjunto de
// animais é 100% populado pelo `prepare` (nunca por entrada manual), mirror
// exato do legado (`_card_animal.blade.php` não tem esse botão).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

import { ProcessingAnimalRow } from './ProcessingAnimalRow';

export interface ProcessingAnimalsSectionProps {
  control: Control<FinishProcessingForm>;
  setValue: UseFormSetValue<FinishProcessingForm>;
  getValues: UseFormGetValues<FinishProcessingForm>;
  errors: FieldErrors<FinishProcessingForm>;
  fields: FieldArrayWithId<FinishProcessingForm, 'animals', 'id'>[];
  remove: UseFieldArrayRemove;
  disabled: boolean;
  languageGB: LanguageDate;
  /** PROC-04 — `category_locked` por índice (badge informativo), hidratado pelo `prepare`. */
  categoryLockedByIndex: boolean[];
  /** PROCFID-02 (§3.5) — "Último Peso" por índice, somente leitura, hidratado pelo `prepare`. */
  lastWeighingByIndex: { weight: number | null; date: string | null }[];
  /** PROC-08 — FQCN do morph da origem (`App\Models\X`; linhas legadas `App\X`), mirror `type` de `ProcessingDetail`, normalizado por `isMovementPurchaseOrigin`; habilita a propagação de identificação Compra-only. */
  originType?: string;
}

export function ProcessingAnimalsSection({
  control,
  setValue,
  getValues,
  errors,
  fields,
  remove,
  disabled,
  languageGB,
  categoryLockedByIndex,
  lastWeighingByIndex,
  originType,
}: ProcessingAnimalsSectionProps) {
  const animalText = languageGB.processamentos.processing.form.fields.animal;
  const arrayError = (errors as any)?.animals?.message as string | undefined;

  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = fields.length;

  // Ajusta o passo ativo se a etapa atual deixou de existir (remoção) —
  // NUNCA reseta ao hidratar via `prepare`/rascunho (0 continua um índice
  // válido sempre que `fields.length >= 1`).
  useEffect(() => {
    if (currentStep > totalSteps - 1) {
      setCurrentStep(Math.max(totalSteps - 1, 0));
    }
  }, [totalSteps, currentStep]);

  function handleRemoveCurrent(index: number) {
    remove(index);
  }

  function handlePrevious() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleNext() {
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontWeight="semibold">{animalText.sectionTitle}</Text>

        {totalSteps > 0 && (
          <Flex align="center" gap={3}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={FiChevronLeft as ElementType}
              title={languageGB.defaltStrings.previous}
              onClick={handlePrevious}
              disabled={disabled || currentStep === 0}
            />
            <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
              {animalText.wizardStepTemplate
                .replace('{current}', String(currentStep + 1))
                .replace('{total}', String(totalSteps))}
            </Text>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={FiChevronRight as ElementType}
              title={languageGB.defaltStrings.next}
              onClick={handleNext}
              disabled={disabled || currentStep >= totalSteps - 1}
            />
          </Flex>
        )}
      </Flex>

      {totalSteps === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || animalText.emptyAnimals}
          </Text>
        </Box>
      ) : (
        <Box mb={4}>
          {arrayError && (
            <Text fontSize="sm" color="fg.error" mb={3}>
              {arrayError}
            </Text>
          )}
          <ProcessingAnimalRow
            key={fields[currentStep]?.id}
            control={control}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            index={currentStep}
            fieldsLength={totalSteps}
            onRemove={handleRemoveCurrent}
            // Mínimo 1 animal SEMPRE (mirror `MovementSaleItemsSection:80-89`).
            canRemove={totalSteps > 1}
            disabled={disabled}
            languageGB={languageGB}
            categoryLocked={categoryLockedByIndex[currentStep] ?? false}
            lastWeighing={lastWeighingByIndex[currentStep]}
            originType={originType}
          />
        </Box>
      )}
    </Box>
  );
}
