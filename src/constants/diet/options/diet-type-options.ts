// src/constants/diet/options/diet-type-options.ts
// Fábrica de opções do campo `type` de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-01). Mirror EXATO `foodTypeOptions`
// (get_pwa_constants_and_mappers_pattern §3.2).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { DIET_TYPES, dietTypeLabel, DietType } from '../diet-type';

const labels = (languageGB: LanguageDate): Map<DietType, string> => {
  const label = dietTypeLabel(languageGB);
  return new Map(DIET_TYPES.map((type) => [type, label[type]]));
};

const getLabel = (value: DietType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DietType | null | undefined,
  languageGB: LanguageDate
): Option<DietType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<DietType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const dietTypeOptions = { getLabel, getOption, options };
