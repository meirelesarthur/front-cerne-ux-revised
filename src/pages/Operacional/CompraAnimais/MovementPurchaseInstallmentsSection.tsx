// src/pages/Operacional/CompraAnimais/MovementPurchaseInstallmentsSection.tsx
// -----------------------------------------------------------------------------
// 088 D3-FE-T2 — gerador de parcelas + tabela de parcelas da Compra de Animais
// (S4/S6 do contrato legado D3). Reescrito sobre o módulo puro
// `movementPurchaseFinancialMath` (D3-FE-T1): todo cálculo em CENTAVOS inteiros.
//
// Decisões do dono (PLANO-088-D3-D4-FRONT, seção final, VINCULANTES):
//  - P-FE-2: o gerador é por BOTÃO "Gerar" COM CONFIRMAÇÃO — mexer nos campos
//    do gerador (quantidade/1º vencimento/intervalo) NÃO regenera sozinho. A
//    confirmação aparece quando já há parcelas (substituir). Erros do gerador
//    (total 0, entrada >= total, parcela 0,00 — P-5, campos incompletos) são
//    mostrados no próprio bloco e a tabela fica INTACTA.
//  - P-FE-1: "Adicionar parcela" e remover parcela mantidos.
//  - Resíduo de centavos na ÚLTIMA parcela (D3-a).
//
// Tabela: a linha da ENTRADA (`origin='input'`, quando `has_input=Sim`) é
// somente leitura e espelha `financial_input_date/value` do cabeçalho; sai da
// tabela quando "Possui Entrada?" deixa de ser Sim. Editar data/valor de uma
// parcela marca `origin='manual'`. O pai recebe `onRowsChanged(origin)` para
// capturar a baseline do recálculo D3-b (§4.3, T4).
//
// Rodapé: "Total das parcelas" + Badge `Σ / total` — verde SÓ com Σ em centavos
// = total em centavos (sem tolerância).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayReplace,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type {
  MovementPurchaseFinInstallmentRow,
  MovementPurchaseForm,
  MovementPurchaseInstallmentOrigin,
} from '@/@types/v2/MovementPurchases';

import {
  type InstallmentCentsRow,
  fromCents,
  generateInstallments,
  sumCents,
  toCents,
} from './movementPurchaseFinancialMath';

