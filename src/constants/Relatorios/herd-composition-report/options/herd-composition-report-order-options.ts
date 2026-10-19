// src/constants/relatorios/herd-composition-report/options/herd-composition-report-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order` do relatório F-269 "Composição Rebanho"
// (lote 079, F-269-plano-frontend.md §6 TASK-F269-FE-01) — espelho EXATO das
// 10 chaves de `HerdCompositionReportColumn::sortableValues()` (`GB.Cerne.Api`,
// CL-16). Default `entry_date` (`HerdCompositionReportFilterData::$order`).
// Mirror estrutural de `income-report-order-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { HerdCompositionReportOrderKey } from '@/@types/v2/Relatorios/herd-composition-report';

const ORDER_KEYS: HerdCompositionReportOrderKey[] = [
  'identification',
  'category_description',
  'breed_description',
  'gender',
  'birth_date',
  'weight',
  'last_weighing',
  'gmd',
  'status',
  'entry_date',
];

const labels = (languageGB: LanguageDate): Map<HerdCompositionReportOrderKey, string> => {
  const dictionary = languageGB.herdCompositionReport.report.orderOptions;
  return new Map(ORDER_KEYS.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: HerdCompositionReportOrderKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: HerdCompositionReportOrderKey,
  languageGB: LanguageDate
): Option<HerdCompositionReportOrderKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HerdCompositionReportOrderKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const herdCompositionReportOrderOptions = { getLabel, getOption, options };
