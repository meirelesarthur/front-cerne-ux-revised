// src/constants/FeedlotYards/options/feedlot-yard-status-options.ts
// Fábrica de opções do campo `is_active` de FeedlotYard — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror `userActiveOptions`.
// Valores BOOLEANOS (`true`/`false`) — mesmo shape de `FeedlotYardForm.is_active`/
// `FeedlotYardFilterForm.is_active` (`Option<boolean>`), NUNCA array `Option[]`
// inline no componente.

import { feedlotYardStatus } from '@/constants/FeedlotYards/feedlot-yard-status';

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> =>
  new Map([
    [feedlotYardStatus.active, languageGB.feedlotYards.feedlotYard.status.active],
    [feedlotYardStatus.inactive, languageGB.feedlotYards.feedlotYard.status.inactive],
  ]);

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotYardStatusOptions = { getLabel, getOption, options };
