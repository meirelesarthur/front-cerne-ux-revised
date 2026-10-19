// src/constants/relatorios/tax-accounts-report/options/tax-accounts-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Contas Tributárias" (F-327,
// esteira 060) — mirror EXATO de
// `weighing-stock-client-report/options/weighing-stock-client-report-format-options.ts`.
// `TaxAccountsReportFormat = 'pdf' | 'xlsx'` — domínio PRÓPRIO deste módulo
// (não reusar outra fábrica de format).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { TaxAccountsReportFormat } from '@/@types/v2/TaxAccountsReport';

const labels = (languageGB: LanguageDate): Map<TaxAccountsReportFormat, string> => {
  const dictionary = languageGB.taxAccountsReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: TaxAccountsReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: TaxAccountsReportFormat,
  languageGB: LanguageDate
): Option<TaxAccountsReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<TaxAccountsReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const taxAccountsReportFormatOptions = { getLabel, getOption, options };
