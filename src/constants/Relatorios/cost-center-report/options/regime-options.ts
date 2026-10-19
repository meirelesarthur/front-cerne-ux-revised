// src/constants/relatorios/cost-center-report/options/regime-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `group` (Regime — 'C' Caixa / 'O' Competência),
// relatório "Centro de Custo" (F-247, esteira 97-Esteiras/052). Catálogo
// LOCAL (`CostCenterRegimeEnum`, 2 valores fixos), mirror EXATO de
// `report-periodicity-options.ts`/`classification-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { CostCenterReportRegime } from '@/@types/v2/CostCenterReport';

const labels = (languageGB: LanguageDate): Map<CostCenterReportRegime, string> => {
  const dictionary = languageGB.costCenterReport.report.regimeOptions;
  return new Map([
    ['C', dictionary.cash],
    ['O', dictionary.accrual],
  ]);
};

const getLabel = (value: CostCenterReportRegime, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: CostCenterReportRegime,
  languageGB: LanguageDate
): Option<CostCenterReportRegime> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CostCenterReportRegime>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const costCenterReportRegimeOptions = { getLabel, getOption, options };
