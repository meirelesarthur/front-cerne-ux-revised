// src/constants/relatorios/nfe-report/options/nfe-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` do relatório "NFe/Emitidas" (F-287,
// esteira 97-Esteiras/079, TASK-F287-FE-01) — mirror de FORMA de
// `accounts-reports/options/report-format-options.ts` (`Map` alimentado por
// `languageGB` + `getLabel`/`getOption`/`options`), domínio de STRING
// `'pdf'|'xlsx'` — convenção do fork é 1 fábrica de `format` POR MÓDULO
// (mirror `weighing-in-out-report`/`stock-abc-report`/`accounts-reports`),
// NUNCA reusar `NfeProductReportType` (domínio `0|1` de F-286, D-FE-02).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { NfeReportFormat } from '@/@types/v2/NfeReport';

const labels = (languageGB: LanguageDate): Map<NfeReportFormat, string> => {
  const dictionary = languageGB.nfeReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: NfeReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: NfeReportFormat, languageGB: LanguageDate): Option<NfeReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<NfeReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const nfeReportFormatOptions = { getLabel, getOption, options };
