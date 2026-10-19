// src/constants/weaning/options/weaning-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do formato do relatório de Desmama — enum de STRING
// explícito (`'pdf' | 'xlsx'`, mirror `WeaningController::report()` real:
// `format => in:pdf,xlsx`), NUNCA índice de array (corrige OQ-10 por
// construção). Mesmo padrão `(languageGB) => Map` + getLabel/getOption/options.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const weaningReportFormat = {
  pdf: 'pdf',
  xlsx: 'xlsx',
} as const;

export type WeaningReportFormatValue =
  (typeof weaningReportFormat)[keyof typeof weaningReportFormat];

const weaningReportFormatLabels = (
  languageGB: LanguageDate
): Map<WeaningReportFormatValue, string> =>
  new Map([
    [weaningReportFormat.pdf, languageGB.weaning.weaning.report.format.pdf],
    [weaningReportFormat.xlsx, languageGB.weaning.weaning.report.format.xlsx],
  ]);

function getLabel(value: WeaningReportFormatValue, languageGB: LanguageDate): string {
  return weaningReportFormatLabels(languageGB).get(value) ?? String(value);
}

function getOption(
  value: WeaningReportFormatValue,
  languageGB: LanguageDate
): Option<WeaningReportFormatValue> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<WeaningReportFormatValue>[] {
  return Array.from(weaningReportFormatLabels(languageGB), ([value, label]) => ({ label, value }));
}

export const weaningReportFormatOptions = { getLabel, getOption, options };
