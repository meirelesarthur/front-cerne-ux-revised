// src/pages/Administrativo/Adiantamento/FinancialInstallmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Sub-card "Parcelas Financeiras" (`financial.installments[]` = cronograma de
// contas a pagar, `{ due_date:'YYYY-MM-DD', value }`) do bloco "Gerar
// Financeiro" — TASK-FE-FINANCEIRO-adiant (97-Esteiras/034, D2-REV). Mirror
// mecânico de `Invoices/InvoiceInstallmentsTab.tsx` (gerador qtd/1ª data/
// intervalo + entrada, FID-G3F §7.1 — default REPLICAR), adaptado:
//   - Sem abas (`isEditing` aqui NÃO desabilita o card — ao contrário do
//     Invoice write-only, o Advance financeiro É hidratado no EDIT, §B.6).
//   - `amount`/`has_input`/`input_date`/`input_value` são lidos do MESMO
//     form raiz via `watch` (não são props locais do gerador como no
//     Invoice `hasDownPayment`) — já vivem em `financial.*` do RHF.
//   - `distributeEqually`/`addDays` COPIADOS module-local (não
//     compartilhados, mesma prática do fork — FID-G3F §6).
//
// Soma reativa (Σ==amount, 0.01) — `watch('financial.installments')` +
// `watch('amount')`; validação vive no `advance-schema.ts`
// ('financial-installments-sum'); este componente só EXIBE.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { AdvanceForm } from '@/@types/v2/Advances';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface FinancialInstallmentsFieldArrayProps {
  control: Control<AdvanceForm>;
  errors: FieldErrors<AdvanceForm>;
  watch: UseFormWatch<AdvanceForm>;
  isLoading: boolean;
  canSave: boolean;
}

/** Tolerância de exibição — mirror EXATO do schema (`advance-schema.ts`,
 *  'financial-installments-sum') e do backend (`AdvanceRequest::after()`). */
const FINANCIAL_INSTALLMENTS_SUM_TOLERANCE = 0.01;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Distribui `total` em `count` parcelas iguais, absorvendo o resto de
 * arredondamento (centavos) na ÚLTIMA parcela — mirror EXATO de
 * `InvoiceInstallmentsTab.tsx` (module-local, não compartilhado).
 * @param {number} total - Valor total a distribuir.
 * @param {number} count - Número de parcelas.
 * @return {number[]} Valor de cada parcela, na ordem.
 */
function distributeEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const roundedShare = Math.round((total / count) * 100) / 100;
  const shares = new Array(count).fill(roundedShare);
  const distributed = roundedShare * count;
  const remainder = Math.round((total - distributed) * 100) / 100;
  shares[count - 1] = Math.round((shares[count - 1] + remainder) * 100) / 100;
  return shares;
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function FinancialInstallmentsFieldArray({
  control,
  errors,
  watch,
  isLoading,
  canSave,
}: FinancialInstallmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.advances.advance.form;

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: 'financial.installments',
  });

  const isDisabled = !canSave || isLoading;

  // ---- Estado LOCAL do gerador (fora do RHF, FID-G3F §7.1) ----
  const [installmentCount, setInstallmentCount] = useState<number | null>(null);
  const [firstDueDate, setFirstDueDate] = useState<string | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(30);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

  const amount = Number(watch('amount')) || 0;
  const hasInput = !!watch('financial.has_input');
  const inputDate = watch('financial.input_date');
  const inputValue = Number(watch('financial.input_value')) || 0;

  const watchedInstallments = watch('financial.installments') ?? [];
  const totalInstallments = watchedInstallments.reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalInstallments - amount) <= FINANCIAL_INSTALLMENTS_SUM_TOLERANCE;

  const arrayError = errors.financial?.installments?.message as string | undefined;

  function executeGenerate() {
    const count = Number(installmentCount) || 0;
    if (count <= 0 || !firstDueDate) return;

    const rows: { due_date: string; value: number }[] = [];

    if (hasInput && inputDate && inputValue) {
      rows.push({ due_date: inputDate, value: inputValue });
      const remaining = amount - inputValue;
      const shares = distributeEqually(remaining, count);
      shares.forEach((value, idx) => {
        rows.push({ due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)), value });
      });
    } else {
      const shares = distributeEqually(amount, count);
      shares.forEach((value, idx) => {
        rows.push({ due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)), value });
      });
    }

    replace(rows);
  }

  function handleGenerate() {
    if (fields.length > 0) {
      setIsOverwriteConfirmOpen(true);
      return;
    }
    executeGenerate();
  }

  function handleAddRow() {
    append({ due_date: '', value: null });
  }

  return (
    <Box>
      {/* ---- Gerador (UI local) ---- */}
      <Box p={4} bg="bg.panel" borderRadius="lg" mb={6}>
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {text.sections.installmentGenerator}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <NumberInput
            name="financialInstallmentCount"
            label={text.installmentGenerator.count}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentCount}
            onValueChange={setInstallmentCount}
            disabled={isDisabled}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {text.installmentGenerator.firstDueDate}
            </Text>
            <DateInput value={firstDueDate} onChange={setFirstDueDate} disabled={isDisabled} />
          </Box>

          <NumberInput
            name="financialIntervalDays"
            label={text.installmentGenerator.intervalDays}
            allowDot={false}
            decimalPlaces={0}
            min={0}
            value={intervalDays}
            onValueChange={setIntervalDays}
            disabled={isDisabled}
          />
        </SimpleGrid>

        <Button
          title={text.installmentGenerator.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={isDisabled}
        />
      </Box>

      {/* ---- Tabela editável (RHF, useFieldArray) ---- */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.financialInstallmentRow.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(amount)}
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
            {text.financialInstallmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.fields.dueDate}
                </Text>
                <Controller
                  name={`financial.installments.${index}.due_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <DateInput
                      value={rowField.value || null}
                      onChange={(value) => rowField.onChange(value ?? '')}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`financial.installments.${index}.value`}
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
                aria-label={text.financialInstallmentRow.removeButton}
                mensegerTooltip={text.financialInstallmentRow.removeButton}
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
        title={text.financialInstallmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        disabled={isDisabled}
      />

      <DeleteConfirmDialog
        isOpen={isOverwriteConfirmOpen}
        onClose={() => setIsOverwriteConfirmOpen(false)}
        onConfirm={() => {
          executeGenerate();
          setIsOverwriteConfirmOpen(false);
        }}
        description={text.installmentGenerator.overwriteConfirm}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}
