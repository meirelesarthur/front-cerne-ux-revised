// src/pages/Financeiro/ContasAPagar/ExpenseInstallmentsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Parcelamento" do formulário de Expense (Contas a Pagar, esteira 036)
// — TASK-FE-036-106. Gerador ("Nº Parcelas"/"Venc. 1ª PC"/"Intervalo
// (dias)") + tabela editável `due_date`/`value` — SÓ EM CRIAÇÃO (a aba
// nunca é montada em edição, ver `CreateOrUpdateExpense.tsx`).
//
// Achado real (GAP-FE-036-104) — DIFERENTE do Invoice: `qtd_installments>1`
// cria N `Expense` SEPARADAS (títulos independentes, não uma tabela
// write-only de um mesmo registro); a soma das parcelas é SÓ informativa
// (badge verde/laranja), NUNCA bloqueante — `StoreExpenseAction` não compara
// `sum(installments[].value)` com `amount`.
//
// `qtd_installments` (campo do form RAIZ, usado por
// `CreateOrUpdateExpense.tsx` para gatear a seção "Baixa Automática")
// deriva SEMPRE de `fields.length` — sincronizado aqui a cada
// geração/adição/remoção de linha (nunca digitado por um input próprio).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { ExpenseForm } from '@/@types/v2/Financeiro/expense';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ExpenseInstallmentsTabProps {
  control: Control<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  watch: UseFormWatch<ExpenseForm>;
  setValue: UseFormSetValue<ExpenseForm>;
  isLoading: boolean;
  canSave: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Distribui `total` em `count` parcelas iguais, absorvendo o resto de
 * arredondamento na ÚLTIMA parcela — mesma técnica do rateio de Invoice
 * (informativo aqui, nunca bloqueante, GAP-FE-036-104).
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

export function ExpenseInstallmentsTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
}: ExpenseInstallmentsTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.financial.expense.form;

  const { fields, replace, remove } = useFieldArray({ control, name: 'installments' });

  const isDisabled = !canSave || isLoading;

  const [installmentCount, setInstallmentCount] = useState<number | null>(null);
  const [firstDueDate, setFirstDueDate] = useState<string | null>(null);
  // TASK-FE-036-117 (FL41) — o legado NÃO tem default explícito para
  // "Intervalo (dias)" (campo nasce vazio); o Cerne forçava `30`.
  const [intervalDays, setIntervalDays] = useState<number | null>(null);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

  const amount = Number(watch('amount')) || 0;

  const watchedInstallments = watch('installments') ?? [];
  const totalInstallments = watchedInstallments.reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalInstallments - amount) <= 0.01 * Math.max(watchedInstallments.length, 1);

  const arrayError = errors.installments?.message as string | undefined;

  // EXP-R08 (P1) — 1 linha gerada É parcelamento de verdade (o usuário
  // escolheu esse Tipo de Lançamento e preencheu essa linha); nulificar
  // aqui fazia `CreateOrUpdateExpense.tryPersistExpense` tratar o título
  // como único comum, descartando o due_date/value digitados. Só fica
  // `null` quando NÃO há nenhuma linha.
  function syncQtdInstallments(rows: unknown[]) {
    setValue('qtd_installments', rows.length > 0 ? rows.length : null, { shouldDirty: true });
  }

  function executeGenerate() {
    const count = Number(installmentCount) || 0;
    if (count <= 0 || !firstDueDate) return;

    const shares = distributeEqually(amount, count);
    const rows = shares.map((value, idx) => ({
      due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)),
      value,
    }));

    replace(rows);
    syncQtdInstallments(rows);
  }

  function handleGenerate() {
    if (fields.length > 0) {
      setIsOverwriteConfirmOpen(true);
      return;
    }
    executeGenerate();
  }

  function handleAddRow() {
    const nextRows = [...watchedInstallments, { due_date: null, value: null }];
    replace(nextRows as any);
    syncQtdInstallments(nextRows);
  }

  function handleRemoveRow(index: number) {
    remove(index);
    syncQtdInstallments(watchedInstallments.filter((_, i) => i !== index));
  }

  return (
    <Box pt={4}>
      {/* ---- Gerador (UI local) ---- */}
      <Box p={4} bg="bg.muted" borderRadius="lg" mb={6}>
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {formText.sections.installmentGenerator}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <NumberInput
            name="installmentCount"
            label={formText.fields.installmentCount}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentCount}
            onValueChange={setInstallmentCount}
            disabled={isDisabled}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.firstDueDate}
            </Text>
            <DateInput value={firstDueDate} onChange={setFirstDueDate} disabled={isDisabled} />
          </Box>

          <NumberInput
            name="intervalDays"
            label={formText.fields.intervalDays}
            allowDot={false}
            decimalPlaces={0}
            min={0}
            value={intervalDays}
            onValueChange={setIntervalDays}
            disabled={isDisabled}
          />
        </SimpleGrid>

        <Button
          title={formText.installmentRow.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={isDisabled}
        />
      </Box>

      {/* ---- Tabela editável (RHF, useFieldArray) — soma SÓ informativa,
          NUNCA bloqueante (GAP-FE-036-104). ---- */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.installmentRow.sumBadgeLabel}
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
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.installmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.installmentRow.dueDate}
                </Text>
                <Controller
                  name={`installments.${index}.due_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <DateInput
                      value={rowField.value ?? null}
                      onChange={rowField.onChange}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`installments.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={formText.installmentRow.value}
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
                aria-label={formText.installmentRow.removeButton}
                mensegerTooltip={formText.installmentRow.removeButton}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => handleRemoveRow(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={formText.installmentRow.addButton}
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
        description={formText.installmentRow.overwriteConfirm}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}
