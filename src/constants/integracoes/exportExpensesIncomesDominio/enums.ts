// src/constants/integracoes/exportExpensesIncomesDominio/enums.ts
// Enums fiéis ao legado da tela "Exportação Domínio — Contas a
// Pagar/Receber" (F-118, Integrações, irmã do canário F-119). Consumidos
// pelas fábricas de opções em `./options/` (get_pwa_constants_and_mappers_pattern
// §3.2) — NUNCA literal solto no `.tsx` (severidade INVIOLÁVEL).

/** `status` (LK-05, 8 opções, ordem 1..8, fiel a `Expense::opStatus`). As 8
 *  opções são oferecidas SEMPRE (fidelidade ao legado); o server responde
 *  422 quando `type=Receber` + status incompatível (GAP-118-01, backend). */
export const expenseIncomeStatus = {
  aVencer: 1,
  vencido: 2,
  baixaParcial: 3,
  baixado: 4,
  adiantPendente: 5,
  adiantBaixado: 6,
  faturaPendente: 7,
  faturaBaixado: 8,
} as const;

export type ExpenseIncomeStatus = (typeof expenseIncomeStatus)[keyof typeof expenseIncomeStatus];

/** `type` (FLD-09, ÚNICO campo obrigatório): 1=Pagar/Expense, 2=Receber/
 *  Income. Decide a entidade exportada NO SERVIDOR — a tela é a mesma para
 *  os dois. Sem opção vazia (fidelidade: 1ª opção real já é "Contas a
 *  Pagar"). */
export const expenseIncomeType = {
  expense: 1,
  income: 2,
} as const;

export type ExpenseIncomeType = (typeof expenseIncomeType)[keyof typeof expenseIncomeType];
