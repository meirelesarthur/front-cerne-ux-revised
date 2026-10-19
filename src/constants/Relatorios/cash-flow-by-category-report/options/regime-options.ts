// src/constants/relatorios/cash-flow-by-category-report/options/regime-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `group` (Regime — 'C' Caixa / 'O' Competência),
// relatório "Fluxo de Caixa Mensal" (F-240, esteira 97-Esteiras/053). Catálogo
// LOCAL (`CostCenterRegimeEnum` reutilizado tal qual no backend, 2 valores
// fixos), mirror EXATO de `cost-center-report/options/regime-options.ts` —
// LOCAL a este módulo por convenção (regime é sempre catálogo por-relatório,
// não compartilhado entre telas).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { CashFlowByCategoryReportGroup } from '@/@types/v2/CashFlowByCategoryReport';

const labels = (languageGB: LanguageDate): Map<CashFlowByCategoryReportGroup, string> => {
  const dictionary = languageGB.cashFlowByCategoryReport.report.regimeOptions;
  return new Map([
    ['C', dictionary.cash],
    ['O', dictionary.accrual],
  ]);
};

const getLabel = (value: CashFlowByCategoryReportGroup, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: CashFlowByCategoryReportGroup,
  languageGB: LanguageDate
): Option<CashFlowByCategoryReportGroup> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CashFlowByCategoryReportGroup>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const cashFlowByCategoryReportRegimeOptions = { getLabel, getOption, options };
