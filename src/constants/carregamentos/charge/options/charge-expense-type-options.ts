// src/constants/carregamentos/charge/options/charge-expense-type-options.ts
// -----------------------------------------------------------------------------
// Tipo de despesa acessória do Carregamento — reusa os MESMOS valores físicos
// de `App\Enums\Transfer\ExpenseTypeEnum` (mesma tabela irmã de
// `ChargeExpenseAncillary`/`TransferExpenseAncillary`, confirmado pelo
// Arquiteto Backend, plano §Notas técnicas 3) — mesmos rótulos que
// `Romaneios` já usa, NUNCA reinventar tradução.
//
// ⚠️ `serviços` com cedilha e acento — valor físico do enum backed no
// servidor (`ExpenseTypeEnum::SERVICOS`). Não normalizar.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ChargeExpenseType } from '@/@types/v2/Carregamentos';

const chargeExpenseTypeIndex = {
  REVERSAL: 'receitas',
  SUPPLIES: 'insumos',
  SERVICES: 'serviços',
} as const satisfies Record<string, ChargeExpenseType>;

const chargeExpenseTypeLabels = (languageGB: LanguageDate): Map<ChargeExpenseType, string> => {
  const dictionary = languageGB.carregamentos.charge.expenseTypeOptions;
  return new Map([
    [chargeExpenseTypeIndex.REVERSAL, dictionary.reversal],
    [chargeExpenseTypeIndex.SUPPLIES, dictionary.supplies],
    [chargeExpenseTypeIndex.SERVICES, dictionary.services],
  ]);
};

const getChargeExpenseTypeLabel = (value: ChargeExpenseType, languageGB: LanguageDate): string =>
  chargeExpenseTypeLabels(languageGB).get(value) ?? String(value);

const chargeExpenseTypeOptionsList = (languageGB: LanguageDate): Option<ChargeExpenseType>[] =>
  Array.from(chargeExpenseTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const chargeExpenseTypeOptions = {
  getLabel: getChargeExpenseTypeLabel,
  options: chargeExpenseTypeOptionsList,
};
