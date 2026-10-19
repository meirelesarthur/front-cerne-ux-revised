// src/pages/Administrativo/Recebimentos/RequestReceiptInstallmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Subregistro "Parcelamento" da tela Gerar Financeiro (execução 081, T-081-FE-10).
// As linhas são GERADAS pela página (`recalculateInstallments`, em `blur`/`change`
// dos campos de condição de pagamento, como o `calcInstallments` do legado, ver
// `installments.ts`); aqui só se editam vencimento e valor de cada parcela e se
// mostra a soma. Ao sair de um valor (`onValueBlur`) a página redistribui o total
// das parcelas nas linhas do rateio sem valor (IG-11).
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Control, Controller, useFieldArray, UseFormWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { MoneyInput } from '@/components/Form/MoneyInput';

import { useLanguage } from '@/hooks/useLanguage';

import type { GenerateFinancialForm } from '@/@types/v2/RequestReceipts';

import { sumValues } from './installments';

export interface RequestReceiptInstallmentsFieldArrayProps {
  control: Control<GenerateFinancialForm>;
  watch: UseFormWatch<GenerateFinancialForm>;
  isDisabled: boolean;
  onValueBlur: () => void;
}

export function RequestReceiptInstallmentsFieldArray({
  control,
  watch,
  isDisabled,
  onValueBlur,
}: RequestReceiptInstallmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt.financial.installments;

  const { fields } = useFieldArray({ control, name: 'installments' });

  const vlTotal = watch('vl_total') ?? 0;
  const watchedInstallments = watch('installments') ?? [];
  const sum = sumValues(watchedInstallments);
  // Tolerância de 1 centavo por parcela (3 x 333,33 = 999,99 é aceito pela API).
  const isSumComplete =
    watchedInstallments.length === 0 ||
    Math.abs(sum - Number(vlTotal || 0)) <= watchedInstallments.length * 0.01 + 0.000001;

  return (
    <Box>
      <Text fontWeight="bold" color="brandColorText" mb={4}>
        {text.title}
      </Text>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.sumLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {sum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
        <Flex direction="column" gap={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Controller
                  name={`installments.${index}.due_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Field label={text.columns.dueDate}>
                      <DateInput
                        value={rowField.value}
                        onChange={rowField.onChange}
                        disabled={isDisabled}
                      />
                    </Field>
                  )}
                />
              </Box>
              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`installments.${index}.value`}
                  control={control}
                  render={({ field: rowField }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.columns.value}
                      value={rowField.value}
                      onValueChange={rowField.onChange}
                      onBlur={onValueBlur}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
