// src/constants/dashboards/rainfallDashboard/options/rainfall-period-options.ts
// Fábrica de opções do filtro Período (`CONTRATO-API-048-01 §2`) — mirror do
// padrão canônico `assetsPeriodOptions`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { RainfallPeriod } from '@/@types/v2/Dashboards/rainfallDashboard';

const labels = (languageGB: LanguageDate): Map<RainfallPeriod, string> => {
  const text = languageGB.dashboards.rainfallDashboard.filter.periodOptions;
  return new Map([
    ['30d', text.d30],
    ['90d', text.d90],
    ['12m', text.m12],
  ]);
};

const getLabel = (value: RainfallPeriod, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: RainfallPeriod, languageGB: LanguageDate): Option<RainfallPeriod> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RainfallPeriod>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const rainfallPeriodOptions = { getLabel, getOption, options };
