// src/constants/FeedlotCorrals/options/feedlot-corral-shading-type-options.ts
// Fábrica de opções do campo `shading` — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2).

import { feedlotCorralShadingType } from '@/constants/FeedlotCorrals/feedlot-corral-shading-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const text = languageGB.feedlotCorrals.feedlotCorral.enums.shading;
  return new Map([
    [feedlotCorralShadingType.natural, text.natural],
    [feedlotCorralShadingType.artificial, text.artificial],
    [feedlotCorralShadingType.none, text.none],
  ]);
};

const getLabel = (value: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: string, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotCorralShadingTypeOptions = { getLabel, getOption, options };
