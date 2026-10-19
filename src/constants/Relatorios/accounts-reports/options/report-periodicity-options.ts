// src/constants/relatorios/accounts-reports/options/report-periodicity-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `periodicity` (`0` Geral / `1` Diário) — só nos
// relatórios "em aberto" (F-262/F-292, esteira 97-Esteiras/050,
// TASK-050-FE-00), mirror EXATO de `report-format-options.ts`. F-291/F-271
// (títulos já baixados) NÃO têm este campo — a rota nem o aceita.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ReportPeriodicity } from '@/@types/v2/AccountsReports';

const labels = (languageGB: LanguageDate): Map<ReportPeriodicity, string> => {
  const dictionary = languageGB.accountsReports.shared.periodicityOptions;
  return new Map([
    [0, dictionary.general],
    [1, dictionary.daily],
  ]);
};

const getLabel = (value: ReportPeriodicity, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ReportPeriodicity,
  languageGB: LanguageDate
): Option<ReportPeriodicity> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ReportPeriodicity>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportPeriodicityOptions = { getLabel, getOption, options };
