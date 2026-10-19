// src/pages/Operacional/Budget/BudgetPaymentsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de PAGAMENTOS do formulário de CRIAÇÃO/EDIÇÃO de Orçamento (Budget —
// Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-04). Consumido por
// `CreateOrUpdateBudget.tsx` (campo `payments` de `BudgetForm`), montado
// abaixo de `<BudgetItemsEditor>` no MESMO `<Form>` (mesmo `useForm<BudgetForm>`
// da fundação `TASK-BG-FE-01`/`TASK-BG-FE-03`).
//
// Moldura (`useFieldArray({ control, name: 'payments' })`, mesmo nível de
// `items`) — mirror ESTRUTURAL de `RequestQuotationPublicPaymentRow.tsx`
// (Público/RequestQuotation) quanto à casca (título + botão adicionar +
// estado vazio + linhas), com o rodapé de conferência Σ`payments.total` ×
// total do orçamento (Badge, mirror `MovementPurchaseInstallmentsSection`) —
// indicativo, NÃO bloqueia submit (o servidor já valida essa soma,
// `GAP-BG-04`; a UI só reduz a chance de 422).
//
// A COMPLEXIDADE (bloco financeiro de parcelamento, `useFieldArray` aninhado)
// vive em `BudgetPaymentRow.tsx` — mirror `RequisitionItemRow`/`BudgetItemRow`
// quanto ao princípio "hooks de linha vivem na linha".
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { LanguageDate } from '@/@types/language';
import type { BudgetForm, BudgetPaymentForm } from '@/@types/v2/Budgets';

import { BudgetPaymentRow } from './BudgetPaymentRow';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface BudgetPaymentsFieldValues {
  payments: BudgetPaymentForm[];
}

export interface BudgetPaymentsEditorProps {
  /** `control` do `useForm` do formulário PAI (`BudgetForm`, TASK-BG-FE-03). */
  control: Control<BudgetForm>;
  /** `fields` do `useFieldArray({ control, name: 'payments' })` do PAI. */
  fields: FieldArrayWithId<BudgetPaymentsFieldValues, 'payments', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<BudgetPaymentsFieldValues, 'payments'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<BudgetForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

function emptyPaymentRow(dueDate: string): BudgetPaymentForm {
  return {
    payment_method: null,
    installments: 1,
    interval: 0,
    due_date: dueDate,
    amount: null,
    total: 0,
    installment_details: null,
  };
}

export function BudgetPaymentsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: BudgetPaymentsEditorProps) {
  const text = languageGB.budgets.budget;
  const paymentText = text.form.fields.payment;

  // Cast local (não vaza na API pública) — mesmo racional do irmão
  // `BudgetItemsEditor` (`genericControl`).
  const genericControl = control as unknown as Control<BudgetPaymentsFieldValues>;

  const arrayError = (errors as any)?.payments?.message as string | undefined;

  // IG-08/09 — `date` do orçamento, repassado à linha para o sincronismo
  // bidirecional `interval`<->`due_date` (mirror do racional já registrado
  // no Roteiro).
  const budgetDate = useWatch({ control, name: 'date' }) || null;

  // Rodapé de conferência Σ`payments.total` × total do orçamento — mesmo
  // racional de duplicação de cálculo já aceito nesta feature entre
  // `BudgetItemsEditor` (Σ itens no seu próprio cabeçalho) e
  // `BudgetFooterTotals` (subtotal/total do rodapé do form), Lei 4 (não é
  // estado, é `useWatch` derivado).
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;
  const budgetTotal = roundTo2(
    watchedItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity) || 0;
      const amount = Number(item?.amount) || 0;
      const discount = Number(item?.discount) || 0;
      return sum + roundTo2(quantity * amount - discount);
    }, 0) + freight
  );

  const watchedPayments = useWatch({ control: genericControl, name: 'payments' }) ?? [];
  const paymentsTotal = roundTo2(
    watchedPayments.reduce((sum, payment) => sum + (Number(payment?.total) || 0), 0)
  );
  const isSumComplete = Math.abs(paymentsTotal - budgetTotal) <= 0.01;

  function handleAdd() {
    append(emptyPaymentRow(budgetDate || ''));
  }

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {paymentText.sectionTitle}
        </Text>

        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {paymentText.sumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(paymentsTotal)} / {formatCurrencyBRL(budgetTotal)}
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({paymentText.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || paymentText.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={5} mb={4}>
          {fields.map((field, index) => (
            <BudgetPaymentRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              budgetDate={budgetDate}
              errors={errors}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={paymentText.addPayment}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default BudgetPaymentsEditor;
