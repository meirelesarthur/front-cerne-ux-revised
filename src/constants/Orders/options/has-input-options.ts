// src/constants/Orders/options/has-input-options.ts
// Fábrica de opções booleanas do campo `has_input` (bloco de parcelas,
// IG-010, PED-FE-05) — padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern
// §3.2). SEM chamada de rede — catálogo estático Sim/Não.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const hasInput = {
  sim: true,
  nao: false,
} as const;

export type HasInput = (typeof hasInput)[keyof typeof hasInput];

const labels = (languageGB: LanguageDate): Map<HasInput, string> => {
  const text = languageGB.orders.order.hasInputOptions;
  return new Map([
    [hasInput.sim, text.sim],
    [hasInput.nao, text.nao],
  ]);
};

const getLabel = (value: HasInput, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: HasInput, languageGB: LanguageDate): Option<HasInput> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HasInput>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const hasInputOptions = { getLabel, getOption, options };
