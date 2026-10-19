// src/constants/relatorios/weighing-stock-client-report/options/weighing-stock-client-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Pesagem/Armazém/Cliente"
// (F-337, execução 059) — mirror EXATO de `stock-abc-report-format-options.ts`,
// mas com domínio e i18n PRÓPRIOS deste módulo:
// `WeighingStockClientReportFormat = 'pdf' | 'xlsx'` (NUNCA reusar
// `StockAbcReportFormat`, cujo domínio é `'pdf' | 'excel'` — chave/valor
// diferentes do FormRequest desta feature).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { WeighingStockClientReportFormat } from '@/@types/v2/WeighingStockClientReport';

const labels = (languageGB: LanguageDate): Map<WeighingStockClientReportFormat, string> => {
  const dictionary = languageGB.weighingStockClientReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: WeighingStockClientReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: WeighingStockClientReportFormat,
  languageGB: LanguageDate
): Option<WeighingStockClientReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<WeighingStockClientReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const weighingStockClientReportFormatOptions = { getLabel, getOption, options };
