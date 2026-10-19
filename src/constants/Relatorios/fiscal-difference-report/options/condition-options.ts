// src/constants/relatorios/fiscal-difference-report/options/condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` do relatório "Fiscal/Não Fiscal"
// (F-266, lote 076) — mirror EXATO de `is-fiscal-options.ts`/
// `report-format-options.ts`. `'S'` (Sem Categoria) é o default do servidor
// (`FiscalDifferenceReportFilterData::$condition = 'S'`, contrato §4.2) —
// listado primeiro. `'C'` (Com Categoria) adiciona 3 colunas extras e explode
// linha por pivot (contrato §4.3).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { FiscalDifferenceReportCondition } from '@/@types/v2/FiscalDifferenceReport';

const labels = (languageGB: LanguageDate): Map<FiscalDifferenceReportCondition, string> => {
  const dictionary = languageGB.fiscalDifferenceReport.report.conditionOptions;
  return new Map([
    ['S', dictionary.withoutCategory],
    ['C', dictionary.withCategory],
  ]);
};

const getLabel = (value: FiscalDifferenceReportCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FiscalDifferenceReportCondition,
  languageGB: LanguageDate
): Option<FiscalDifferenceReportCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FiscalDifferenceReportCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const fiscalDifferenceReportConditionOptions = { getLabel, getOption, options };
