// src/constants/GestaoPessoal/Event/options/event-method-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `EventMethod` (Eventos-contrato.md §2.3) — mesmo
// racional de `event-type-options.ts` (a grid usa `method_label` pronto do
// `EventResource`; esta fábrica alimenta só o `Select` do formulário,
// TASK-FE-EVT-02).
//
// Ordem de exibição — mesma do contrato de tela §3 (Informado → Fixo).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.events.event.methodOptions;
  return new Map<number, string>([
    [1, text.informed],
    [0, text.fixed],
  ]);
};

const getLabel = (method: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(method) ?? String(method);

const getOption = (method: number, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(method, languageGB),
  value: String(method),
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: String(key),
  }));

export const eventMethodOptions = { getLabel, getOption, options };
