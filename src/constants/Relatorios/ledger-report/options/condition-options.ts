// src/constants/relatorios/ledger-report/options/condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` (Condição — 'S' Sem Categoria / 'C'
// Com Categoria), relatório "Livro Razão" (F-274, 97-Esteiras/008,
// TASK-FE-LR-01). Catálogo LOCAL (`LedgerConditionEnum` não tem `/options` na
// API), mirror EXATO de `cost-center-report/options/regime-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { LedgerReportCondition } from '@/@types/v2/LedgerReport';

const labels = (languageGB: LanguageDate): Map<LedgerReportCondition, string> => {
  const dictionary = languageGB.ledgerReport.report.conditionOptions;
  return new Map([
    ['S', dictionary.withoutCategory],
    ['C', dictionary.withCategory],
  ]);
};

const getLabel = (value: LedgerReportCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: LedgerReportCondition,
  languageGB: LanguageDate
): Option<LedgerReportCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<LedgerReportCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const ledgerReportConditionOptions = { getLabel, getOption, options };
