// src/constants/FeedlotSectors/options/feedlot-sector-status-options.ts
// Fábrica de opções do campo `is_active` de FeedlotSector — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror exato
// `feedlot-yard-status-options.ts`. Valores BOOLEANOS (`true`/`false`) —
// mesmo shape de `FeedlotSectorForm.is_active`/`FeedlotSectorFilterForm.is_active`
// (`Option<boolean>`), NUNCA array `Option[]` inline no componente.

import { feedlotSectorStatus } from '@/constants/FeedlotSectors/feedlot-sector-status';

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> =>
  new Map([
    [feedlotSectorStatus.active, languageGB.feedlotSectors.feedlotSector.status.active],
    [feedlotSectorStatus.inactive, languageGB.feedlotSectors.feedlotSector.status.inactive],
  ]);

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotSectorStatusOptions = { getLabel, getOption, options };