export interface MovementPurchaseInstallmentsSectionProps {
  control: Control<MovementPurchaseForm>;
  /** Só `id` é usado (chave estável de cada linha do `useFieldArray`). */
  fields: Array<{ id: string }>;
  append: UseFieldArrayAppend<MovementPurchaseForm, 'financial_installments'>;
  remove: UseFieldArrayRemove;
  replace: UseFieldArrayReplace<MovementPurchaseForm, 'financial_installments'>;
  /** `total` da compra (recalculado no form pai) — base do gerador e do badge. */
  vlTotal: number;
  errors: FieldErrors<MovementPurchaseForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** Callback para a baseline do recálculo D3-b (§4.3): origem da última mudança de linhas. */
  onRowsChanged?: (origin: MovementPurchaseInstallmentOrigin) => void;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toFormRows(rows: InstallmentCentsRow[]): MovementPurchaseFinInstallmentRow[] {
  return rows.map((row) => ({
    due_date: row.due_date,
    amount: fromCents(row.amountCents),
    origin: row.origin,
  }));
}

export function MovementPurchaseInstallmentsSection({
  control,
  fields,
  append,
  remove,
  replace,
  vlTotal,
  errors,
  languageGB,
  disabled = false,
  onRowsChanged,
}: MovementPurchaseInstallmentsSectionProps) {
  const financialText = languageGB.movementPurchases.movementPurchase.form.financial;
  const text = financialText.installments;
  const messages = financialText.messages;

  const arrayError =
    errors.financial_installments?.message ?? errors.financial_installments?.root?.message;

  const hasInput = useWatch({ control, name: 'financial_has_input' });
  const inputDate = useWatch({ control, name: 'financial_input_date' });
  const inputValue = useWatch({ control, name: 'financial_input_value' });
  const generator = useWatch({ control, name: 'generator' });
  const rows = useWatch({ control, name: 'financial_installments' }) ?? [];

  const [generateError, setGenerateError] = useState<string | null>(null);
  const [pendingRows, setPendingRows] = useState<InstallmentCentsRow[] | null>(null);

  const totalCents = toCents(vlTotal);
  const sumInstallmentsCents = sumCents(rows.map((row) => toCents(row?.amount)));
  const isSumComplete = rows.length > 0 && sumInstallmentsCents === totalCents;

  // Linha da entrada: espelha o cabeçalho; some quando "Possui Entrada?" não é Sim.
  useEffect(() => {
    if (disabled) return;
    const first = rows[0];
    if (!first || first.origin !== 'input') return;

    if (hasInput === false || hasInput === null) {
      remove(0);
      onRowsChanged?.('input');
      return;
    }
    const nextDate = inputDate ?? null;
    const nextAmount = inputValue ?? null;
    if (first.due_date !== nextDate || first.amount !== nextAmount) {
      replace(
        rows.map((row, index) =>
          index === 0 ? { ...row, due_date: nextDate, amount: nextAmount } : row
        )
      );
      onRowsChanged?.('input');
    }
  }, [rows, hasInput, inputDate, inputValue, disabled]);

  function handleGenerate() {
    setGenerateError(null);

    const entryRequested = hasInput === true;
    const entryComplete = !!inputDate && toCents(inputValue) > 0;
    if (entryRequested && !entryComplete) {
      setGenerateError(messages.requiredFields);
      return;
    }

    const result = generateInstallments({
      totalCents,
      hasInput: entryRequested,
      input: entryRequested
        ? { due_date: inputDate as string, amountCents: toCents(inputValue) }
        : null,
      count: generator?.count ?? null,
      firstDueDate: generator?.first_due_date ?? null,
      intervalDays: generator?.interval_days ?? null,
    });

    if (result.error) {
      const byError: Record<string, string> = {
        INCOMPLETE: text.emptyHint,
        TOTAL_ZERO: messages.totalMustBePositive,
        INPUT_GE_TOTAL: messages.inputLessThanTotal,
        INSTALLMENT_ZERO: messages.installmentPositive.replace(
          '{{position}}',
          String(result.position ?? 1)
        ),
      };
      setGenerateError(byError[result.error]);
      return;
    }

    if (rows.length > 0) {
      setPendingRows(result.rows);
      return;
    }
    applyGenerated(result.rows);
  }

  function applyGenerated(generated: InstallmentCentsRow[]) {
    replace(toFormRows(generated));
    setPendingRows(null);
    setGenerateError(null);
    onRowsChanged?.('generated');
  }

  function handleAdd() {
    append({ due_date: null, amount: null, origin: 'manual' });
    onRowsChanged?.('manual');
  }

  function handleRemove(index: number) {
    remove(index);
    onRowsChanged?.('manual');
  }

  return (
    <Box
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
      data-testid="purchase-installments-section"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        {text.sectionTitle}
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={4}>
        {text.sectionHint}
      </Text>

      <Box p={4} bg="bg.panel" borderRadius="lg" mb={4}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <Controller
            name="generator.count"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name="movement_purchase_installments_generator_count"
                label={text.qtdInstallments}
                allowDot={false}
                decimalPlaces={0}
                min={1}
                value={field.value ?? null}
                onValueChange={(value) => {
                  setGenerateError(null);
                  field.onChange(value);
                }}
                error={fieldState.error?.message}
                isRequired
                disabled={disabled}
              />
            )}
          />

