// src/constants/carregamentos/charge/options/charge-expense-payer-options.ts
// -----------------------------------------------------------------------------
// Quem paga a despesa acessória do Carregamento — reusa os MESMOS valores
// físicos de `App\Enums\Transfer\ExpensePayerEnum` (mesma tabela irmã,
// confirmado pelo Arquiteto Backend, plano §Notas técnicas 3) — mesmos
// rótulos que `Romaneios` já usa.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ChargeExpensePayer } from '@/@types/v2/Carregamentos';

const chargeExpensePayerLabels = (languageGB: LanguageDate): Map<ChargeExpensePayer, string> => {
  const dictionary = languageGB.carregamentos.charge.expensePayerOptions;
  return new Map([
    ['fornecedor', dictionary.provider],
    ['empresa', dictionary.company],
    ['cliente', dictionary.client],
    ['rateio', dictionary.apportionment],
  ]);
};

const getChargeExpensePayerLabel = (value: ChargeExpensePayer, languageGB: LanguageDate): string =>
  chargeExpensePayerLabels(languageGB).get(value) ?? String(value);

const chargeExpensePayerOptionsList = (languageGB: LanguageDate): Option<ChargeExpensePayer>[] =>
  Array.from(chargeExpensePayerLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const chargeExpensePayerOptions = {
  getLabel: getChargeExpensePayerLabel,
  options: chargeExpensePayerOptionsList,
};
