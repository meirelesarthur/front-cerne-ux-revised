// src/utils/expense-guards.ts
// -----------------------------------------------------------------------------
// Guarda de imutabilidade client-side de Expense (Contas a Pagar, esteira
// 036, TASK-FE-036-106/107/109) — PROXY de UX, nunca a fonte de verdade. O
// backend (`UpdateExpenseAction::guardImmutableFieldsUnchanged()`) revalida
// no PUT e rejeita com 422 qualquer divergência real; este helper só evita
// que o usuário preencha campos que seriam rejeitados.
//
// Fórmula EXATA do backend (`ExpenseRepositoryInterface::hasExpenseMoved()`,
// `amount != balance`) — comparada aqui em CENTAVOS INTEIROS
// (`Math.round(x * 100)`) para evitar divergência de ponto flutuante entre
// o `number` do JS e o `decimal(11,2)` do Postgres (GAP-FE-036-106).
//
// Único ponto de verdade client-side — TODA aba que precisa da guarda
// (Cabeçalho, Rateio, `dt_emission`) consome esta função, nunca reimplementa
// a comparação (GAP-FE-036-109).
//
// `isExpenseEligibleForNewWriteOff` (AM08, TASK-FE-036-118) — extraída de
// `pages/Financeiro/ContasAPagar/index.tsx` (era local/inline) para
// TASK-FE-036-119 (Onda 3 sub-onda 3b, baixa EM LOTE) poder reaproveitar a
// MESMA fórmula sem duplicá-la — mirror EXATO do `action_manifest` legado:
// "Nova baixa" exige `balance>0` E (`payment_type` fora de {4,5} OU o título
// ainda não tem NENHUMA baixa ativa). Único ponto de verdade client-side para
// esta condição — NUNCA reimplementar a fórmula em outro arquivo.
// -----------------------------------------------------------------------------

export interface ExpenseMovedGuardInput {
  amount: number;
  balance: number;
}

export function hasExpenseMoved(expense: ExpenseMovedGuardInput): boolean {
  return Math.round(expense.balance * 100) !== Math.round(expense.amount * 100);
}

export interface ExpenseWriteOffEligibilityInput {
  balance: number;
  payment_type: number | null;
  write_offs?: unknown[];
}

// `true` quando a linha é Adiantamento (4) ou Fatura (5) — mesmo par de
// `payment_type` usado em `isRowSelectable` (exclusão em lote) e nas guardas
// AM12/AM13 do menu de ações de `ContasAPagar/index.tsx`.
export function isExpenseAdvanceOrInvoice(
  item: Pick<ExpenseWriteOffEligibilityInput, 'payment_type'>
): boolean {
  return item.payment_type === 4 || item.payment_type === 5;
}

export function isExpenseEligibleForNewWriteOff(item: ExpenseWriteOffEligibilityInput): boolean {
  const hasActiveWriteOff = (item.write_offs ?? []).length > 0;
  return item.balance > 0 && (!isExpenseAdvanceOrInvoice(item) || !hasActiveWriteOff);
}
