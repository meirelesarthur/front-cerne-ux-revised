// src/constants/relatorios/accounts-reports/options/report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` compartilhado pelas 4 telas de
// relatório de Contas (Financeiro, esteira 97-Esteiras/050, TASK-050-FE-00)
// — mirror EXATO de `classification-options.ts` (`Map` alimentado por
// `languageGB`, domínio fixo `'pdf' | 'xlsx'` de todos os 4 endpoints).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const labels = (languageGB: LanguageDate): Map<ReportFormat, string> => {
  const dictionary = languageGB.accountsReports.shared.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: ReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: ReportFormat, languageGB: LanguageDate): Option<ReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportFormatOptions = { getLabel, getOption, options };
