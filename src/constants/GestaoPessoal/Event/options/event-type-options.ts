// src/constants/GestaoPessoal/Event/options/event-type-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `EventPeriodicity` (Eventos-contrato.md §2.3) —
// mirror do padrão `getLabel`/`getOption`/`options` de
// `@/constants/Grazing/options/control-productivity-options.ts`.
//
// A grid (TASK-FE-EVT-01) NÃO precisa desta fábrica para exibir o rótulo —
// `EventResource` já expõe `type_label` pronto (confirmado por leitura direta
// do api_root), consumido direto pela Badge da coluna `type`. Esta fábrica
// serve o `Select` do formulário (TASK-FE-EVT-02), que precisa da LISTA
// completa de opções (value/label), não só do rótulo do valor atual.
//
// `getOption`/`options` devolvem `Option<string>` (value como STRING) — é o
// formato que o `Select`/RHF consome (`EventForm.type: string`, mirror
// `CostCenterForm.condition`); a conversão de volta para `number` acontece só
// no submit (`tryPersistEvento`).
//
// Ordem de exibição — mesma da tabela do contrato de tela §3 (Semanal →
// Quinzenal → Mensal → Trimestral → Semestral → Anual), não a ordem numérica
// crua do enum.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.events.event.typeOptions;
  return new Map<number, string>([
    [1, text.weekly],
    [4, text.biweekly],
    [2, text.monthly],
    [5, text.quarterly],
    [6, text.semiannual],
    [3, text.annual],
  ]);
};

const getLabel = (type: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(type) ?? String(type);

const getOption = (type: number, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(type, languageGB),
  value: String(type),
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: String(key),
  }));

export const eventTypeOptions = { getLabel, getOption, options };
