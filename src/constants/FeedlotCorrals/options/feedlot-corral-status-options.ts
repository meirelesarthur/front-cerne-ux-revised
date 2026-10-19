// src/constants/FeedlotCorrals/options/feedlot-corral-status-options.ts
// Fábrica de opções do campo `status` — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2). REUSA `feedlotCorralStatus`
// de `src/constants/FeedlotMap/feedlot-corral-status.ts` (valores VA/VS/OC/
// MA/LI/EN/FE) — NÃO redeclara o enum, só acrescenta o rótulo por locale
// (ausente em `FeedlotMap`, onde o `label` já vem traduzido do backend via
// `getFeedlotCorralOptions`).

import { feedlotCorralStatus } from '@/constants/FeedlotMap/feedlot-corral-status';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const text = languageGB.feedlotCorrals.feedlotCorral.enums.status;
  return new Map([
    [feedlotCorralStatus.available, text.available],
    [feedlotCorralStatus.reserved, text.reserved],
    [feedlotCorralStatus.occupied, text.occupied],
    [feedlotCorralStatus.maintenance, text.maintenance],
    [feedlotCorralStatus.cleaning, text.cleaning],
    [feedlotCorralStatus.sanitaryHold, text.sanitaryHold],
    [feedlotCorralStatus.closed, text.closed],
  ]);
};

const getLabel = (value: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: string, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const feedlotCorralStatusOptions = { getLabel, getOption, options };
