// src/constants/diet/options/diet-objective-options.ts
// Fábrica de opções do campo `objective` de Dieta (Diet — Operacional/
// Pecuária, TASK-FE-DIET-01). Padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2), mirror `foodTypeOptions`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { DIET_OBJECTIVES, dietObjectiveLabel, DietObjective } from '../diet-objective';

const labels = (languageGB: LanguageDate): Map<DietObjective, string> => {
  const label = dietObjectiveLabel(languageGB);
  return new Map(DIET_OBJECTIVES.map((objective) => [objective, label[objective]]));
};

const getLabel = (value: DietObjective, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DietObjective | null | undefined,
  languageGB: LanguageDate
): Option<DietObjective> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<DietObjective>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const dietObjectiveOptions = { getLabel, getOption, options };
