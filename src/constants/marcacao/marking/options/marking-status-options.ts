// src/constants/marcacao/marking/options/marking-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do status de Marcação (Marcado/Previsto/Realizado) —
// mirror `weaning-type-options.ts` (get_pwa_constants_and_mappers_pattern
// §3.2): `(languageGB) => Map` + `getLabel/getOption/options`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { markingStatus, type MarkingStatusValue } from '../marking-status';

const markingStatusLabels = (languageGB: LanguageDate): Map<MarkingStatusValue, string> =>
  new Map([
    [markingStatus.marcado, languageGB.marcacao.marking.status.marcado],
    [markingStatus.previsto, languageGB.marcacao.marking.status.previsto],
    [markingStatus.realizado, languageGB.marcacao.marking.status.realizado],
  ]);

function getLabel(value: MarkingStatusValue, languageGB: LanguageDate): string {
  return markingStatusLabels(languageGB).get(value) ?? String(value);
}

function getOption(
  value: MarkingStatusValue,
  languageGB: LanguageDate
): Option<MarkingStatusValue> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<MarkingStatusValue>[] {
  return Array.from(markingStatusLabels(languageGB), ([value, label]) => ({ label, value }));
}

export const markingStatusOptions = { getLabel, getOption, options };
