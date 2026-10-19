// src/pages/Administrativo/FarmTransfer/FarmTransferInstallments.tsx
// -----------------------------------------------------------------------------
// Repetidor de PARCELAS do subfluxo financeiro opcional de Trans. Fazendas
// (FarmTransfer — Estoque, Tarefa 03, `GAP-FARMTRANSFER-FE-03`). Mirror
// MECÂNICO da tabela editável de `InvoiceInstallmentsTab.tsx` (data + valor,
// `useFieldArray` próprio do PAI, soma reativa via `watch`, badge de
// fechamento com tolerância `0.01`) — SEM o gerador de parcelas daquela tela
// (down payment/nº parcelas/intervalo), que é uma capacidade PRÓPRIA de
// Invoice sem precedente nesta feature (`date_installments[]`/
// `value_installments[]` do payload são só 1 array paralelo cada, sem
// entrada separada).
//
// Granularidade real confirmada pelo Tester da API: Income/Expense são
// vinculados por PARCELA (`GAP-FARMTRANSFER-FE-03`) — cada linha aqui
// corresponde a 1 par `(date_installments[i], value_installments[i])` do
// payload final.
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import type { LanguageDate } from '@/@types/language';
import type {
  FarmTransferCreateForm,
  FarmTransferInstallmentForm,
} from '@/@types/v2/FarmTransfers';

export interface FarmTransferInstallmentsFieldValues {
  installments: FarmTransferInstallmentForm[];
}

export interface FarmTransferInstallmentsProps {
  control: Control<FarmTransferCreateForm>;
  fields: FieldArrayWithId<FarmTransferInstallmentsFieldValues, 'installments', 'id'>[];
  append: UseFieldArrayAppend<FarmTransferInstallmentsFieldValues, 'installments'>;
  remove: UseFieldArrayRemove;
  /** `vl_total` do cabeçalho financeiro — só para o badge cosmético de fechamento. */
  vlTotal: number;
  errors: FieldErrors<FarmTransferCreateForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FarmTransferInstallments({
  control,
  fields,
  append,
  remove,
  vlTotal,
  errors,
  languageGB,
  disabled = false,
}: FarmTransferInstallmentsProps) {
  const financialText = languageGB.farmTransfers.farmTransfer.form.fields.financial;

  const genericControl = control as unknown as Control<FarmTransferInstallmentsFieldValues>;
  const arrayError = (errors as any)?.installments?.message as string | undefined;

  const watchedRows = useWatch({ control: genericControl, name: 'installments' }) ?? [];
  const totalInstallments = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumComplete = Math.abs(totalInstallments - vlTotal) <= 0.01;

  function handleAdd() {
    append({ date: null, value: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {financialText.installmentsSectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {financialText.installmentsSectionHint}
          </Text>
        </Box>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {financialText.installmentsSumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(vlTotal)}
            </Badge>
          </Flex>
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
            {financialText.emptyInstallments}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {financialText.installmentDate}
                </Text>
                <Controller
                  name={`installments.${index}.date`}
                  control={genericControl}
                  render={({ field: rowField }) => (
                    <DateInput
                      value={rowField.value ?? null}
                      onChange={rowField.onChange}
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`installments.${index}.value`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={financialText.installmentValue}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={financialText.removeInstallment}
                mensegerTooltip={financialText.removeInstallment}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={financialText.addInstallment}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default FarmTransferInstallments;
