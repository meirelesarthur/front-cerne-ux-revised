// src/constants/Users/options/user-active-options.ts
// Fábrica de opções do filtro `is_active` de User — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror `markerTypeOptions`.
// Valores em STRING (`'true'`/`'false'`) — mesmo shape de `UserFilterForm.is_active`
// (contrato §1.5/§3.5), NUNCA array `Option[]` inline no componente de filtro.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<'true' | 'false', string> =>
  new Map([
    ['true', languageGB.users.user.filter.activeOptions.active],
    ['false', languageGB.users.user.filter.activeOptions.inactive],
  ]);

const getLabel = (value: 'true' | 'false', languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: 'true' | 'false',
  languageGB: LanguageDate
): Option<'true' | 'false'> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<'true' | 'false'>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const userActiveOptions = { getLabel, getOption, options };
