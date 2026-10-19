// src/constants/relatorios/animals-sale-report/options/animals-sale-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Vendas/Animais" (F-227,
// esteira 97-Esteiras/077) — mirror EXATO de
// `category-animal-report-format-options.ts`/`report-format-options.ts`, mas
// com domínio e i18n PRÓPRIOS deste módulo: `AnimalsSaleReportFormat =
// 'pdf' | 'excel'` (NUNCA reusar `ReportFormat`/`reportFormatOptions` de
// `AccountsReports`, cujo domínio é `'pdf' | 'xlsx'`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { AnimalsSaleReportFormat } from '@/@types/v2/AnimalsSaleReport';

const labels = (languageGB: LanguageDate): Map<AnimalsSaleReportFormat, string> => {
  const dictionary = languageGB.animalsSaleReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: AnimalsSaleReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AnimalsSaleReportFormat,
  languageGB: LanguageDate
): Option<AnimalsSaleReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AnimalsSaleReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const animalsSaleReportFormatOptions = { getLabel, getOption, options };
