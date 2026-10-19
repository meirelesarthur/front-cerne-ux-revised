// src/constants/relatorios/weighing-in-out-report/options/report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` do relatório F-336 Pesagem
// Entrada/Saída — mirror EXATO de `accounts-reports/options/report-format-
// options.ts`, domínio fixo `'pdf' | 'xlsx'`.
//
// Arquivo LOCAL desta feature (Nota de concorrência D-058-07,
// FRONT-F336-plano.md §3) — NÃO importa de
// `constants/relatorios/accounts-reports/options/report-format-options.ts`,
// evitando contenção de merge com as outras 5 features desta esteira
// (arquivos disjuntos por feature).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { WeighingInOutReportFormat } from '@/@types/v2/WeighingInOutReport';

const labels = (languageGB: LanguageDate): Map<WeighingInOutReportFormat, string> => {
  const dictionary = languageGB.weighingInOutReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (value: WeighingInOutReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: WeighingInOutReportFormat,
  languageGB: LanguageDate
): Option<WeighingInOutReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<WeighingInOutReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportFormatOptions = { getLabel, getOption, options };
