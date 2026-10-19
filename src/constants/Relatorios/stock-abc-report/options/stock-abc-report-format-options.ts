// src/constants/relatorios/stock-abc-report/options/stock-abc-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Curva ABC/Estoque" (F-322,
// esteira 97-Esteiras/077) — mirror EXATO de `report-format-options.ts`
// (`@/constants/Relatorios/accounts-reports/options`), mas com domínio e
// i18n PRÓPRIOS deste módulo: `StockAbcReportFormat = 'pdf' | 'excel'`
// (NUNCA reusar `ReportFormat`/`reportFormatOptions` de `AccountsReports`,
// cujo domínio é `'pdf' | 'xlsx'` — risco 1 do plano front).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { StockAbcReportFormat } from '@/@types/v2/StockAbcReport';

const labels = (languageGB: LanguageDate): Map<StockAbcReportFormat, string> => {
  const dictionary = languageGB.stockAbcReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: StockAbcReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: StockAbcReportFormat,
  languageGB: LanguageDate
): Option<StockAbcReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<StockAbcReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const stockAbcReportFormatOptions = { getLabel, getOption, options };
