// src/constants/marcacao/marking/options/marking-done-status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do status de Realizado de Marcação (Aberto/Parcial/
// Concluído, `MarkingDoneStatusEnum`) — TASK-MC-FE-06 (onda 2). Mirror
// `marking-status-options.ts` (get_pwa_constants_and_mappers_pattern §3.2):
// `(languageGB) => Map` + `getLabel/getOption/options`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { markingDoneStatus, type MarkingDoneStatusValue } from '../marking-done-status';

const markingDoneStatusLabels = (languageGB: LanguageDate): Map<MarkingDoneStatusValue, string> =>
  new Map([
    [markingDoneStatus.aberto, languageGB.marcacao.marking.done.statusOptions.aberto],
    [markingDoneStatus.parcial, languageGB.marcacao.marking.done.statusOptions.parcial],
    [markingDoneStatus.concluido, languageGB.marcacao.marking.done.statusOptions.concluido],
  ]);

function getLabel(value: MarkingDoneStatusValue, languageGB: LanguageDate): string {
  return markingDoneStatusLabels(languageGB).get(value) ?? String(value);
}

function getOption(
  value: MarkingDoneStatusValue,
  languageGB: LanguageDate
): Option<MarkingDoneStatusValue> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<MarkingDoneStatusValue>[] {
  return Array.from(markingDoneStatusLabels(languageGB), ([value, label]) => ({ label, value }));
}

export const markingDoneStatusOptions = { getLabel, getOption, options };
