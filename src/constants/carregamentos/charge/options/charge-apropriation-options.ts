// src/constants/carregamentos/charge/options/charge-apropriation-options.ts
// -----------------------------------------------------------------------------
// Apropriação da despesa acessória do Carregamento — `S`/`N`, reusa os MESMOS
// valores físicos de `App\Enums\Transfer\ApropriationEnum` (mesma tabela irmã
// de `ChargeExpenseAncillary`/`TransferExpenseAncillary`, confirmado pelo
// Arquiteto Backend, plano §Notas técnicas 3) — mesmos rótulos que
// `Romaneios` já usa, NUNCA reinventar tradução. Mirror `apropriationOptions`
// (`@/constants/transfers/options`), mas com dicionário PRÓPRIO do namespace
// `carregamentos` (mesma convenção já adotada por `chargeExpenseTypeOptions`/
// `chargeExpensePayerOptions` na fundação, TASK-FE-CG-01).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ChargeApropriation } from '@/@types/v2/Carregamentos';

const chargeApropriationLabels = (languageGB: LanguageDate): Map<ChargeApropriation, string> => {
  const dictionary = languageGB.carregamentos.charge.apropriationOptions;
  return new Map([
    ['S', dictionary.yes],
    ['N', dictionary.no],
  ]);
};

const getChargeApropriationLabel = (value: ChargeApropriation, languageGB: LanguageDate): string =>
  chargeApropriationLabels(languageGB).get(value) ?? String(value);

const chargeApropriationOptionsList = (languageGB: LanguageDate): Option<ChargeApropriation>[] =>
  Array.from(chargeApropriationLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const chargeApropriationOptions = {
  getLabel: getChargeApropriationLabel,
  options: chargeApropriationOptionsList,
};
