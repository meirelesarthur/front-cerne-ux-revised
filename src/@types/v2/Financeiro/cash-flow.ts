// src/@types/v2/Financeiro/cash-flow.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Fluxo Bancário" (F-107, esteira 070, TASK-CF-FE-01).
// Payload plano (ApiResponse::success), NÃO paginado — mirror
// F-107-fluxo-bancario-frontend-contract.md §1 (Risco 1) + api-contract.md §4.4.
//
// `CashFlowFilterParams` é o shape JÁ ACHATADO (pós `toRequestFilter`) que a
// API espera (`accounts[]`/`period`/`type`/`start_date`/`end_date`) — o shape
// do FORM (RHF, `accounts` como `Option<string>[]`) vive em
// `src/pages/Financeiro/CashFlow/index.tsx` (mirror
// `AccountReconciliationReportFilterForm` local a `RelatorioConsolidado`).
// -----------------------------------------------------------------------------

export interface CashFlowMovement {
  date: string;
  note: string | null;
  type: 'E' | 'S';
  value: number;
}

export interface CashFlowBucket {
  date: string;
  incomes: number;
  expenses: number;
  balance_day: number;
  balance: number;
  // Só presente quando `type=analytical` (drill-down embutido, SUR-16/17 —
  // sem 2ª chamada para o modal de movimentações).
  movements?: CashFlowMovement[];
}

export interface CashFlowReport {
  start_balance: number;
  buckets: CashFlowBucket[];
  balance_accounts: number;
  balance_cashier: number;
  income_expense_result: { incomes: number; expenses: number };
  total: { incomes: number; expenses: number; balance_day: number; balance: number };
}

export type CashFlowPeriod = 'diary' | 'monthly' | 'yearly';
export type CashFlowType = 'synthetic' | 'analytical';

export interface CashFlowFilterParams {
  accounts?: string[];
  period?: CashFlowPeriod;
  type?: CashFlowType;
  start_date?: string;
  end_date?: string;
}
