// src/constants/relatorios/accumulated-income-statement-report/options/report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` (CLIENT-SIDE apenas — decide qual dos
// 2 endpoints é chamado, NUNCA vai na querystring, plano §2.4) do relatório
// F-217 Custo de Produção Acumulado — mirror EXATO de
// `accounts-reports/options/report-format-options.ts`, domínio fixo
// `'pdf' | 'excel'` (2 rotas de download dedicadas).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccumulatedIncomeStatementReportFormat } from '@/@types/v2/AccumulatedIncomeStatementReport';

const labels = (languageGB: LanguageDate): Map<AccumulatedIncomeStatementReportFormat, string> => {
  const dictionary = languageGB.accumulatedIncomeStatementReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (
  value: AccumulatedIncomeStatementReportFormat,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: AccumulatedIncomeStatementReportFormat,
  languageGB: LanguageDate
): Option<AccumulatedIncomeStatementReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccumulatedIncomeStatementReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportFormatOptions = { getLabel, getOption, options };
