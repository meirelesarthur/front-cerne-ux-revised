// src/constants/Budgets/budget-status.ts
// Enum `status` de Orçamento (Budget — Operacional / Vendas, F-018,
// 97-Esteiras/054, TASK-BG-FE-01). Mirror EXATO de `App\Enums\BudgetStatus`
// (backend, int-backed) — 4 valores fechados (CB-08,
// `budgets-api-contract.md §4.5`): 1 aguardando envio, 2 enviado ao cliente,
// 3 confirmado (aprovado por hash), 9 negado.
//
// `budgetStatusColor` — sugestão visual do Executor (não é regra de
// negócio), mirror do padrão já usado em `requestQuotationStatusColor`.

export const budgetStatus = {
  aguardandoEnvio: 1,
  enviado: 2,
  confirmado: 3,
  negado: 9,
} as const;

export type BudgetStatus = (typeof budgetStatus)[keyof typeof budgetStatus];

export const budgetStatusColor: Record<BudgetStatus, string> = {
  1: 'gray',
  2: 'yellow',
  3: 'green',
  9: 'red',
};
