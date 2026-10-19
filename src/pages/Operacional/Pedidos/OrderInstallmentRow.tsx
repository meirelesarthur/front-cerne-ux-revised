// src/pages/Operacional/Pedidos/OrderInstallmentRow.tsx
// -----------------------------------------------------------------------------
// Linha do cronograma de parcelas editável do Pedido (Order — Operacional /
// Vendas, F-051, 97-Esteiras/043, PED-FE-05). Consumida por
// `OrderPaymentsEditor.tsx` (`installmentFields.map`, `useFieldArray({
// control, name: 'installment_details.installments' })` DECLARADO NO PAI —
// ao contrário de `BudgetPaymentRow`, aqui não há um NÍVEL de linha
// aninhado extra (o bloco de pagamento do Pedido é ÚNICO, não repetível como
// `Budgets.payments[]`), então o `useFieldArray` do cronograma já vive no
// próprio editor, e esta linha é 100% apresentacional (F-028/F-029).
//
// Sem botão de remover linha — o cronograma é DERIVADO de `installments`
// (nº de parcelas, F-024) via `calcInstallments`; a única edição manual
// possível é o VALOR de uma parcela (IG-013, `adjustInstallmentsDifference`,
// tratado no PAI) e a DATA (IG-011/012, sem recompute automático — mirror
// `BudgetPaymentRow.handleInstallmentDateChange`).
//
// IG-014 — Enter no campo de valor = blur sem submit (o componente está
// dentro do `<form>` do avô; sem `preventDefault` + `blur()` explícitos, o
// Enter dispararia o submit do formulário inteiro).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { DateInput } from '@/components/DateInput';
import { MoneyInput } from '@/components/Form/MoneyInput';

export interface OrderInstallmentRowProps {
  /** Índice da linha dentro de `installment_details.installments`. */
  index: number;
  date: string | null;
  value: number | null;
  onDateChange: (index: number, value: string | null) => void;
  /** IG-013 — reconciliação de soma via `adjustInstallmentsDifference`
   *  (feita no PAI, que decide aceitar ou recusar com toast). */
  onValueChange: (index: number, value: number) => void;
  disabled?: boolean;
  /** T2 (Onda G, execução 065) — erro de validação por linha
   *  (`installment_details.installments[i].date`/`.value`,
   *  `order-schema.ts`, IG-017/F-028/F-029). Antes desta correção esta era
   *  a ÚNICA superfície do form genuinamente silenciosa: nenhum input aqui
   *  renderizava `error`, então uma reprovação do cronograma não tinha
   *  NENHUM feedback visível (nem com o `onInvalid` do T1, que só rola/foca
   *  — precisa do texto na própria linha). */
  error?: { date?: string; value?: string };
}

export function OrderInstallmentRow({
  index,
  date,
  value,
  onDateChange,
  onValueChange,
  disabled = false,
  error,
}: OrderInstallmentRowProps) {
  // IG-014 — Enter = blur sem submit (o `<input>` mascarado do `MoneyInput`
  // vive dentro do `<form id="order-form">` do avô; sem isto o Enter
  // dispararia `handleSubmit(onSubmit)` no meio da digitação da parcela).
  function handleValueKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="140px">
        <DateInput
          value={date ?? null}
          onChange={(nextValue) => onDateChange(index, nextValue)}
          disabled={disabled}
        />
        {error?.date && (
          <Text fontSize="xs" color="fg.error" mt={1}>
            {error.date}
          </Text>
        )}
      </Box>
      <Box flex="1" minW="140px">
        <MoneyInput
          name={`installment_details.installments.${index}.value`}
          value={value ?? null}
          onValueChange={(nextValue) => onValueChange(index, nextValue)}
          onKeyDown={handleValueKeyDown}
          disabled={disabled}
          error={error?.value}
        />
      </Box>
    </Flex>
  );
}

export default OrderInstallmentRow;
