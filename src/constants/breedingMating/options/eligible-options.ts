// src/constants/breedingMating/options/eligible-options.ts
// Fábrica de opções do campo `eligible` da linha de Protocolo ("Apta" —
// `mating_protocol_animals.eligible`, boolean, default `Sim`). Governa a
// obrigatoriedade entre `Produtos` e `Transferência/Lote` na linha (C9,
// contrato de tela §3.1). Mirror `ink-options.ts`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.breedingMatings.breedingMating.options.eligible;
  return new Map([
    [true, text.yes],
    [false, text.no],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const eligibleOptions = { getLabel, getOption, options };
