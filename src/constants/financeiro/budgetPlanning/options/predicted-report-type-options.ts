// src/constants/financeiro/budgetPlanning/options/predicted-report-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` do Relatório Previsto×Realizado
// (BudgetPlanning — F-106, esteira 97-Esteiras/067, TASK-PO-FE-03) —
// padrão canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror EXATO
// `expensePaymentTypeOptions`.
//
// `type` é string-backed (`pdf`|`xlsx`, `BudgetPlanningPredictedReportRequest`
// real, contrato de tela §9) — sem "Todas" (`GAP-PO-04`, ver §12 do contrato
// de tela: sem seletor de fazenda no relatório).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BudgetPlanningPredictedReportType } from '@/@types/v2/Financeiro/budgetPlanning';

const labels = (languageGB: LanguageDate): Map<BudgetPlanningPredictedReportType, string> => {
  const dictionary = languageGB.financial.budgetPlanning.predictedReport;
  return new Map([
    ['pdf', dictionary.typePdf],
    ['xlsx', dictionary.typeXlsx],
  ]);
};

const getLabel = (value: BudgetPlanningPredictedReportType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: BudgetPlanningPredictedReportType,
  languageGB: LanguageDate
): Option<BudgetPlanningPredictedReportType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<BudgetPlanningPredictedReportType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const predictedReportTypeOptions = { getLabel, getOption, options };
