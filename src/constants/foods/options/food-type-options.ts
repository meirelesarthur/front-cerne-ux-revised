// src/constants/foods/options/food-type-options.ts
// Fábrica de opções do campo `type` de Formulação (Food — Fábrica/Ração,
// TASK-FOOD-FE-01). Padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2), mirror `movementTypeOptions`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { FOOD_TYPES, foodTypeLabel, FoodType } from '../food-type';

const labels = (languageGB: LanguageDate): Map<FoodType, string> => {
  const label = foodTypeLabel(languageGB);
  return new Map(FOOD_TYPES.map((type) => [type, label[type]]));
};

const getLabel = (value: FoodType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FoodType | null | undefined,
  languageGB: LanguageDate
): Option<FoodType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<FoodType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const foodTypeOptions = { getLabel, getOption, options };
