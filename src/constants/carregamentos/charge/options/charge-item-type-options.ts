// src/constants/carregamentos/charge/options/charge-item-type-options.ts
// -----------------------------------------------------------------------------
// Tipo do item do Carregamento — `buque`/`penteada` (`ChargeItemTypeEnum`).
// Fábrica canônica `(languageGB) => Map` + `getLabel`/`options`, mirror
// `transferTypeOptions`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ChargeItemType } from '@/@types/v2/Carregamentos';

const chargeItemTypeLabels = (languageGB: LanguageDate): Map<ChargeItemType, string> => {
  const dictionary = languageGB.carregamentos.charge.itemTypeOptions;
  return new Map([
    ['buque', dictionary.buque],
    ['penteada', dictionary.penteada],
  ]);
};

const getChargeItemTypeLabel = (value: ChargeItemType, languageGB: LanguageDate): string =>
  chargeItemTypeLabels(languageGB).get(value) ?? String(value);

const chargeItemTypeOptionsList = (languageGB: LanguageDate): Option<ChargeItemType>[] =>
  Array.from(chargeItemTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const chargeItemTypeOptions = {
  getLabel: getChargeItemTypeLabel,
  options: chargeItemTypeOptionsList,
};
