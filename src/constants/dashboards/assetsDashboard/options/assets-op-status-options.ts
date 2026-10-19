// src/constants/dashboards/assetsDashboard/options/assets-op-status-options.ts
// Fábrica de opções do filtro Status LEGADO (`AT-FILTER-03`, `LKP-004`,
// prefixo "Todos") — distinto do enum operacional de `AT-STATUS-01`.

import { assetsLegacyStatus } from '@/constants/dashboards/assetsDashboard/types';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.dashboards.assetsDashboard.filter.statusOptions;
  return new Map([
    [assetsLegacyStatus.active, text.active],
    [assetsLegacyStatus.inactive, text.inactive],
  ]);
};

const getLabel = (value: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (value: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const assetsOpStatusOptions = { getLabel, getOption, options };
