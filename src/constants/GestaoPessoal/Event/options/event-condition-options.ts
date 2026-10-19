// src/constants/GestaoPessoal/Event/options/event-condition-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `EventCondition` (Eventos-contrato.md §2.3,
// GAP-BE-01 Opção B — obrigatório em todas as camadas, sem opção "não
// definido"). Mesmo racional de `event-type-options.ts` (a grid usa
// `condition_label` pronto do `EventResource`; esta fábrica alimenta só o
// `Select` do formulário, TASK-FE-EVT-02).
//
// Ordem de exibição — mesma do contrato de tela §3 (Soma → Diminui).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.events.event.conditionOptions;
  return new Map<number, string>([
    [1, text.sum],
    [0, text.decrease],
  ]);
};

const getLabel = (condition: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(condition) ?? String(condition);

const getOption = (condition: number, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(condition, languageGB),
  value: String(condition),
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: String(key),
  }));

export const eventConditionOptions = { getLabel, getOption, options };
