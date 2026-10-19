// src/constants/financeiro/expense/options/payment-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `payment_type` de Expense (Contas a Pagar,
// esteira 036) — padrão canônico `(languageGB) => Map` + `getLabel`/
// `getOption`/`options` (get_pwa_constants_and_mappers_pattern §3.2), mirror
// EXATO `drink-options.ts`/`invoiceDocumentTypeOptions`.
//
// `payment_type` é int-backed (`App\Enums\Expense\ExpensePaymentTypeEnum`,
// GB.Cerne.Api) — 1=Parcela Única, 2=Parcelada, 3=Recorrente,
// 4=Adiantamento, 5=Fatura. Efeito de negócio por valor (contrato de tela
// §5.3): PARCELADA habilita a aba "Parcelamento"; RECORRENTE exige
// `recurrence_type`; FATURA relaxa a guarda `amount>0` do `store`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpensePaymentTypeValue } from '@/@types/v2/Financeiro/expense';

export const expensePaymentTypeIndex = {
  PARCELA_UNICA: 1,
  PARCELADA: 2,
  RECORRENTE: 3,
  ADIANTAMENTO: 4,
  FATURA: 5,
} as const satisfies Record<string, ExpensePaymentTypeValue>;

const labels = (languageGB: LanguageDate): Map<ExpensePaymentTypeValue, string> => {
  const dictionary = languageGB.financial.expense.form.paymentTypeOptions;
  return new Map([
    [expensePaymentTypeIndex.PARCELA_UNICA, dictionary.parcelaUnica],
    [expensePaymentTypeIndex.PARCELADA, dictionary.parcelada],
    [expensePaymentTypeIndex.RECORRENTE, dictionary.recorrente],
    [expensePaymentTypeIndex.ADIANTAMENTO, dictionary.adiantamento],
    [expensePaymentTypeIndex.FATURA, dictionary.fatura],
  ]);
};

const getLabel = (value: ExpensePaymentTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ExpensePaymentTypeValue,
  languageGB: LanguageDate
): Option<ExpensePaymentTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ExpensePaymentTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expensePaymentTypeOptions = { getLabel, getOption, options };
