// src/constants/FeedlotMap/options/feedlot-street-orientation-options.ts
// Fábrica de opções do campo `orientation` de FeedlotStreet — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2).

import {
  feedlotStreetOrientation,
  type FeedlotStreetOrientation,
} from '@/constants/FeedlotMap/feedlot-street-orientation';

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<FeedlotStreetOrientation, string> =>
  new Map([
    [
      feedlotStreetOrientation.horizontal,
      languageGB.feedlotMap.feedlotMap.street.orientationOptions.horizontal,
    ],
    [
      feedlotStreetOrientation.vertical,
      languageGB.feedlotMap.feedlotMap.street.orientationOptions.vertical,
    ],
  ]);

const getLabel = (value: FeedlotStreetOrientation, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FeedlotStreetOrientation,
  languageGB: LanguageDate
): Option<FeedlotStreetOrientation> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FeedlotStreetOrientation>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotStreetOrientationOptions = { getLabel, getOption, options };
