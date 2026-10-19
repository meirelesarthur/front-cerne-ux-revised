// src/constants/relatorios/herd-composition-report/options/herd-composition-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `report_type` do relatório F-269 "Composição
// Rebanho" (lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01) — mirror
// EXATO de `death-animal-report-format-options.ts` (F-254, mesmo shape
// `pdf|excel` do backend, `HerdCompositionReportOutputType`): domínio e i18n
// PRÓPRIOS deste módulo (`HerdCompositionReportFormat` — NUNCA reusar
// `reportFormatOptions`/`ReportFormat` de `accounts-reports` — domínios
// distintos, mesma regra já documentada no comentário desse arquivo-mirror).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { HerdCompositionReportFormat } from '@/@types/v2/Relatorios/herd-composition-report';

const labels = (languageGB: LanguageDate): Map<HerdCompositionReportFormat, string> => {
  const dictionary = languageGB.herdCompositionReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: HerdCompositionReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: HerdCompositionReportFormat,
  languageGB: LanguageDate
): Option<HerdCompositionReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HerdCompositionReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const herdCompositionReportFormatOptions = { getLabel, getOption, options };
