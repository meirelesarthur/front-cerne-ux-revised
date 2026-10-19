// src/constants/RequestReceipts/options/has-input-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `has_input` de Gerar Financeiro (0=Não/1=Sim —
// IG-03) — dispara obrigatoriedade condicional de `input_value`/`input_date`.
// Mirror `fiscal-document-options.ts` (flag legado numérico, nunca boolean
// puro — fidelidade ao contrato de payload `0|1`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const HAS_INPUT = { no: 0, yes: 1 } as const;
export type HasInputValue = (typeof HAS_INPUT)[keyof typeof HAS_INPUT];

const labels = (languageGB: LanguageDate): Map<HasInputValue, string> => {
  const text = languageGB.requestReceipts.requestReceipt.financial.hasInputOptions;
  return new Map([
    [HAS_INPUT.yes, text.yes],
    [HAS_INPUT.no, text.no],
  ]);
};

const getLabel = (value: HasInputValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: HasInputValue, languageGB: LanguageDate): Option<HasInputValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HasInputValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const hasInputOptions = { values: HAS_INPUT, getLabel, getOption, options };
