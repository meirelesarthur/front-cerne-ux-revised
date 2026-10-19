// src/constants/cadastrosBase/openingBalance/options/drink-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `drink` (Zona 4 "Informações do Café", condicional
// a `requires_coffee_fields`/TASK-BE-705) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror EXATO
// `provider-type-options.ts`.
//
// `drink` é `tinyInteger` no schema (Doc Bruta §2) — o valor PERSISTIDO é o
// ÍNDICE (1-21) da lista abaixo, NUNCA o texto. Índices e texto confirmados
// por fonte primária: `agro365/app/ItemInvoice.php::drinks()` (array PHP
// 1-indexado, jargão de classificação de bebida/qualidade de xícara do Café —
// cafeicultura brasileira). Labels IDÊNTICAS nos 3 idiomas (jargão técnico não
// se traduz, mesma grafia do legado, mirror de como o projeto trata outros
// termos técnicos de domínio agro).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export const drinkIndex = {
  extMole: 1,
  mole: 2,
  duroMais: 3,
  duro: 4,
  duroVerde: 5,
  duroSujo: 6,
  duroFrtd: 7,
  duro1Riada: 8,
  duro2Riadas: 9,
  duro3Riadas: 10,
  duro4Riadas: 11,
  duroRiado: 12,
  riado: 13,
  d1ri1rio: 14,
  d1ri2rio: 15,
  d2ri1rio: 16,
  dRiRio: 17,
  riadoRio: 18,
  rio: 19,
  rioZona: 20,
  rioZonal: 21,
} as const;

export type DrinkIndex = (typeof drinkIndex)[keyof typeof drinkIndex];

const labels = (languageGB: LanguageDate): Map<DrinkIndex, string> => {
  const dictionary = languageGB.openingBalances.openingBalance.form.drinkOptions;
  return new Map([
    [drinkIndex.extMole, dictionary.extMole],
    [drinkIndex.mole, dictionary.mole],
    [drinkIndex.duroMais, dictionary.duroMais],
    [drinkIndex.duro, dictionary.duro],
    [drinkIndex.duroVerde, dictionary.duroVerde],
    [drinkIndex.duroSujo, dictionary.duroSujo],
    [drinkIndex.duroFrtd, dictionary.duroFrtd],
    [drinkIndex.duro1Riada, dictionary.duro1Riada],
    [drinkIndex.duro2Riadas, dictionary.duro2Riadas],
    [drinkIndex.duro3Riadas, dictionary.duro3Riadas],
    [drinkIndex.duro4Riadas, dictionary.duro4Riadas],
    [drinkIndex.duroRiado, dictionary.duroRiado],
    [drinkIndex.riado, dictionary.riado],
    [drinkIndex.d1ri1rio, dictionary.d1ri1rio],
    [drinkIndex.d1ri2rio, dictionary.d1ri2rio],
    [drinkIndex.d2ri1rio, dictionary.d2ri1rio],
    [drinkIndex.dRiRio, dictionary.dRiRio],
    [drinkIndex.riadoRio, dictionary.riadoRio],
    [drinkIndex.rio, dictionary.rio],
    [drinkIndex.rioZona, dictionary.rioZona],
    [drinkIndex.rioZonal, dictionary.rioZonal],
  ]);
};

const getLabel = (value: DrinkIndex, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: DrinkIndex, languageGB: LanguageDate): Option<DrinkIndex> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<DrinkIndex>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const drinkOptions = { getLabel, getOption, options };
