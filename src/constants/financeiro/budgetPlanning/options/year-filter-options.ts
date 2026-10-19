// src/constants/financeiro/budgetPlanning/options/year-filter-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções de ano do filtro de listagem (`FilterSideBudgetPlanning`,
// contrato de tela §6) e do form do Relatório Previsto×Realizado (§9) —
// BudgetPlanning, F-106, esteira 97-Esteiras/067, TASK-PO-FE-03.
//
// Sem tradução aplicável (rótulo = o próprio ano) — exceção documentada
// (get_pwa_constants_and_mappers_pattern §3.3, "Fábrica SEM tradução").
// Janela: ano corrente −5 até ano corrente +1 (decisão do Executor — ver
// "Teste do dev" da Tarefa, o dono pode ajustar a janela depois).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

const YEARS_BACK = 5;
const YEARS_FORWARD = 1;

export const budgetPlanningYearFilterOptions = (
  referenceYear: number = new Date().getFullYear()
): Option<number>[] =>
  Array.from({ length: YEARS_BACK + YEARS_FORWARD + 1 }, (_, index) => {
    const year = referenceYear + YEARS_FORWARD - index;
    return { label: String(year), value: year };
  });
