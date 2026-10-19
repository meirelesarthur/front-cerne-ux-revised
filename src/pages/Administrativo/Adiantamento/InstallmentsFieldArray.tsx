// src/pages/Administrativo/Adiantamento/InstallmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Diferencial do Adiantamento Salarial — linhas repetíveis de PARCELAS
// (`installments[]` = {month:'YYYY-MM', value}), TASK-FE-adiant-salarial
// (97-Esteiras/034). Mirror mecânico de
// `Invoices/InvoiceInstallmentsTab.tsx` (useFieldArray + soma reativa via
// `watch`), SEM o gerador de parcelas (fora de escopo aqui — o legado desta
// tela não tinha gerador, só linhas manuais) e usando `month` (mês) em vez
// de `due_date` (a Invoice usa data de vencimento; Advance usa mês —
// `MonthInput`, FE-FORM-MONTH-WIDGET).
//
// Soma reativa (FE-FORM-SUMCALC): `watch('installments')` — NUNCA um 2º
// `useState` (Lei 4: nada de estado derivado fora do RHF). Validação
// Σ==amount (tolerância 0.01) vive no `advance-schema.ts` (client) + 422
// mapeado em `installments` (servidor) — este componente só EXIBE a soma e o
// erro de array, nunca recalcula a regra.
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MonthInput, currentMonthIso } from '@/components/Form/MonthInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type { AdvanceForm } from '@/@types/v2/Advances';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface InstallmentsFieldArrayProps {
  control: Control<AdvanceForm>;
  errors: FieldErrors<AdvanceForm>;
  watch: UseFormWatch<AdvanceForm>;
  isLoading: boolean;
  canSave: boolean;
}

/** Tolerância de exibição da soma — mirror EXATO do schema (`advance-schema.ts`)
 *  e do backend (`AdvanceRequest::after()`). */
const INSTALLMENTS_SUM_TOLERANCE = 0.01;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InstallmentsFieldArray({
  control,
  errors,
  watch,
  isLoading,
  canSave,
}: InstallmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.advances.advance.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'installments' });

  const isDisabled = !canSave || isLoading;

  const amount = Number(watch('amount')) || 0;
  const watchedInstallments = watch('installments') ?? [];
  const totalInstallments = watchedInstallments.reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0
  );
  const isSumComplete = Math.abs(totalInstallments - amount) <= INSTALLMENTS_SUM_TOLERANCE;

  const arrayError = errors.installments?.message as string | undefined;

  function handleAddRow() {
    append({ month: currentMonthIso(), value: null });
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
          {text.fields.installments}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {text.installmentRow.sumBadgeLabel}: {formatCurrencyBRL(totalInstallments)} /{' '}
            {formatCurrencyBRL(amount)}
          </Badge>
        )}
      </Flex>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.installmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box w={{ base: 'full', sm: '280px' }}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.installmentRow.month}
                </Text>
                <Controller
                  name={`installments.${index}.month`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <>
                      <MonthInput
                        value={rowField.value || null}
                        onChange={(value) => rowField.onChange(value ?? '')}
                        disabled={isDisabled}
                      />
                      {fieldState.error?.message && (
                        <Text fontSize="xs" color="fg.error" mt={1}>
                          {fieldState.error.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`installments.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={text.installmentRow.value}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={text.installmentRow.removeButton}
                mensegerTooltip={text.installmentRow.removeButton}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.installmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        disabled={isDisabled}
      />
    </Box>
  );
}
