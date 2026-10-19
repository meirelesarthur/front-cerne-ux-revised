// src/utils/expense-status.ts
// -----------------------------------------------------------------------------
// Status visual da listagem de Expense (Contas a Pagar, esteira 036,
// GAP-FE-036-108) — computado 100% no CLIENT, por linha, a partir de
// `amount`/`balance`/`due_date` já presentes no `ExpenseListItem`. O
// backend NÃO expõe um campo "status" explícito nem prioriza a ordenação
// por ele (`ExpenseIndexRequest` só aceita `sort`/`direction` genéricos) —
// redução CONSCIENTE de paridade com o legado (que ordenava globalmente por
// status via SQL), registrada no Gap: o badge é só informativo por linha,
// NUNCA filtrável/ordenável.
// -----------------------------------------------------------------------------

import { todayLocalIso } from '@/utils/localDate';

export type ExpenseStatusKey = 'paid' | 'partiallySettled' | 'overdue' | 'open';

export interface ExpenseStatusInput {
  amount: number;
  balance: number;
  due_date: string | null;
}

const EXPENSE_STATUS_COLOR: Record<ExpenseStatusKey, string> = {
  paid: 'green',
  partiallySettled: 'blue',
  overdue: 'red',
  open: 'gray',
};

export function computeExpenseStatus(expense: ExpenseStatusInput): ExpenseStatusKey {
  const amountCents = Math.round((expense.amount ?? 0) * 100);
  const balanceCents = Math.round((expense.balance ?? 0) * 100);

  if (balanceCents <= 0) return 'paid';
  if (balanceCents < amountCents) return 'partiallySettled';

  const today = todayLocalIso();
  if (expense.due_date && expense.due_date < today) return 'overdue';

  return 'open';
}

export function getExpenseStatusColor(status: ExpenseStatusKey): string {
  return EXPENSE_STATUS_COLOR[status];
}
