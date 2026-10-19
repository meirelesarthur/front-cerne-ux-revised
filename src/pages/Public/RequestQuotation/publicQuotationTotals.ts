// src/pages/Public/RequestQuotation/publicQuotationTotals.ts
// -----------------------------------------------------------------------------
// Cálculos e guardas do formulário PÚBLICO do fornecedor, iguais ao legado
// (`request-quotations/hash.blade.php`), em funções puras para teste unitário
// (T-081-FE-03):
//   - linha do item  = preço unitário (4 casas) x quantidade, em 2 casas;
//   - total geral    = soma das linhas;
//   - condição de pagamento: "Valor Total" = total geral (somente leitura) e
//     "Valor/Parcela" = total / parcelas, em 2 casas;
//   - "Adicionar" condição exige a linha anterior completa.
// O servidor recalcula tudo (T-081-API-08); aqui é só a exibição e o payload.
// -----------------------------------------------------------------------------

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

// Valor da linha: unitário (até 4 casas) x quantidade, arredondado em 2 casas.
export function lineAmount(unitaryValue: number | null | undefined, quantity: number): number {
  if (unitaryValue === null || unitaryValue === undefined || Number.isNaN(unitaryValue)) return 0;
  return round2(unitaryValue * quantity);
}

// Total geral: soma dos valores das linhas.
export function totalAmount(
  items: readonly { unitary_value: number | null | undefined; quantity: number }[]
): number {
  return round2(
    items.reduce((sum, item) => sum + lineAmount(item.unitary_value, item.quantity), 0)
  );
}

// Valor da parcela: total / parcelas, em 2 casas (0 sem parcelas válidas).
export function installmentAmount(total: number, installments: number | null | undefined): number {
  if (!installments || installments <= 0) return 0;
  return round2(total / installments);
}

interface PaymentRowLike {
  payment_method: unknown;
  installments: number | null | undefined;
  interval: number | null | undefined;
}

const isPaymentRowComplete = (row: PaymentRowLike | undefined): boolean =>
  !!row &&
  row.payment_method !== null &&
  row.payment_method !== undefined &&
  !!row.installments &&
  row.installments > 0 &&
  row.interval !== null &&
  row.interval !== undefined;

// `true` quando todas as condições existentes estão completas (pode adicionar outra).
export function canAddPaymentRow(rows: readonly (PaymentRowLike | undefined)[]): boolean {
  return rows.every(isPaymentRowComplete);
}
