// src/constants/discount-table/options/discount-rule-type-options.ts
// Fábrica de opções dos 6 tipos FIXOS de Regra de Desconto (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-01). Padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2), mirror
// `feedingPhaseChangeRuleOptions`. `options(languageGB)` é a fonte ORDENADA
// (CLM-17) dos rótulos das 6 abas de regra por produto (TASK-DT-FE-03).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import {
  DISCOUNT_RULE_TYPES,
  discountRuleTypeLabel,
  DiscountRuleType,
} from '../discount-rule-type';

const labels = (languageGB: LanguageDate): Map<DiscountRuleType, string> => {
  const label = discountRuleTypeLabel(languageGB);
  return new Map(DISCOUNT_RULE_TYPES.map((type) => [type, label[type]]));
};

const getLabel = (value: DiscountRuleType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DiscountRuleType | null | undefined,
  languageGB: LanguageDate
): Option<DiscountRuleType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

// ORDEM EXATA (CLM-17) — impureza, umidade, quebrado, esverdeado, avariado,
// taxa_recepcao (mesma ordem de `DISCOUNT_RULE_TYPES`, Map preserva
// inserção).
const options = (languageGB: LanguageDate): Option<DiscountRuleType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const discountRuleTypeOptions = { getLabel, getOption, options };
