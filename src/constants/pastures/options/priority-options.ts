// src/constants/pastures/options/priority-options.ts
// Fábrica de opções de `PasturePriorityValue` ('0'/'1'/'2' — validado
// `in:0,1,2` em `PastureRequest`) — Ocorrências, TASK-PAST-FE-05. Default
// de linha nova é Média ('1'), mirror DoD da Tarefa.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PasturePriorityValue } from '@/@types/v2/Pastures';

const priorityMap = (languageGB: LanguageDate): Map<PasturePriorityValue, string> => {
  const priorityOptions = languageGB.pastures.pasture.form.occurrences.priorityOptions;
  return new Map([
    ['0', priorityOptions.low],
    ['1', priorityOptions.medium],
    ['2', priorityOptions.high],
  ]);
};

const getLabel = (value: PasturePriorityValue, languageGB: LanguageDate): string =>
  priorityMap(languageGB).get(value) ?? value;

const getOption = (
  value: PasturePriorityValue,
  languageGB: LanguageDate
): Option<PasturePriorityValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PasturePriorityValue>[] =>
  Array.from(priorityMap(languageGB), ([value, label]) => ({ label, value }));

/**
 * Opção default de linha nova de Ocorrência — Média (DoD FE-05).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Option<PasturePriorityValue>} Opção "Média" pronta para o `append()` do field-array.
 */
const defaultOption = (languageGB: LanguageDate): Option<PasturePriorityValue> =>
  getOption('1', languageGB);

export const priorityOptions = { getLabel, getOption, options, defaultOption };

export default priorityOptions;
