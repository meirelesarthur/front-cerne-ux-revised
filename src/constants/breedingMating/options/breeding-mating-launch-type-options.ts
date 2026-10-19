// src/constants/breedingMating/options/breeding-mating-launch-type-options.ts
// Fábrica de opções do campo `launch_type` de Acasalamento
// (`BreedingMatingLaunchTypeValue` — 1=Normal, 2=Simplificado,
// `App\Enums\BreedingMatingLaunchType`, novo). Mirror `breeding-mating-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BreedingMatingLaunchTypeValue } from '@/@types/v2/BreedingMating';

const labels = (languageGB: LanguageDate): Map<BreedingMatingLaunchTypeValue, string> => {
  const text = languageGB.breedingMatings.breedingMating.options.launchType;
  return new Map([
    [1, text.normal],
    [2, text.simplified],
  ]);
};

const getLabel = (value: BreedingMatingLaunchTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: BreedingMatingLaunchTypeValue,
  languageGB: LanguageDate
): Option<BreedingMatingLaunchTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<BreedingMatingLaunchTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const breedingMatingLaunchTypeOptions = { getLabel, getOption, options };
