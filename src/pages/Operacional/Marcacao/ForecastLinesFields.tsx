// src/pages/Operacional/Marcacao/ForecastLinesFields.tsx
// -----------------------------------------------------------------------------
// Corpo de linhas de PREVISÃO (forecast) de Marcação — mirror `useFieldArray`
// de `Operacional/Pastagem/AppropriatePastagem.tsx`. Reutilizado por
// `PrevisaoMarking.tsx` (single, TASK-MC-FE-05) e `PrevisaoLoteMarking.tsx`
// (bulk, TASK-MC-FE-07) — a diferença entre os dois é só a orquestração de
// dados (1 `uuid` vs `ids[]`), nunca o corpo do formulário.
//
// Mín. 1 / máx. 4 linhas (mirror `CLM-FORECAST-VALIDATION`); soma de
// `percentage` bloqueando submit fora de 100% é validada pelo schema Yup
// (`marking-forecast-schema.ts`, `sum-percentage-100`) — aqui só exibimos o
// somatório corrente + a mensagem de erro do array, feedback imediato.
//
// `order` NUNCA é um campo editável pelo usuário — é derivado da posição
// (index+1) no momento do submit (mirror `CLM-FORECAST-VALIDATION`: sequência
// 1..N sem lacunas, validada também no servidor). Exibimos só como rótulo de
// cabeçalho da linha ("Linha N").
//
// `referenceMarking` (quantity/date) alimenta o CÁLCULO DE FEEDBACK client-side
// (`CALC-02..05`) — ausente em modo bulk (quantidade difere por marking
// selecionado, `ARCHITECTURE-MARCACAO-FE.md §4`); quando ausente, a seção de
// feedback simplesmente não é renderizada (SEM MOCK de um valor que não é
// calculável no cliente para o grupo).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { addDays, parseISO } from 'date-fns';
import { Control, Controller, FieldErrors, useFieldArray, useWatch } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { MarkingForecastLine } from '@/@types/v2/Marcacao/marking';

export interface ForecastLinesFormValues {
  lines: MarkingForecastLine[];
}

export interface ForecastLinesFieldsProps {
  control: Control<ForecastLinesFormValues>;
  errors: FieldErrors<ForecastLinesFormValues>;
  disabled?: boolean;
  /** Só em modo single-marking (`PrevisaoMarking.tsx`) — mirror `CALC-02..05`. */
  referenceMarking?: { quantity: number; date: string } | null;
}

const MAX_LINES = 4;

interface LineFeedback {
  quantity: number;
  incomeBoxes: number;
  total: number;
  forecastDate?: string;
}

function computeLineFeedback(
  line: Partial<MarkingForecastLine> | undefined,
  referenceMarking: { quantity: number; date: string }
): LineFeedback {
  const percentage = Number(line?.percentage) || 0;
  const averageWeight = Number(line?.average_weight) || 0;
  const averagePrice = Number(line?.average_price) || 0;
  const days = Number(line?.days) || 0;

  const quantity = Math.round((referenceMarking.quantity * percentage) / 100);
  const incomeBoxes = averageWeight && quantity ? (averageWeight * quantity) / 20 : 0;
  const total = averageWeight * averagePrice * quantity;

  let forecastDate: string | undefined;
  try {
    forecastDate = addDays(parseISO(referenceMarking.date), days).toISOString();
  } catch {
    forecastDate = undefined;
  }

  return { quantity, incomeBoxes, total, forecastDate };
}

export function ForecastLinesFields({
  control,
  errors,
  disabled,
  referenceMarking,
}: ForecastLinesFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.marcacao.marking.forecast;

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = useWatch({ control, name: 'lines' }) ?? [];

  const percentageSum = watchedLines.reduce(
    (sum, line) => sum + (Number(line?.percentage) || 0),
    0
  );
  const canAddLine = fields.length < MAX_LINES;
  const canRemoveLine = fields.length > 1;

  function handleAppend() {
    if (!canAddLine) return;
    append({
      order: fields.length + 1,
      percentage: 0,
      average_weight: 0,
      average_price: 0,
      days: 0,
    });
  }

  const linesRootError = (errors.lines as unknown as { message?: string } | undefined)?.message;

  return (
    <Box>
      {fields.map((field, index) => {
        const feedback = referenceMarking
          ? computeLineFeedback(watchedLines[index], referenceMarking)
          : null;
        const lineErrors = errors.lines?.[index];

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
              </Text>
              {canRemoveLine && !disabled && (
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
                name={`lines.${index}.percentage`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.percentage}
                    isRequired
                    min={1}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled}
                    error={lineErrors?.percentage?.message as string | undefined}
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
                    disabled={disabled}
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
                    disabled={disabled}
                    error={lineErrors?.average_price?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name={`lines.${index}.days`}
                control={control}
                render={({ field: rowField }) => (
                  <NumberInput
                    name={rowField.name}
                    label={text.fields.days}
                    isRequired
                    min={0}
                    value={rowField.value ?? null}
                    onValueChange={(value) => rowField.onChange(value ?? 0)}
                    disabled={disabled}
                    error={lineErrors?.days?.message as string | undefined}
                  />
                )}
              />
            </SimpleGrid>

            {feedback && (
              <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} mt={3}>
                <Text fontSize="xs" color="fg.muted">
                  {text.fields.quantity}: {feedback.quantity}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {text.fields.incomeBoxes}: {feedback.incomeBoxes.toFixed(2)}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {text.fields.total}: {feedback.total.toFixed(2)}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {text.fields.forecastDate}:{' '}
                  {feedback.forecastDate ? formatDate(feedback.forecastDate) : '-'}
                </Text>
              </SimpleGrid>
            )}
          </Box>
        );
      })}

      {linesRootError && (
        <Text color="fg.error" fontSize="sm" mb={2}>
          {linesRootError}
        </Text>
      )}

      <Text
        fontSize="sm"
        fontWeight="medium"
        color={percentageSum === 100 ? 'fg.muted' : 'fg.error'}
        mb={3}
      >
        {text.fields.percentage}: {percentageSum}%
      </Text>

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
