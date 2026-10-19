// src/@types/v2/Dashboards/financialDashboard/index.d.ts
// Tipos da dashboard Financeiro (execução 048, TASK-04-FE). Filtro real é
// `month`/`year`/`cost_center_uuid`.
//
// **DEC-191 — heatmap de receita por hora CORTADO**: não existe bloco
// correspondente aqui, de propósito — NÃO adicionar um campo para ele.
//
// **CORREÇÃO PÓS-E2E CRÍTICA (048):** shape abaixo RECONCILIADO byte-a-byte
// contra o payload REAL capturado do ambiente rodando
// (`GB.Cerne.FrontEnd/e2e/_048-dash/financeiro.json`, `body.data`):
// 1. `by_category.{incomes,expenses}[]` é `{category_uuid,category,grouper,total}`
//    — NÃO `{category,value}` (campo antigo especulativo `value` nunca
//    existiu, causava `DonutChart` em branco, mesma causa-raiz do bug já
//    corrigido na Pecuária).
// 2. `twelve_months[].month` é STRING `"YYYY-MM"` (ex. `"2025-10"`) — NÃO
//    `number` (1-12). Formatar direto (`${row.month}-01`), nunca
//    `padStart` sobre um valor que já é string completa.
// 3. `budget` é uma ÁRVORE completa (relatório de orçamento previsto×realizado
//    por categoria, `GetBudgetPlanningPredictedReportAction` reusada) — NÃO
//    o objeto simples `{predicted,realized,variance_percent}` assumido. O
//    gauge "Orçamento anual" soma `months[].predicted`/`.realized` de
//    TODOS os grupos (`budget.groups[]`, que já vêm com totais agregados
//    por grupo, sem precisar descer a `children[]`).
// 4. `due_soon[]`/`overdue.items[]` têm `uuid` (usar como key React, não
//    `${due_date}-${index}`).
// 5. `by_cost_center[]` tem `cost_center_uuid` (usar como key React, não
//    `row.cost_center` — nome pode repetir).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/** Forma INTERNA do filtro (Option-based) — mesmo racional de `AssetsDashboardFilterForm`. */
export interface FinancialDashboardFilterForm {
  year: Option<number> | null;
  month: Option<number> | null;
  costCenter: Option<string> | null;
}

export interface FinancialDashboardFilterRequest {
  year?: number;
  month?: number;
  cost_center_uuid?: string;
}

export interface FinancialMonthSummary {
  incomes: number;
  expenses: number;
  balance: number;
}

/** `month` é `"YYYY-MM"` (string), não um número 1-12. */
export interface FinancialTwelveMonthRow {
  month: string;
  incomes: number;
  expenses: number;
}

export interface FinancialCategoryRow {
  category_uuid: string;
  category: string;
  grouper: string | null;
  total: number;
}

export interface FinancialByCategory {
  incomes: FinancialCategoryRow[];
  expenses: FinancialCategoryRow[];
}

export interface FinancialBudgetCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

export interface FinancialBudgetMonthRow {
  month: number;
  predicted: number;
  realized: number;
  balance: number;
}

export interface FinancialBudgetChild {
  category: FinancialBudgetCategoryRef;
  months: FinancialBudgetMonthRow[];
  accumulated: number[];
}

/** Grupo já vem com `months`/`accumulated` PRÓPRIOS (agregados de `children[]`) — não precisa somar `children` para o total do grupo. */
export interface FinancialBudgetGroup {
  parent: FinancialBudgetCategoryRef;
  children: FinancialBudgetChild[];
  months: FinancialBudgetMonthRow[];
  accumulated: number[];
}

/** Árvore completa do orçamento anual (REUSO de `GetBudgetPlanningPredictedReportAction`). */
export interface FinancialBudget {
  year: number;
  balance_label: string;
  farm: {
    uuid: string;
    name: string;
  };
  groups: FinancialBudgetGroup[];
}

export type FinancialDueSoonType = 'expense' | 'income';

export interface FinancialDueSoonRow {
  type: FinancialDueSoonType;
  uuid: string;
  due_date: string;
  amount: number;
  description: string | null;
}

export interface FinancialOverdue {
  payable_total: number;
  receivable_total: number;
  items: FinancialDueSoonRow[];
}

export interface FinancialByCostCenterRow {
  cost_center_uuid: string;
  cost_center: string;
  incomes: number;
  expenses: number;
  balance: number;
}

export interface FinancialDashboardData {
  month_summary: FinancialMonthSummary;
  twelve_months: FinancialTwelveMonthRow[];
  by_category: FinancialByCategory;
  budget: FinancialBudget;
  due_soon: FinancialDueSoonRow[];
  overdue: FinancialOverdue;
  by_cost_center: FinancialByCostCenterRow[];
  meta?: DashboardMeta;
}
