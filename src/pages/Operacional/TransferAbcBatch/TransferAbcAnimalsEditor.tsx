// src/pages/Operacional/TransferAbcBatch/TransferAbcAnimalsEditor.tsx
// -----------------------------------------------------------------------------
// Repeater de animais da tela de CRIAÇÃO de Transferência ABC de Animais
// entre Lotes (TransferAbcBatch — 97-Esteiras/039, TASK-FE-039-ABC-03).
// Consumido por `CreateTransferAbcBatch.tsx` (campo `animals` de
// `TransferAbcBatchForm`; `useFieldArray` vive no PAI, mesmo racional já
// aplicado em `FarmTransferItemsEditor.tsx`).
//
// Fonte dos animais do lote origem: `listBatchCandidateAnimais`
// (`GET /animal-batches/candidate-animals?batch_uuid=`, `batch_view`) — o
// lookup dedicado de `TransferAbcBatch` (`/animals/options`) NÃO filtra por
// lote e NÃO expõe peso (`AnimalOptionResource` só tem `{uuid,label}`);
// `candidate-animals` é o único endpoint real que devolve `weight` por
// animal já vinculado a um lote específico (achado confirmado por leitura
// direta da API, FD2). Coleção JÁ CARREGADA (sem paginação) — por isso
// `SelectCombobox` (busca client-side), NUNCA `SelectAsyncPaginate` (mesmo
// racional já aplicado a `destination_farm_id` em `CreateFarmTransfer.tsx`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  TransferAbcAnimalForm,
  TransferAbcBatchForm,
} from '@/@types/v2/Livestock/transferAbcBatch';

export interface TransferAbcAnimalsFieldValues {
  animals: TransferAbcAnimalForm[];
}

export interface TransferAbcAnimalsEditorProps {
  control: Control<TransferAbcBatchForm>;
  fields: FieldArrayWithId<TransferAbcAnimalsFieldValues, 'animals', 'id'>[];
  append: UseFieldArrayAppend<TransferAbcAnimalsFieldValues, 'animals'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<TransferAbcBatchForm>;
  languageGB: LanguageDate;
  /** Opções (todas já carregadas) dos animais do lote origem. */
  animalOptions: Option<string>[];
  /** Peso anterior (`weight`) por `animal_uuid` — hidrata `last_weight` (readonly) ao selecionar. */
  weightByAnimalUuid: Record<string, number>;
  originBatchUuid: string | null;
  disabled?: boolean;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface TransferAbcAnimalRowProps {
  control: Control<TransferAbcAnimalsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  animalOptions: Option<string>[];
  weightByAnimalUuid: Record<string, number>;
  otherRowsAnimalUuids: string[];
}

function TransferAbcAnimalRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  animalOptions,
  weightByAnimalUuid,
  otherRowsAnimalUuids,
}: TransferAbcAnimalRowProps) {
  const text = languageGB.livestock.transferAbcBatch;
  const animalText = text.form.fields.animal;

  const { field: animalField, fieldState: animalFieldState } = useController({
    control,
    name: `animals.${index}.animal_uuid`,
  });
  const { field: lastWeightField } = useController({
    control,
    name: `animals.${index}.last_weight`,
  });
  const { field: actualWeightField, fieldState: actualWeightFieldState } = useController({
    control,
    name: `animals.${index}.actual_weight`,
  });
  const { field: valueField, fieldState: valueFieldState } = useController({
    control,
    name: `animals.${index}.value`,
  });
  const { field: totalValueField } = useController({
    control,
    name: `animals.${index}.total_value`,
  });

  const actualWeight = Number(actualWeightField.value) || 0;
  const value = Number(valueField.value) || 0;
  const roundedTotal = roundTo2(actualWeight * value);

  useEffect(() => {
    if (Number(totalValueField.value) !== roundedTotal) {
      totalValueField.onChange(roundedTotal);
    }
  }, [roundedTotal]);

  function handleAnimalChange(option: Option<string> | null) {
    if (option && otherRowsAnimalUuids.includes(option.value)) {
      toaster.error({
        title: text.singularLabel,
        description: animalText.duplicateAnimal,
      });
      return;
    }

    animalField.onChange(option ?? null);
    lastWeightField.onChange(option ? (weightByAnimalUuid[option.value] ?? 0) : null);
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="2" minW="220px">
        <SelectCombobox
          name={animalField.name}
          label={animalText.animal}
          options={animalOptions}
          value={animalField.value ?? null}
          onChange={handleAnimalChange}
          error={animalFieldState.error?.message}
          isRequired
          disabled={disabled}
        />
      </Box>

      <Box w={{ base: 'full', sm: '130px' }}>
        <InputReadOnly
          name={lastWeightField.name}
          label={animalText.lastWeight}
          value={formatNumber(Number(lastWeightField.value) || 0)}
        />
      </Box>

      <Box w={{ base: 'full', sm: '140px' }}>
        <NumberInput
          name={actualWeightField.name}
          label={animalText.actualWeight}
          allowDot
          decimalPlaces={2}
          min={0}
          value={actualWeightField.value ?? null}
          onValueChange={(nextValue) => actualWeightField.onChange(nextValue)}
          disabled={disabled || !animalField.value}
          error={actualWeightFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '150px' }}>
        <MoneyInput
          name={valueField.name}
          label={animalText.value}
          value={valueField.value ?? null}
          onValueChange={(nextValue) => valueField.onChange(nextValue)}
          error={valueFieldState.error?.message}
          disabled={disabled || !animalField.value}
        />
      </Box>

      <Box w={{ base: 'full', sm: '150px' }}>
        <InputReadOnly
          name={totalValueField.name}
          label={animalText.totalValue}
          value={formatCurrencyBRL(roundedTotal)}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {animalText.removeAnimal}
        </Flex>
        <IconButtonTable
          type="button"
          aria-label={animalText.removeAnimal}
          mensegerTooltip={animalText.removeAnimal}
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
  );
}