          <Controller
            name="generator.first_due_date"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label={text.firstInstallment}
                value={field.value ?? null}
                onChange={(value) => {
                  setGenerateError(null);
                  field.onChange(value);
                }}
                error={fieldState.error?.message}
                isRequired
                disabled={disabled}
              />
            )}
          />

          <Controller
            name="generator.interval_days"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name="movement_purchase_installments_generator_interval"
                label={text.intInstallments}
                allowDot={false}
                decimalPlaces={0}
                min={0}
                value={field.value ?? null}
                onValueChange={(value) => {
                  setGenerateError(null);
                  field.onChange(value);
                }}
                error={fieldState.error?.message}
                isRequired
                disabled={disabled}
              />
            )}
          />
        </SimpleGrid>

        <Button
          type="button"
          title={text.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={disabled}
        />

        {generateError && (
          <Text role="alert" fontSize="xs" color="fg.error" mt={3} data-testid="generator-error">
            {generateError}
          </Text>
        )}
      </Box>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.totalLabel}:
        </Text>
        {rows.length > 0 && (
          <Flex align="center" gap={2}>
            <Badge
              data-testid="installments-sum-badge"
              data-complete={isSumComplete ? 'true' : 'false'}
              colorPalette={isSumComplete ? 'green' : 'orange'}
              variant="subtle"
            >
              {formatCurrencyBRL(fromCents(sumInstallmentsCents))} /{' '}
              {formatCurrencyBRL(fromCents(totalCents))}
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({text.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {arrayError && (
        <Text role="alert" fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyInstallments} {text.emptyHint}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const isEntry = rows[index]?.origin === 'input';
            return (
              <Flex
                key={field.id}
                gap={3}
                align="flex-start"
                wrap="wrap"
                data-testid={isEntry ? 'installment-row-input' : `installment-row-${index}`}
              >
                <Box w={{ base: 'full', sm: '110px' }} pt={7}>
                  <Text fontSize="sm" fontWeight="medium">
                    {isEntry ? text.inputRowLabel : `${text.positionLabel} ${index + 1}`}
                  </Text>
                </Box>

                <Controller
                  name={`financial_installments.${index}.origin`}
                  control={control}
                  render={({ field: originField }) => {
                    const markManual = () => {
                      if (originField.value !== 'manual') {
                        originField.onChange('manual');
                        onRowsChanged?.('manual');
                      }
                    };
                    return (
                      <>
                        <Box flex="1" minW="200px">
                          <Controller
                            name={`financial_installments.${index}.due_date`}
                            control={control}
                            render={({ field: dateField, fieldState }) => (
                              <DateInput
                                label={text.installmentDate}
                                value={dateField.value ?? null}
                                onChange={(value) => {
                                  dateField.onChange(value);
                                  markManual();
                                }}
                                error={fieldState.error?.message}
                                disabled={disabled || isEntry}
                              />
                            )}
                          />
                        </Box>

                        <Box w={{ base: 'full', sm: '200px' }}>
                          <Controller
                            name={`financial_installments.${index}.amount`}
                            control={control}
                            render={({ field: amountField, fieldState }) => (
                              <MoneyInput
                                name={amountField.name}
                                label={text.installmentValue}
                                value={amountField.value ?? null}
                                onValueChange={(value) => {
                                  amountField.onChange(value);
                                  markManual();
                                }}
                                error={fieldState.error?.message}
                                isRequired
                                disabled={disabled || isEntry}
                              />
                            )}
                          />
                        </Box>
                      </>
                    );
                  }}
                />

                {isEntry ? (
                  <Text fontSize="xs" color="fg.muted" pt={7} maxW="220px">
                    {text.inputRowHint}
                  </Text>
                ) : (
                  <Box pt={6}>
                    <IconButtonTable
                      aria-label={text.removeInstallment}
                      mensegerTooltip={text.removeInstallment}
                      size="sm"
                      color="red.500"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => handleRemove(index)}
                    >
                      <Icon as={FiTrash2} />
                    </IconButtonTable>
                  </Box>
                )}
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addInstallment}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <DeleteConfirmDialog
        isOpen={pendingRows !== null}
        onClose={() => setPendingRows(null)}
        onConfirm={() => {
          if (pendingRows) applyGenerated(pendingRows);
        }}
        title={text.regenerateConfirmTitle}
        description={text.regenerateConfirmDescription}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}

export default MovementPurchaseInstallmentsSection;
