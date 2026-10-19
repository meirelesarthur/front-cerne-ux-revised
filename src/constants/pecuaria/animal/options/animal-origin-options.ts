// src/constants/pecuaria/animal/options/animal-origin-options.ts
// -----------------------------------------------------------------------------
// Options factory do filtro `origin` (Animal — `B`=Nascimento, `P`=Processamento,
// `C`=Cadastro) — Tarefa 26 (Gestão Animais, FM-05). Mirror EXATO de
// `reproductive-status-options.ts` (`getLabel`/`getOption`/`options`, mensagens
// derivadas de `languageGB`, nunca hardcoded).
//
// Semântica (fonte: contrato de API v2 §4 / `AnimalIndexRequest::rules()`,
// `in:B,P,C`): `B` = `whereHas('birth')` · `P` = `whereHas('processing')` ·
// `C` = `doesntHave` de ambos (cadastro manual, sem nascimento nem
// processamento vinculado).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalOrigin } from '@/@types/v2/Animals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.animals.animal.originOptions;
  return new Map<AnimalOrigin, string>([
    ['B', text.birth],
    ['P', text.processing],
    ['C', text.registration],
  ]);
};

const getLabel = (origin: AnimalOrigin, languageGB: LanguageDate): string =>
  labels(languageGB).get(origin)!;

const getOption = (origin: AnimalOrigin, languageGB: LanguageDate): Option<AnimalOrigin> => ({
  label: getLabel(origin, languageGB),
  value: origin,
});

const options = (languageGB: LanguageDate): Option<AnimalOrigin>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const animalOriginOptions = {
  getLabel,
  getOption,
  options,
};
