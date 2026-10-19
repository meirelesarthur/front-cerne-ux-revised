// src/constants/GestaoPessoal/Absence/options/absence-period-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `AbsencePeriod` (frontend-contract-registro-
// faltas.md §6) — mirror do padrão `getLabel`/`getOption`/`options` de
// `@/constants/GestaoPessoal/Event/options/event-type-options.ts`.
//
// `getOption`/`options` devolvem `Option<string>` (value como STRING) — é o
// formato que o `Select`/RHF consome (`AbsenceForm.period: string`, mirror
// `EventForm.type`); a conversão de volta para `number|null` acontece só no
// submit (`tryPersistAbsence`, checklist item 3 da Tarefa 13).
//
// Campo NULLABLE (`allowClear`, sem `isRequired`) — '' representa "Selecione"
// (nenhum período informado), preservando o comportamento do legado.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.absences.absence.periodOptions;
  return new Map<number, string>([
    [1, text.morning],
    [2, text.afternoon],
    [3, text.fullDay],
  ]);
};

const getLabel = (period: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(period) ?? String(period);

const getOption = (period: number, languageGB: LanguageDate): Option<string> => ({
  label: getLabel(period, languageGB),
  value: String(period),
});

const options = (languageGB: LanguageDate): Option<string>[] =>
  Array.from(labels(languageGB)).map(([key, value]) => ({
    label: value,
    value: String(key),
  }));

export const absencePeriodOptions = { getLabel, getOption, options };
