// src/constants/pecuaria/categoryAnimal/options/gender-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `gender` (CategoryAnimal — M/F/A) — mesmo padrão de
// `constants/afiliados/partner/options/partner-status-options.ts`
// (`getLabel`/`getOption`/`options`, mensagens derivadas de `languageGB`,
// nunca hardcoded). Mapa de cor do Badge (`genderColor`) CO-LOCADO aqui
// (Lei 6 — nunca cor inline em componente).
//
// `is_enabled` NÃO tem fábrica própria aqui — reaproveita a fábrica GLOBAL já
// existente `@/constants/options/statusOptions.ts` (evita duplicação, decisão
// do Contrato de Tela §2).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CategoryAnimalGender } from '@/@types/v2/CategoryAnimals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.categoryAnimals.categoryAnimal.genderOptions;
  return new Map<CategoryAnimalGender, string>([
    ['M', text.male],
    ['F', text.female],
    ['A', text.both],
  ]);
};

const getLabel = (gender: CategoryAnimalGender, languageGB: LanguageDate): string =>
  labels(languageGB).get(gender)!;

const getOption = (
  gender: CategoryAnimalGender,
  languageGB: LanguageDate
): Option<CategoryAnimalGender> => ({
  label: getLabel(gender, languageGB),
  value: gender,
});

const options = (languageGB: LanguageDate): Option<CategoryAnimalGender>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const genderOptions = {
  getLabel,
  getOption,
  options,
};

/** Mapa de `colorPalette` do Badge da coluna Sexo (mirror Chakra `colorPalette`). */
export const genderColor: Record<CategoryAnimalGender, string> = {
  M: 'blue',
  F: 'pink',
  A: 'gray',
};
