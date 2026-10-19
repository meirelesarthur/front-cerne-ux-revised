// src/pages/Frota/Manutencoes/GenerateFinancialInstallmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Parcelamento DENTRO de 1 bloco de fornecedor — Tarefa 45.
// `useFieldArray('providers.{index}.installments')`, mirror da INTERAÇÃO de
// `Financeiro/ContasAPagar/ExpenseInstallmentsTab.tsx` (gerador "Nº
// Parcelas"/"Venc. 1ª PC"/"Intervalo (dias)" + tabela editável
// `due_date`/`value`, soma informativa NUNCA bloqueante).
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

import type { GenerateFinancialForm } from '@/@types/v2/Maintenances';

import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface GenerateFinancialInstallmentsFieldArrayProps {
  providerIndex: number;
  control: Control<GenerateFinancialForm>;
  watch: UseFormWatch<GenerateFinancialForm>;
  setValue: UseFormSetValue<GenerateFinancialForm>;
  error?: string | null;
  isDisabled: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

export function GenerateFinancialInstallmentsFieldArray({
  providerIndex,
  control,
  watch,
  error,
  isDisabled,
}: GenerateFinancialInstallmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.generateFinancial.installments;

  const { fields, replace, remove } = useFieldArray({
    control,
    name: `providers.${providerIndex}.installments`,
  });

  const [installmentCount, setInstallmentCount] = useState<number | null>(null);
  const [firstDueDate, setFirstDueDate] = useState<string | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(null);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

  const total = Number(watch(`providers.${providerIndex}.total`)) || 0;
  const watchedInstallments = watch(`providers.${providerIndex}.installments`) ?? [];
  const totalInstallments = watchedInstallments.reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalInstallments - total) <= 0.01 * Math.max(watchedInstallments.length, 1);

  function executeGenerate() {
    const count = Number(installmentCount) || 0;
    if (count <= 0 || !firstDueDate) return;
    const shares = distributeEqually(total, count);
    const rows = shares.map((value, idx) => ({
      due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)),
      value,
    }));
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
    replace([...watchedInstallments, { due_date: null, value: null }] as any);
  }

  return (
    <Box pt={2}>
      <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
        {text.title}
        <Text as="span" color="fg.error" ml={1} aria-hidden="true">
          *
        </Text>
      </Text>
      {error && (
        <Text role="alert" color="fg.error" fontSize="sm" mb={3}>
          {error}
        </Text>
      )}

      <Box p={4} bg="bg.muted" borderRadius="lg" mb={4}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <NumberInput
            name="installmentCount"
            label={text.fields.installmentCount}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentCount}
            onValueChange={setInstallmentCount}
            disabled={isDisabled}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {text.fields.firstDueDate}
            </Text>
            <DateInput value={firstDueDate} onChange={setFirstDueDate} disabled={isDisabled} />
          </Box>

          <NumberInput
            name="intervalDays"
            label={text.fields.intervalDays}
            allowDot={false}
            decimalPlaces={0}
            min={0}
            value={intervalDays}
            onValueChange={setIntervalDays}
            disabled={isDisabled}
          />
        </SimpleGrid>

        <Button
          title={text.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={isDisabled}
        />
      </Box>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
        <Text fontSize="sm" color="fg.muted">
          {text.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(total)}
          </Badge>
        )}
      </Flex>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={3} mb={3}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.fields.dueDate}
                </Text>
                <Controller
                  name={`providers.${providerIndex}.installments.${index}.due_date`}
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
                  name={`providers.${providerIndex}.installments.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.fields.value}
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
                aria-label={text.removeButton}
                mensegerTooltip={text.removeButton}
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
        title={text.addButton}
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
        description={text.overwriteConfirm}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}
