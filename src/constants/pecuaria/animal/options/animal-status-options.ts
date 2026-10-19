// src/constants/pecuaria/animal/options/animal-status-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `status` (Animal — `A`=Ativo, `P`=Pendente, `D`=Morto,
// `L`=Perdido, `S`=Vendido, `R`=Excluído) — Tarefa 26 (Gestão Animais, FM-04).
// Mirror EXATO de `reproductive-status-options.ts` (`getLabel`/`getOption`/
// `options`, mensagens derivadas de `languageGB`, nunca hardcoded).
//
// Fonte dos valores: `app/Enums/AnimalStatus.php` (api_root). O `description()`
// do backend é pt-BR hardcoded e NÃO é consumido como rótulo — a SPA é
// trilíngue, os rótulos vêm de `languageGB.animals.animal.statusOptions`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalStatusValue } from '@/@types/v2/Animals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.animals.animal.statusOptions;
  return new Map<AnimalStatusValue, string>([
    ['A', text.active],
    ['P', text.pending],
    ['D', text.death],
    ['L', text.loss],
    ['S', text.sale],
    ['R', text.deleted],
  ]);
};

const getLabel = (status: AnimalStatusValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(status)!;

const getOption = (
  status: AnimalStatusValue,
  languageGB: LanguageDate
): Option<AnimalStatusValue> => ({
  label: getLabel(status, languageGB),
  value: status,
});

const options = (languageGB: LanguageDate): Option<AnimalStatusValue>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const animalStatusOptions = {
  getLabel,
  getOption,
  options,
};

/**
 * Mapa de `colorPalette` do Badge da coluna Status (mirror `typeColor` de
 * `type-options.ts`). `'A'` → verde (ativo); `'D'`/`'L'`/`'R'` → vermelho
 * (morto/perdido/excluído); `'S'` → azul (vendido); `'P'` → laranja
 * (pendente) — paleta definida no contrato de tela §6.
 */
export const animalStatusColor: Record<AnimalStatusValue, string> = {
  A: 'green',
  P: 'orange',
  D: 'red',
  L: 'red',
  S: 'blue',
  R: 'red',
};
