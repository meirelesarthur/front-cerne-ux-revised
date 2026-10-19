// src/pages/Incomes/IncomeInstallmentsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Parcelamento" do form de criação de Income — TASK-FE-036-314,
// GAP-FE-036-302 (P0). SÓ visível no create (contrato §4.1/§4.3 — parcelas
// são imutáveis quanto à posição/quantidade após a criação).
//
// NÃO copia `InvoiceInstallmentsTab.tsx`/`distributeEqually` inteiro — reusa
// só o cálculo de DATAS (`addDays`, idêntico ao molde) e o conceito de
// "Entrada". O algoritmo de VALOR é DELIBERADAMENTE diferente
// (`distributeWithoutReconciling`, Roteiro exato do Gap): cada parcela
// arredonda ISOLADA, o resíduo NÃO é reconciliado na última posição — a soma
// PODE divergir do total dentro da tolerância `count * 0.01`, mesma
// tolerância validada no backend (`StoreIncomeAction::assertInstallmentsMatchTotal`).
// NÃO "corrigir" essa divergência — é fidelidade ao legado, não bug.
//
// `totalAmount` (prop) é o campo `amount` da aba "Dados" — no CREATE, esse
// campo representa o TOTAL do título (o backend divide entre as N linhas
// `Income` geradas; cada linha nasce com seu próprio `amount` = valor da
// parcela, não o total).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';

import type { IncomeForm as IncomeFormType, IncomeInstallmentForm } from '@/@types/v2/Incomes';

// REAPROVEITAR literalmente (idêntico ao legado e ao molde de Invoice) —
// intervalo fixo em dias a partir da 1ª data, NÃO preserva mesmo dia do mês.
function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// NÃO reaproveitar `distributeEqually` de Invoice — variante SEM
// reconciliação (GAP-FE-036-302): nenhum ajuste de resíduo na última
// posição. A soma PODE divergir do total, dentro da tolerância validada
// pelo backend (`count * 0.01`) — comportamento INTENCIONAL.
function distributeWithoutReconciling(total: number, count: number): number[] {
  if (count <= 0) return [];
  const share = Math.round((total / count) * 100) / 100;
  return new Array(count).fill(share);
}

export interface IncomeInstallmentsTabProps {
  control: Control<IncomeFormType>;
  errors: FieldErrors<IncomeFormType>;
  watch: UseFormWatch<IncomeFormType>;
  setValue: UseFormSetValue<IncomeFormType>;
  isLoading: boolean;
  canSave: boolean;
  totalAmount: number;
}

export function IncomeInstallmentsTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  totalAmount,
}: IncomeInstallmentsTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.incomes.income.form.installmentsTab;

  const { fields, replace, remove } = useFieldArray({ control, name: 'installments' });

  const isDisabled = !canSave || isLoading;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const hasDownPayment = watch('has_down_payment');
  const downPaymentDate = watch('down_payment_date');
  const downPaymentValue = watch('down_payment_value');
  const qtdInstallments = watch('qtd_installments') || 0;
  const firstDueDate = watch('first_due_date');
  const intervalDays = watch('interval_days') || 0;

  function doGenerate() {
    const rows: IncomeInstallmentForm[] = [];

    if (hasDownPayment && downPaymentDate && downPaymentValue !== null) {
      rows.push({ due_date: downPaymentDate, value: Number(downPaymentValue) });
    }

    const remaining =
      Number(totalAmount || 0) - (hasDownPayment ? Number(downPaymentValue || 0) : 0);
    const shares = distributeWithoutReconciling(remaining, qtdInstallments);

    shares.forEach((value, index) => {
      rows.push({
        due_date: firstDueDate ? addDays(firstDueDate, index * intervalDays) : null,
        value,
      });
    });

    replace(rows);
    setIsConfirmOpen(false);
  }

  function handleGenerateClick() {
    if (fields.length > 0) {
      setIsConfirmOpen(true);
    } else {
      doGenerate();
    }
  }

  const watchedInstallments = watch('installments') ?? [];
  const sum = watchedInstallments.reduce((acc, item) => acc + (Number(item?.value) || 0), 0);
  // Badge NÃO usa `sum === total` (falso binário) — dentro da tolerância
  // `count * 0.01` já é "completo" (GAP-FE-036-302).
  const isSumComplete =
    watchedInstallments.length === 0 ||
    Math.abs(sum - Number(totalAmount || 0)) <= watchedInstallments.length * 0.01;

  const arrayError = (errors.installments as any)?.message as string | undefined;

  return (
    <Box pt={4}>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.sectionHint}
      </Text>

      <Flex gap={4} wrap="wrap" mb={4} align="flex-end">
        <Field label={text.hasDownPayment}>
          <Switch
            checked={!!hasDownPayment}
            onCheckedChange={(d: { checked: boolean }) => setValue('has_down_payment', d.checked)}
            disabled={isDisabled}
          />
        </Field>

        {hasDownPayment && (
          <>
            <Controller
              name="down_payment_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field label={text.downPaymentDate}>
                  <DateInput value={value} onChange={onChange} disabled={isDisabled} />
                </Field>
              )}
            />
            <Controller
              name="down_payment_value"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <MoneyInput
                  name={name}
                  label={text.downPaymentValue}
                  value={value}
                  onValueChange={onChange}
                  disabled={isDisabled}
                />
              )}
            />
          </>
        )}
      </Flex>

      <Flex gap={4} wrap="wrap" mb={4} align="flex-end">
        <Controller
          name="qtd_installments"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <NumberInput
              name={name}
              label={text.qtdInstallments}
              value={value}
              onValueChange={(v) => onChange(v ?? 1)}
              min={1}
              disabled={isDisabled}
            />
          )}
        />
        <Controller
          name="first_due_date"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Field label={text.firstDueDate}>
              <DateInput value={value} onChange={onChange} disabled={isDisabled} />
            </Field>
          )}
        />
        <Controller
          name="interval_days"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <NumberInput
              name={name}
              label={text.intervalDays}
              value={value}
              onValueChange={(v) => onChange(v ?? 30)}
              min={0}
              disabled={isDisabled}
            />
          )}
        />
        <Button
          title={text.generateButton}
          variant="outline"
          onClick={handleGenerateClick}
          disabled={isDisabled}
        />
      </Flex>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.sumLabel}
        </Text>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {sum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Badge>
            <Text fontSize="xs" color="fg.muted">
              ({text.sumHint})
            </Text>
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
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>
              <IconButtonTable
                aria-label={text.removeRowLabel}
                mensegerTooltip={text.removeRowLabel}
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

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={doGenerate}
        title={text.regenerateConfirmTitle}
        description={text.regenerateConfirmDescription}
        confirmButtonText={text.generateButton}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}