export function TransferAbcAnimalsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  animalOptions,
  weightByAnimalUuid,
  originBatchUuid,
  disabled = false,
}: TransferAbcAnimalsEditorProps) {
  const text = languageGB.livestock.transferAbcBatch;
  const animalText = text.form.fields.animal;

  const genericControl = control as unknown as Control<TransferAbcAnimalsFieldValues>;
  const arrayError = (errors as any)?.animals?.message as string | undefined;

  const watchedAnimals = useWatch({ control: genericControl, name: 'animals' }) ?? [];
  const grandTotal = watchedAnimals.reduce((sum, row) => sum + (Number(row?.total_value) || 0), 0);
  const roundedGrandTotal = roundTo2(grandTotal);

  function handleAdd() {
    append({
      animal_uuid: null,
      last_weight: null,
      actual_weight: null,
      value: null,
      total_value: 0,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {animalText.sectionTitle}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {animalText.footerTotalLabel}:
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {formatCurrencyBRL(roundedGrandTotal)}
          </Text>
        </Flex>
      </Flex>

      {!originBatchUuid ? (
        <Text fontSize="sm" color="fg.muted">
          {animalText.emptyAnimals}
        </Text>
      ) : (
        <>
          {arrayError && fields.length > 0 && (
            <Box mb={4}>
              <Text fontSize="sm" color="fg.error">
                {arrayError}
              </Text>
            </Box>
          )}

          {fields.length === 0 ? (
            <Box py={2}>
              <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
                {arrayError || animalText.sectionTitle}
              </Text>
            </Box>
          ) : (
            <Flex direction="column" gap={4} mb={4}>
              {fields.map((field, index) => {
                const otherRowsAnimalUuids = watchedAnimals
                  .filter((_, otherIndex) => otherIndex !== index)
                  .map((row) => row?.animal_uuid?.value)
                  .filter((value): value is string => !!value);

                return (
                  <TransferAbcAnimalRow
                    key={field.id}
                    control={genericControl}
                    index={index}
                    remove={remove}
                    languageGB={languageGB}
                    disabled={disabled}
                    animalOptions={animalOptions}
                    weightByAnimalUuid={weightByAnimalUuid}
                    otherRowsAnimalUuids={otherRowsAnimalUuids}
                  />
                );
              })}
            </Flex>
          )}

          <Button
            type="button"
            title={animalText.addAnimal}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
          />
        </>
      )}
    </Box>
  );
}

export default TransferAbcAnimalsEditor;
