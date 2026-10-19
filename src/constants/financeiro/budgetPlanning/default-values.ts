// src/constants/financeiro/budgetPlanning/default-values.ts
// -----------------------------------------------------------------------------
// `defaultValues` do formulário de Prev. Orçamentária (BudgetPlanning —
// F-106, esteira 97-Esteiras/067, TASK-PO-FE-03), mirror
// `get_pwa_constants_and_mappers_pattern` §11.
//
// `rows` nasce vazio — populado 1x por `fillBudgetPlanningForm` em
// `CreateOrUpdateBudgetPlanning.tsx` a partir do universo de categorias
// elegíveis (`listEligibleBudgetPlanningCategories`, GAP-PO-08 resolvido).
// -----------------------------------------------------------------------------

import type { BudgetPlanningForm } from '@/@types/v2/Financeiro/budgetPlanning';

export const budgetPlanningFormDefaultValues: BudgetPlanningForm = {
  date: null,
  year: new Date().getFullYear(),
  rows: [],
};
