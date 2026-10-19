// src/constants/operational/nutrition/options/time-control-options.ts
// Fábrica de opções booleana do campo `time_control` (`FLD-04` — Nutrição,
// TASK-NT-FE-01). Mirror do `booleanOptions` global (Sim/Não), mas com
// rótulo ESPECÍFICO do módulo ("Controle de Horas") — não reusa o
// `booleanOptions` genérico porque o legado tem rótulo próprio para este
// campo, não o Sim/Não neutro.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> =>
  new Map([
    [true, languageGB.nutritions.nutrition.options.timeControl.yes],
    [false, languageGB.nutritions.nutrition.options.timeControl.no],
  ]);

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([key, val]) => ({ label: val, value: key }));

export const timeControlOptions = { getLabel, getOption, options };
