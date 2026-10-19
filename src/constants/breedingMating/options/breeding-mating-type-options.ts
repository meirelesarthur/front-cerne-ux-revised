// src/constants/breedingMating/options/breeding-mating-type-options.ts
// Fábrica de opções do campo `type` de Acasalamento (`BreedingMatingTypeValue`
// — 1=NATURAL, 2=IATF, 3=FIV, `App\Enums\BreedingMatingType`, REUSO INTEGRAL
// do backend). Mirror `diet-type-options.ts`
// (get_pwa_constants_and_mappers_pattern §3.2).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BreedingMatingTypeValue } from '@/@types/v2/BreedingMating';

const labels = (languageGB: LanguageDate): Map<BreedingMatingTypeValue, string> => {
  const text = languageGB.breedingMatings.breedingMating.options.type;
  return new Map([
    [1, text.natural],
    [2, text.iatf],
    [3, text.fiv],
  ]);
};

const getLabel = (value: BreedingMatingTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: BreedingMatingTypeValue,
  languageGB: LanguageDate
): Option<BreedingMatingTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<BreedingMatingTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const breedingMatingTypeOptions = { getLabel, getOption, options };
