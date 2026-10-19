// src/constants/relatorios/financial-movement-report/options/condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` do relatório "Movimento Bancário"
// (F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01). Domínio fixo
// `'S' | 'C'` (Sem/Com Categoria — contrato legado SR-10/mode matrix §7),
// mirror `report-format-options.ts` (Map alimentado por `languageGB`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { FinancialMovementCondition } from '@/@types/v2/FinancialMovementReport';

const labels = (languageGB: LanguageDate): Map<FinancialMovementCondition, string> => {
  const dictionary = languageGB.financialMovementReport.report.conditionOptions;
  return new Map([
    ['S', dictionary.withoutCategory],
    ['C', dictionary.withCategory],
  ]);
};

const getLabel = (value: FinancialMovementCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FinancialMovementCondition,
  languageGB: LanguageDate
): Option<FinancialMovementCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FinancialMovementCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const financialMovementConditionOptions = { getLabel, getOption, options };
