// src/constants/relatorios/category-animal-report/options/category-animal-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Estq. Animais/Categoria"
// (F-242, esteira 97-Esteiras/077) — mirror EXATO de
// `stock-abc-report-format-options.ts`/`report-format-options.ts`, mas com
// domínio e i18n PRÓPRIOS deste módulo: `CategoryAnimalReportFormat =
// 'pdf' | 'excel'` (NUNCA reusar `ReportFormat`/`reportFormatOptions` de
// `AccountsReports`, cujo domínio é `'pdf' | 'xlsx'` — risco 1 do plano
// front).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { CategoryAnimalReportFormat } from '@/@types/v2/CategoryAnimalReport';

const labels = (languageGB: LanguageDate): Map<CategoryAnimalReportFormat, string> => {
  const dictionary = languageGB.categoryAnimalReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: CategoryAnimalReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: CategoryAnimalReportFormat,
  languageGB: LanguageDate
): Option<CategoryAnimalReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CategoryAnimalReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const categoryAnimalReportFormatOptions = { getLabel, getOption, options };
