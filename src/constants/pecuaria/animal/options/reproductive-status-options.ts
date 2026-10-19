// src/constants/pecuaria/animal/options/reproductive-status-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `reproductive_status` (Animal — 1=Prenha, 2=Vazia,
// 3=Parida) — mesmo padrão de `partner-status-options.ts` (`getLabel`/
// `getOption`/`options`, mensagens derivadas de `languageGB`, nunca
// hardcoded). Consumido pelo bloco condicional "Estágio/Status Reprodutivo"
// (§3.4.5, TASK-FE-884) — campo estático (Select), não `SelectAsyncPaginate`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalReproductiveStatus } from '@/@types/v2/Animals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.animals.animal.reproductiveStatusOptions;
  return new Map<AnimalReproductiveStatus, string>([
    [1, text.pregnant],
    [2, text.empty],
    [3, text.calved],
  ]);
};

const getLabel = (status: AnimalReproductiveStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (
  status: AnimalReproductiveStatus,
  languageGB: LanguageDate
): Option<AnimalReproductiveStatus> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<AnimalReproductiveStatus>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const reproductiveStatusOptions = {
  getLabel,
  getOption,
  options,
};
