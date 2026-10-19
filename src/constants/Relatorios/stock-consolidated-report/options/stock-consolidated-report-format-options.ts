// src/constants/relatorios/stock-consolidated-report/options/stock-consolidated-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Estoque Consolidado" (F-323,
// feature_id e70b8cad, esteira 97-Esteiras/079) — mirror EXATO de
// `stock-abc-report-format-options.ts`, mas com domínio e i18n PRÓPRIOS
// deste módulo: `StockConsolidatedReportFormat = 'pdf' | 'excel'` (NUNCA
// reusar enum/fábrica de outro módulo de relatório).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { StockConsolidatedReportFormat } from '@/@types/v2/StockConsolidatedReport';

const labels = (languageGB: LanguageDate): Map<StockConsolidatedReportFormat, string> => {
  const dictionary = languageGB.stockConsolidatedReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: StockConsolidatedReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: StockConsolidatedReportFormat,
  languageGB: LanguageDate
): Option<StockConsolidatedReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<StockConsolidatedReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const stockConsolidatedReportFormatOptions = { getLabel, getOption, options };
