// src/constants/Users/options/user-online-options.ts
// Fábrica de opções do filtro `online` de User (contrato §3.5, linha 7 da
// tabela de filtros — "Todos/Online/Offline"). Mesmo padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options` de
// `user-active-options.ts`. Valores em STRING (`'true'`/`'false'`), mesmo
// shape de `UserFilterForm.online`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<'true' | 'false', string> =>
  new Map([
    ['true', languageGB.users.user.filter.onlineOptions.online],
    ['false', languageGB.users.user.filter.onlineOptions.offline],
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

export const userOnlineOptions = { getLabel, getOption, options };
