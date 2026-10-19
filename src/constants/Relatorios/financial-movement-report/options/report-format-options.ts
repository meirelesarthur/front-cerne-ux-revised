// src/constants/relatorios/financial-movement-report/options/report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` do relatório "Movimento Bancário"
// (F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01) — mirror EXATO de
// `relatorios/accounts-reports/options/report-format-options.ts`, dicionário
// LOCAL a este módulo (`financialMovementReport.report.formatOptions`, não
// `accountsReports.shared` — esta tela não pertence ao módulo
// `accountsReports`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { FinancialMovementReportFormat } from '@/@types/v2/FinancialMovementReport';

const labels = (languageGB: LanguageDate): Map<FinancialMovementReportFormat, string> => {
  const dictionary = languageGB.financialMovementReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: FinancialMovementReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FinancialMovementReportFormat,
  languageGB: LanguageDate
): Option<FinancialMovementReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FinancialMovementReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const financialMovementReportFormatOptions = { getLabel, getOption, options };
