// src/constants/pastures/options/pasture-status-options.ts
// Fábrica de opções do enum `PastureStatusValue` (`O`/`F`/`A` —
// `PastureStatusEnum` real, arquitetura-api-pastagem.md §4 AC-MODEL-07).
// Mirror `pasture-status.ts` (cor) — aqui só rótulo/Option<T>, derivado da
// tradução (TASK-PAST-FE-00).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PastureStatusValue } from '@/@types/v2/Pastures';

const pastureStatusMap = (languageGB: LanguageDate): Map<PastureStatusValue, string> => {
  const legend = languageGB.pastures.pasture.list.statusLegend;
  return new Map([
    ['O', legend.opened],
    ['F', legend.finished],
    ['A', legend.appropriated],
  ]);
};

const getLabel = (value: PastureStatusValue, languageGB: LanguageDate): string =>
  pastureStatusMap(languageGB).get(value) ?? value;

const getOption = (
  value: PastureStatusValue,
  languageGB: LanguageDate
): Option<PastureStatusValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PastureStatusValue>[] =>
  Array.from(pastureStatusMap(languageGB), ([value, label]) => ({ label, value }));

export const pastureStatusOptions = { getLabel, getOption, options };

export default pastureStatusOptions;
