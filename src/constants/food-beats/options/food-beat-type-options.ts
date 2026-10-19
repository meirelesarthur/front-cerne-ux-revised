// src/constants/food-beats/options/food-beat-type-options.ts
// Fábrica de opções do campo `type` de Batida (FoodBeat — Fábrica,
// TASK-FB-FE-01). Padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2), mirror `foodTypeOptions`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { FOOD_BEAT_TYPES, foodBeatTypeLabel, FoodBeatType } from '../food-beat-type';

const labels = (languageGB: LanguageDate): Map<FoodBeatType, string> => {
  const label = foodBeatTypeLabel(languageGB);
  return new Map(FOOD_BEAT_TYPES.map((type) => [type, label[type]]));
};

const getLabel = (value: FoodBeatType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FoodBeatType | null | undefined,
  languageGB: LanguageDate
): Option<FoodBeatType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<FoodBeatType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const foodBeatTypeOptions = { getLabel, getOption, options };
