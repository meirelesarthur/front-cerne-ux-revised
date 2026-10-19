// src/pages/Operacional/Marcacao/DoneLinesFields.tsx
// -----------------------------------------------------------------------------
// Corpo de linhas de REALIZADO (done) de Marcação — mesma decisão estrutural
// de `ForecastLinesFields.tsx`. Reutilizado por `RealizadoMarking.tsx`
// (single, TASK-MC-FE-06) e `RealizacaoLoteMarking.tsx` (bulk,
// TASK-MC-FE-07).
//
// `order` (diferente de Previsão) é um SELECT vinculado a uma linha de
// forecast JÁ EXISTENTE da mesma marcação (`CLM-DONE-ORDER-LINK`) — opção já
// usada por OUTRA linha do form fica desabilitada. Campos travados (readonly)
// quando a linha já persistida (`index < persistedCount`) tem `status>1`
// (`CLM-DONE-READONLY-BY-STATUS`); "Adicionar item" bloqueado quando a ÚLTIMA
// linha do form (persistida ou não) já está `status==='3'`
// (`CLM-DONE-BLOCK-STATUS3`). `total` é feedback client-side (`CALC-06`) —
// nunca sobrescreve a resposta do servidor pós-save.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, FieldErrors, useFieldArray, useWatch } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { markingColorOptions } from '@/constants/marcacao/marking/options/marking-color-options';
import { markingDoneStatusOptions } from '@/constants/marcacao/marking/options/marking-done-status-options';

import type { MarkingDoneLine, MarkingForecastLine } from '@/@types/v2/Marcacao/marking';

export interface DoneLinesFormValues {
  lines: MarkingDoneLine[];
}

export interface DoneLinesFieldsProps {
  control: Control<DoneLinesFormValues>;
  errors: FieldErrors<DoneLinesFormValues>;
  disabled?: boolean;
  /** Linhas de forecast JÁ EXISTENTES da(s) marcação(ões) — alimenta o select
   *  `order` (`CLM-DONE-ORDER-LINK`). */
  forecastLines: MarkingForecastLine[];
  /** Nº de linhas hidratadas do servidor no `reset()` inicial. */
  persistedCount: number;
}

function computeLineTotal(line: Partial<MarkingDoneLine> | undefined): number {
  const quantity = Number(line?.quantity) || 0;
  const averageWeight = Number(line?.average_weight) || 0;
  const averagePrice = Number(line?.average_price) || 0;
  return averageWeight * averagePrice * quantity;
}

export function DoneLinesFields({
  control,
  errors,
  disabled,
  forecastLines,
  persistedCount,
}: DoneLinesFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.marcacao.marking.done;

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = useWatch({ control, name: 'lines' }) ?? [];

  const lastLine = watchedLines[watchedLines.length - 1];
  const canAddLine = !lastLine || String(lastLine.status) !== '3';
  const canRemoveLine = fields.length > 1;

  function handleAppend() {
    if (!canAddLine) return;
    const usedOrders = new Set(watchedLines.map((line) => line?.order));
    const nextForecastOrder = forecastLines.find((f) => !usedOrders.has(f.order))?.order ?? 1;
    append({
      order: nextForecastOrder,
      date: '',
      quantity: 0,
      discard: 0,
      average_weight: 0,
      average_price: 0,
      status: '1',
    });
  }

  const linesRootError = (errors.lines as unknown as { message?: string } | undefined)?.message;

  return (
    <Box>
      {fields.map((field, index) => {
        const line = watchedLines[index];
        const isPersisted = index < persistedCount;
        const isReadonly = isPersisted && Number(line?.status) > 1;
        const total = computeLineTotal(line);
        const lineErrors = errors.lines?.[index];

        const usedOrders = new Set(
          watchedLines.filter((_, i) => i !== index).map((otherLine) => otherLine?.order)
        );
        const orderOptions = forecastLines.map((f) => ({
          label: `${f.order} — ${f.forecast_date ?? ''} (${f.quantity ?? 0})`,
          value: f.order,
          disabled: usedOrders.has(f.order),
        }));

        return (
          <Box
            key={field.id}
            p={3}
            mb={3}
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" fontWeight="semibold">
                {text.fields.order} {index + 1}
                {line?.status_label ? ` — ${line.status_label}` : ''}
              </Text>
              {canRemoveLine && !disabled && !isReadonly && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  title={text.removeLine}
                  onClick={() => remove(index)}
                />
              )}
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={3}>
              <Controller
                name={`lines.${index}.order`}
                control={control}
                render={({ field: rowField }) => (
                  <Select
                    name={rowField.name}
                    label={text.fields.order}
                    placeholder={text.fields.orderPlaceholder}
                    isRequired
                    noClearable
                    isDisabled={disabled || isReadonly}
                    options={orderOptions}
                    value={orderOptions.find((option) => option.value === rowField.value) ?? null}
                    onChange={(option) => option && rowField.onChange(option.value)}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.date`}
                control={control}
                render={({ field: rowField }) => (
                  <Field
                    label={text.fields.date}
                    isRequired
                    errorText={lineErrors?.date?.message as string | undefined}
                  >
                    <DateInput
                      value={rowField.value ?? null}
                      onChange={rowField.onChange}
                      disabled={disabled || isReadonly}
                    />
                  </Field>
                )}
              />
              <Controller
                name={`lines.${index}.quantity`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.quantity}
                    isRequired
                    min={0}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled || isReadonly}
                    error={lineErrors?.quantity?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.discard`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.discard}
                    isRequired
                    min={0}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled || isReadonly}
                    error={lineErrors?.discard?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.average_weight`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.averageWeight}
                    isRequired
                    allowDot
                    decimalPlaces={2}
                    min={0}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled || isReadonly}
                    error={lineErrors?.average_weight?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.average_price`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.averagePrice}
                    isRequired
                    allowDot
                    decimalPlaces={2}
                    min={0}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled || isReadonly}
                    error={lineErrors?.average_price?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.status`}
                control={control}
                render={({ field: rowField }) => (
                  <Select
                    name={rowField.name}
                    label={text.fields.status}
                    isRequired
                    noClearable
                    isDisabled={disabled || isReadonly}
                    options={markingDoneStatusOptions.options(languageGB)}
                    value={
                      rowField.value
                        ? markingDoneStatusOptions.getOption(rowField.value, languageGB)
                        : null
                    }
                    onChange={(option) => option && rowField.onChange(option.value)}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.color`}
                control={control}
                render={({ field: rowField }) => (
                  <Select
                    name={rowField.name}
                    label={text.fields.color}
                    isDisabled={disabled || isReadonly}
                    options={markingColorOptions.options(languageGB)}
                    value={
                      rowField.value
                        ? markingColorOptions.getOption(rowField.value, languageGB)
                        : null
                    }
                    onChange={(option) => rowField.onChange(option?.value ?? undefined)}
                  />
                )}
              />
            </SimpleGrid>

            <Text fontSize="xs" color="fg.muted" mt={3}>
              {text.fields.total}: {total.toFixed(2)}
            </Text>
          </Box>
        );
      })}

      {linesRootError && (
        <Text color="fg.error" fontSize="sm" mb={2}>
          {linesRootError}
        </Text>
      )}

      <Button
        variant="outline"
        size="sm"
        type="button"
        icon={FiPlus as ElementType}
        title={text.addLine}
        onClick={handleAppend}
        disabled={!canAddLine || disabled}
      />
      {!canAddLine && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {text.maxLinesWarning}
        </Text>
      )}
    </Box>
  );
}
