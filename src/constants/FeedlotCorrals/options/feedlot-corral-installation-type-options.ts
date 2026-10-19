// src/constants/FeedlotCorrals/options/feedlot-corral-installation-type-options.ts
// Fábrica de opções do campo `installation_type` — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2).

import { feedlotCorralInstallationType } from '@/constants/FeedlotCorrals/feedlot-corral-installation-type';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    [
      feedlotCorralInstallationType.cover,
      languageGB.feedlotCorrals.feedlotCorral.enums.installationType.cover,
    ],
    [
      feedlotCorralInstallationType.uncovered,
      languageGB.feedlotCorrals.feedlotCorral.enums.installationType.uncovered,
    ],
  ]);

const getLabel = (value: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: string, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotCorralInstallationTypeOptions = { getLabel, getOption, options };
