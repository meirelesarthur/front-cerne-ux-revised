// src/constants/discount-table/discount-rule-type.ts
// Enum client-side dos 6 tipos FIXOS de Regra de Desconto (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-01). Mirror estrutural de
// `feeding-phase/feeding-phase-change-rule.ts` — união literal DECLARADA DE
// NOVO aqui (decoupling: este arquivo não depende de import cruzado de
// `@/@types/v2/DiscountTables`).
//
// ORDEM EXATA (CLM-17, contrato de tela §4.3) — confirmado por leitura
// direta de `App\Enums\DiscountRuleType` (`GB.Cerne.Api`,
// `app/Enums/DiscountRuleType.php`): impureza, umidade, quebrado,
// esverdeado, avariado, taxa_recepcao. Usado como fonte ordenada das 6 abas
// do card de produto (TASK-DT-FE-03).

import type { LanguageDate } from '@/@types/language';

export type DiscountRuleType =
  'impureza' | 'umidade' | 'quebrado' | 'esverdeado' | 'avariado' | 'taxa_recepcao';

export const DISCOUNT_RULE_TYPE = {
  IMPURITY: 'impureza',
  MOISTURE: 'umidade',
  BROKEN: 'quebrado',
  GREEN: 'esverdeado',
  DAMAGED: 'avariado',
  RECEPTION_FEE: 'taxa_recepcao',
} as const;

// ORDEM FIXA EXATA (CLM-17) — impureza, umidade, quebrado, esverdeado,
// avariado, taxa_recepcao. NUNCA reordenar.
export const DISCOUNT_RULE_TYPES: DiscountRuleType[] = [
  DISCOUNT_RULE_TYPE.IMPURITY,
  DISCOUNT_RULE_TYPE.MOISTURE,
  DISCOUNT_RULE_TYPE.BROKEN,
  DISCOUNT_RULE_TYPE.GREEN,
  DISCOUNT_RULE_TYPE.DAMAGED,
  DISCOUNT_RULE_TYPE.RECEPTION_FEE,
];

/**
 * Rótulo do enum `DiscountRuleType`, SEMPRE via i18n (nunca hardcoded) —
 * consumido pela fábrica de opções (`options/discount-rule-type-options.ts`)
 * e fonte ordenada dos rótulos das 6 abas de regra (TASK-DT-FE-03).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<DiscountRuleType, string>} Mapa `DiscountRuleType` → rótulo traduzido.
 */
export const discountRuleTypeLabel = (
  languageGB: LanguageDate
): Record<DiscountRuleType, string> => ({
  impureza: languageGB.discountTables.discountTable.form.ruleTypes.impureza,
  umidade: languageGB.discountTables.discountTable.form.ruleTypes.umidade,
  quebrado: languageGB.discountTables.discountTable.form.ruleTypes.quebrado,
  esverdeado: languageGB.discountTables.discountTable.form.ruleTypes.esverdeado,
  avariado: languageGB.discountTables.discountTable.form.ruleTypes.avariado,
  taxa_recepcao: languageGB.discountTables.discountTable.form.ruleTypes.taxa_recepcao,
});
