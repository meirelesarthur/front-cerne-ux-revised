// src/constants/breedingMating/options/ink-options.ts
// Fábrica de opções do campo `ink` da linha de Protocolo ("Tintas" —
// `mating_protocol_animals.ink`, string(1) 'S'-Sim/'P'-Pouca/'N'-Não). Só
// existe/visível quando `type.value === 2` (IATF), nunca em FIV (contrato de
// tela §6.3.2). Mirror `breeding-mating-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { InkValue } from '@/@types/v2/BreedingMating';

const labels = (languageGB: LanguageDate): Map<InkValue, string> => {
  const text = languageGB.breedingMatings.breedingMating.options.ink;
  return new Map([
    ['S', text.yes],
    ['P', text.little],
    ['N', text.no],
  ]);
};

const getLabel = (value: InkValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: InkValue, languageGB: LanguageDate): Option<InkValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<InkValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const inkOptions = { getLabel, getOption, options };
