// src/constants/financeiro/expense/options/recurrence-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `recurrence_type` de Expense (Contas a Pagar,
// esteira 036) — mirror EXATO `payment-type-options.ts`.
//
// `recurrence_type` é int-backed (`App\Enums\Expense\
// ExpenseRecurrenceTypeEnum`, GB.Cerne.Api) — 0=Semanal, 1=Mensal,
// 3=Trimestral, 12=Anual. NÃO sequencial (mirror literal do legado,
// `App\Expense::recurrenceType()`) — não reordenar/renumerar. Exigido só
// quando `payment_type=RECORRENTE(3)` (contrato de tela §5.3).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpenseRecurrenceTypeValue } from '@/@types/v2/Financeiro/expense';

export const expenseRecurrenceTypeIndex = {
  SEMANAL: 0,
  MENSAL: 1,
  TRIMESTRAL: 3,
  ANUAL: 12,
} as const satisfies Record<string, ExpenseRecurrenceTypeValue>;

const labels = (languageGB: LanguageDate): Map<ExpenseRecurrenceTypeValue, string> => {
  const dictionary = languageGB.financial.expense.form.recurrenceTypeOptions;
  return new Map([
    [expenseRecurrenceTypeIndex.SEMANAL, dictionary.semanal],
    [expenseRecurrenceTypeIndex.MENSAL, dictionary.mensal],
    [expenseRecurrenceTypeIndex.TRIMESTRAL, dictionary.trimestral],
    [expenseRecurrenceTypeIndex.ANUAL, dictionary.anual],
  ]);
};

const getLabel = (value: ExpenseRecurrenceTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ExpenseRecurrenceTypeValue,
  languageGB: LanguageDate
): Option<ExpenseRecurrenceTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ExpenseRecurrenceTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseRecurrenceTypeOptions = { getLabel, getOption, options };
