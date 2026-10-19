// src/constants/discount-table/options/calculation-base-options.ts
// Fábrica de opções do campo `calculation_base` de Tabela de Desconto
// (DiscountTable — Operacional/Agricultura, F-032, TASK-DT-FE-01). Padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror
// `feedingPhaseChangeRuleOptions`. Ordem GW antes de PD (LK-01).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import {
  DISCOUNT_TABLE_CALCULATION_BASES,
  discountTableCalculationBaseLabel,
  DiscountTableCalculationBase,
} from '../discount-table-calculation-base';

const labels = (languageGB: LanguageDate): Map<DiscountTableCalculationBase, string> => {
  const label = discountTableCalculationBaseLabel(languageGB);
  return new Map(
    DISCOUNT_TABLE_CALCULATION_BASES.map((calculationBase) => [
      calculationBase,
      label[calculationBase],
    ])
  );
};

const getLabel = (value: DiscountTableCalculationBase, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DiscountTableCalculationBase | null | undefined,
  languageGB: LanguageDate
): Option<DiscountTableCalculationBase> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<DiscountTableCalculationBase>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const calculationBaseOptions = { getLabel, getOption, options };
