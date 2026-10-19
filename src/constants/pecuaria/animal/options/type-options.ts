// src/constants/pecuaria/animal/options/type-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `type` (Animal — `single`/`no_id`) — mesmo padrão
// de `constants/afiliados/partner/options/partner-status-options.ts`
// (`getLabel`/`getOption`/`options`, mensagens derivadas de `languageGB`,
// nunca hardcoded).
//
// `single` = "Individual" | `no_id` = "Sem Identificação". Ambos persistem
// `type='single'` no banco legado (RN-1/RN-3 da Doc Bruta) — a distinção real
// está em como o pivot de identificação é montado, não neste enum de UI.
// IMUTÁVEL após criação (readonly no form de edição, TASK-882).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalType } from '@/@types/v2/Animals';

const labels = (languageGB: LanguageDate) => {
  const text = languageGB.animals.animal.typeOptions;
  return new Map<AnimalType, string>([
    ['single', text.single],
    ['no_id', text.noId],
  ]);
};

const getLabel = (type: AnimalType, languageGB: LanguageDate): string =>
  labels(languageGB).get(type)!;

const getOption = (type: AnimalType, languageGB: LanguageDate): Option<AnimalType> => ({
  label: getLabel(type, languageGB),
  value: type,
});

const options = (languageGB: LanguageDate): Option<AnimalType>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: key,
  }));

export const typeOptions = {
  getLabel,
  getOption,
  options,
};

/** Mapa de `colorPalette` do Badge da coluna Tipo (mirror Chakra `colorPalette`). */
export const typeColor: Record<AnimalType, string> = {
  single: 'blue',
  no_id: 'gray',
};
