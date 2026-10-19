// src/constants/dashboards/assetsDashboard/options/assets-period-options.ts
// Fábrica de opções do filtro Período (`AT-FILTER-01`) — padrão canônico
// `(languageGB) => Map`.

import { assetsPeriodMonths } from '@/constants/dashboards/assetsDashboard/types';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AssetsPeriodMonths } from '@/@types/v2/Dashboards/assetsDashboard';

const labels = (languageGB: LanguageDate): Map<AssetsPeriodMonths, string> => {
  const text = languageGB.dashboards.assetsDashboard.filter.periodOptions;
  return new Map([
    [assetsPeriodMonths.m3, text.m3],
    [assetsPeriodMonths.m6, text.m6],
    [assetsPeriodMonths.m12, text.m12],
  ]);
};

const getLabel = (value: AssetsPeriodMonths, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (
  value: AssetsPeriodMonths,
  languageGB: LanguageDate
): Option<AssetsPeriodMonths> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AssetsPeriodMonths>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const assetsPeriodOptions = { getLabel, getOption, options };
