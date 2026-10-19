// src/constants/financeiro/expense/options/classification-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `classification` de Expense (Contas a Pagar,
// esteira 036) — mirror EXATO `payment-type-options.ts`/
// `invoiceClassificationOptions` (MESMO domínio físico `character(1)`,
// default `'N'`, de `App\Enums\Expense\ExpenseClassificationEnum`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpenseClassificationValue } from '@/@types/v2/Financeiro/expense';

const labels = (languageGB: LanguageDate): Map<ExpenseClassificationValue, string> => {
  const dictionary = languageGB.financial.expense.form.classificationOptions;
  return new Map([
    ['N', dictionary.notClassified],
    ['C', dictionary.capex],
    ['O', dictionary.opex],
  ]);
};

const getLabel = (value: ExpenseClassificationValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ExpenseClassificationValue,
  languageGB: LanguageDate
): Option<ExpenseClassificationValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ExpenseClassificationValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseClassificationOptions = { getLabel, getOption, options };
