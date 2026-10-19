// src/constants/RequestReceipts/options/fiscal-document-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `fiscal_document` de Gerar Financeiro — boolean
// exposto como Select Sim/Não, default `true` (contrato §5.4 "default 1"),
// mirror EXATO do padrão já usado por `fiscal_document` em
// `CreateOrUpdateExpense.tsx` (Contas a Pagar) — mesmo campo físico, o
// financeiro gerado aqui É um `Expense` (boundary reuse da infra Expense,
// CLM-22/23).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<boolean, string> => {
  const text = languageGB.requestReceipts.requestReceipt.financial.fiscalDocumentOptions;
  return new Map([
    [true, text.yes],
    [false, text.no],
  ]);
};

const getLabel = (value: boolean, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: boolean, languageGB: LanguageDate): Option<boolean> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<boolean>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const fiscalDocumentOptions = { getLabel, getOption, options };
