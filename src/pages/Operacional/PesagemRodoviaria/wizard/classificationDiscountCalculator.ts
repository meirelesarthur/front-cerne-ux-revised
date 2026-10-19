// src/pages/Operacional/PesagemRodoviaria/wizard/classificationDiscountCalculator.ts
// -----------------------------------------------------------------------------
// Cálculo PURO (sem Model/estado) do desconto de classificação — espelho
// client-side do `ModuleWeighingCalculator` do backend
// (`CONTRATO-API-PESAGEM §5.3`), usado SÓ para feedback imediato em tela
// (`ClassificationDiscountPreview.tsx`) — o servidor é a fonte de verdade
// oficial (recalcula e persiste no `PUT next-step`).
//
// `GW` (sobre o peso bruto, base FIXA, não cumulativo) — cada chave aplicada
// desconta sobre o MESMO `grossWeight`.
// `PD` (sobre peso bruto MENOS desconto anterior, base DECRESCENTE,
// cumulativo) — cada chave aplicada desconta sobre o saldo já reduzido
// pelas chaves anteriores (na ORDEM em que a API devolveu as faixas —
// `GAP-PES-05`, nunca reordenar client-side).
//
// "Primeira faixa inclusiva" (IG-014) — para cada chave, a primeira faixa
// cujo intervalo [`initial_limit_percent`, `final_limit_percent`] contém o
// percentual informado.
//
// `rules` vem de `ModuleWeighingNextStepHydration.discount_rules` (correção
// 050, Bug 2) — shape REAL do backend (`type` como string crua, não
// `{value,label}`), já filtrado pelo servidor para a tabela/produto
// vinculados ao `ModuleWeighing` (nunca a lista completa de uma
// `DiscountTable`, que é outro shape — `DiscountRuleRef` de
// `@/@types/v2/DiscountTables`).
// -----------------------------------------------------------------------------

import type { DiscountRuleType, DiscountTableCalculationBase } from '@/@types/v2/DiscountTables';
import type { ModuleWeighingDiscountRuleRef } from '@/@types/v2/ModuleWeighing/module-weighing';

export interface ClassificationKeyInput {
  key: DiscountRuleType;
  percent: number | null;
  /**
   * Percentual de desconto JÁ RESOLVIDO (0-100) para esta chave — correção
   * 050 (D4). Quem resolve é o chamador (`StepClassificacao.tsx`), conforme
   * o modo: COM tabela, `resolveAppliedPercent` (checkbox + `discountRules`);
   * SEM tabela, o valor digitado manualmente (`appliedManual`) usado direto,
   * sem passar por `discountRules` (que não existem nesse modo). Nunca mais
   * um boolean cru aqui — este cálculo só soma/pondera, não decide origem.
   */
  rate: number;
}

export interface ClassificationDiscountResult {
  perKeyDiscount: Record<DiscountRuleType, number>;
  totalDiscount: number;
}

function findMatchingRule(
  rules: ModuleWeighingDiscountRuleRef[],
  key: DiscountRuleType,
  percent: number
): ModuleWeighingDiscountRuleRef | undefined {
  // Ordem PRESERVADA (sem `.sort()`) — mesma ordem que a API devolveu
  // (`GAP-PES-05`, `[SUGERIDO]`).
  return rules
    .filter((rule) => rule.type === key)
    .find((rule) => percent >= rule.initial_limit_percent && percent <= rule.final_limit_percent);
}

/**
 * Resolve o PERCENTUAL DE DESCONTO (`applied`, float) de uma chave de
 * classificação a partir da faixa aplicável de `discount_rules` (correção
 * 050, DIV-01) — mesma resolução usada pelo preview (`calculateClassification
 * Discount` abaixo) e pelo payload de submissão (`StepClassificacao.tsx`,
 * `onSubmit`), garantindo paridade com `ModuleWeighingCalculator::
 * applyDiscounts()` no servidor: `0` quando o item não foi marcado como
 * aplicado (`checked=false`) ou nenhuma faixa contém o `percent` informado.
 *
 * @param {DiscountRuleType} key Chave de classificação (`impureza`/`umidade`/...).
 * @param {number | null} percent Percentual medido/informado, ou `null`.
 * @param {boolean} checked Estado do checkbox local "aplicar este desconto".
 * @param {ModuleWeighingDiscountRuleRef[]} rules Faixas de desconto
 *   (`discount_rules`) filtradas pelo backend.
 * @return {number} Percentual de desconto resolvido (`0` quando não aplicável).
 */
export function resolveAppliedPercent(
  key: DiscountRuleType,
  percent: number | null,
  checked: boolean,
  rules: ModuleWeighingDiscountRuleRef[]
): number {
  if (!checked || percent == null) return 0;
  const rule = findMatchingRule(rules, key, percent);
  return rule?.discount_percent ?? 0;
}

export function calculateClassificationDiscount(
  grossWeight: number | null,
  items: ClassificationKeyInput[],
  calculationBase: DiscountTableCalculationBase
): ClassificationDiscountResult {
  const perKeyDiscount = {} as Record<DiscountRuleType, number>;
  let totalDiscount = 0;

  if (grossWeight == null) {
    items.forEach((item) => {
      perKeyDiscount[item.key] = 0;
    });
    return { perKeyDiscount, totalDiscount };
  }

  let remainingBase = grossWeight;

  for (const item of items) {
    const rate = item.rate;
    if (!rate) {
      perKeyDiscount[item.key] = 0;
      continue;
    }
    const discountBase = calculationBase === 'GW' ? grossWeight : remainingBase;
    const discount = discountBase * (rate / 100);
    perKeyDiscount[item.key] = discount;
    totalDiscount += discount;
    if (calculationBase === 'PD') remainingBase -= discount;
  }

  return { perKeyDiscount, totalDiscount };
}
