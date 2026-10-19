// src/constants/relatorios/herd-composition-report/options/herd-composition-report-column-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de colunas do relatório F-269 "Composição
// Rebanho" (lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01) — espelho
// EXATO das 18 chaves/ordem de `App\Enums\Reports\HerdCompositionReportColumn`
// (`GB.Cerne.Api`, CL-14). Mirror estrutural de `income-report-column-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { HerdCompositionReportColumnKey } from '@/@types/v2/Relatorios/herd-composition-report';

const COLUMN_ORDER: HerdCompositionReportColumnKey[] = [
  'identification',
  'father',
  'category_description',
  'breed_description',
  'batch',
  'farm',
  'gender',
  'birth_date',
  'age',
  'weight',
  'start_weight',
  'last_weighing',
  'gmd',
  'nutrition',
  'sanitary_total',
  'status',
  'entry_date',
  'note',
];

const labels = (languageGB: LanguageDate): Map<HerdCompositionReportColumnKey, string> => {
  const dictionary = languageGB.herdCompositionReport.report.columns;
  return new Map(COLUMN_ORDER.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: HerdCompositionReportColumnKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: HerdCompositionReportColumnKey,
  languageGB: LanguageDate
): Option<HerdCompositionReportColumnKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HerdCompositionReportColumnKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const herdCompositionReportColumnOptions = { getLabel, getOption, options };
