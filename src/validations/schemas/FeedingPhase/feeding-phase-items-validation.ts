// src/validations/schemas/FeedingPhase/feeding-phase-items-validation.ts
// -----------------------------------------------------------------------------
// Validação IMEDIATA (pós-preenchimento) de Mín/Máx dos itens de Fase de
// Alimentação (FeedingPhase — Operacional/Pecuária/Confinamento, F-034),
// AUTORIZADA pelo dono na Esteira 051 como ajuste de fidelidade ao form
// legado (IG-02/IG-03): validar Mín/Máx APÓS o preenchimento (blur/troca de
// Regra de Troca) e exibir a mensagem, ADICIONAL à validação de submit do
// Yup (`feeding-phase-schema.ts`, que continua responsável por
// required/integer/min(1) e nunca foi removida).
//
// Escopo de fidelidade total (decisão do dono, nesta sessão):
//   1) Intra-item — `minimum_start` não pode ser maior que `maximum_end` da
//      MESMA linha (e vice-versa).
//   2) Cross-item — dentro da MESMA `change_rule`, na ORDEM dos itens
//      (faixas ascendentes, sem sobreposição): `minimum_start` do item deve
//      ser MAIOR que o `maximum_end` do item ANTERIOR de mesma regra;
//      `maximum_end` do item deve ser MENOR que o `minimum_start` do
//      PRÓXIMO item de mesma regra. Itens de `change_rule` diferentes nunca
//      conflitam entre si.
//
// Ao ficar inválido, o valor digitado é MANTIDO (nunca limpo) — apenas o
// erro inline + Toast são exibidos (decisão do dono, diverge do legado só
// nesse detalhe). Helper PURO (sem React/RHF) — o efeito colateral
// (`setError`/`toaster`) fica nos componentes de linha
// (`FeedingPhaseItemRow.tsx`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { FeedingPhaseChangeRule, FeedingPhaseItemForm } from '@/@types/v2/FeedingPhases';

export interface FeedingPhaseItemValidationMessages {
  minimumStartExceedsMaximumEnd: string;
  minimumStartMustExceedPreviousMaximumEnd: string;
  maximumEndBelowMinimumStart: string;
  maximumEndMustPrecedeNextMinimumStart: string;
}

/**
 * Constrói o bundle de mensagens a partir do `languageGB` ativo — NUNCA
 * string literal no call site (severidade de padrão desta Tarefa).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {FeedingPhaseItemValidationMessages} Mensagens traduzidas.
 */
export function feedingPhaseItemValidationMessages(
  languageGB: LanguageDate
): FeedingPhaseItemValidationMessages {
  const messages = languageGB.feedingPhases.feedingPhase.form.validation;
  return {
    minimumStartExceedsMaximumEnd: messages.itemMinimumStartExceedsMaximumEnd,
    minimumStartMustExceedPreviousMaximumEnd: messages.itemMinimumStartMustExceedPreviousMaximumEnd,
    maximumEndBelowMinimumStart: messages.itemMaximumEndBelowMinimumStart,
    maximumEndMustPrecedeNextMinimumStart: messages.itemMaximumEndMustPrecedeNextMinimumStart,
  };
}

// Inteiro válido (>= 1) — espelha o `min(1)`/`integer` do Yup. `undefined`
// para vazio/inválido: nesse caso a checagem IMEDIATA desta linha se omite
// e deixa o Yup (required/integer/min) reportar o erro base.
function toValidPositiveInt(value: number | string | undefined | null): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

/**
 * Item MAIS PRÓXIMO, ANTES de `index`, com a mesma `change_rule`.
 * @param {FeedingPhaseItemForm[]} items - Itens atuais do formulário.
 * @param {number} index - Índice do item de referência.
 * @param {FeedingPhaseChangeRule} changeRule - Regra de troca do item de referência.
 * @return {FeedingPhaseItemForm | undefined} Item anterior de mesma regra, se existir.
 */
export function findPreviousSameRuleItem(
  items: FeedingPhaseItemForm[],
  index: number,
  changeRule: FeedingPhaseChangeRule
): FeedingPhaseItemForm | undefined {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (items[i]?.change_rule?.value === changeRule) return items[i];
  }
  return undefined;
}

/**
 * Item MAIS PRÓXIMO, DEPOIS de `index`, com a mesma `change_rule`.
 * @param {FeedingPhaseItemForm[]} items - Itens atuais do formulário.
 * @param {number} index - Índice do item de referência.
 * @param {FeedingPhaseChangeRule} changeRule - Regra de troca do item de referência.
 * @return {FeedingPhaseItemForm | undefined} Próximo item de mesma regra, se existir.
 */
export function findNextSameRuleItem(
  items: FeedingPhaseItemForm[],
  index: number,
  changeRule: FeedingPhaseChangeRule
): FeedingPhaseItemForm | undefined {
  for (let i = index + 1; i < items.length; i += 1) {
    if (items[i]?.change_rule?.value === changeRule) return items[i];
  }
  return undefined;
}

/**
 * Valida `minimum_start` do item em `index`: intra-item (não maior que o
 * `maximum_end` da própria linha) + cross-item (maior que o `maximum_end`
 * do item ANTERIOR de mesma `change_rule`).
 * @param {FeedingPhaseItemForm[]} items - Itens atuais do formulário (já refletindo a edição corrente).
 * @param {number} index - Índice do item editado.
 * @param {FeedingPhaseItemValidationMessages} messages - Mensagens traduzidas.
 * @return {string | undefined} Mensagem de erro, ou `undefined` se válido/inconclusivo.
 */
export function validateFeedingPhaseItemMinimumStart(
  items: FeedingPhaseItemForm[],
  index: number,
  messages: FeedingPhaseItemValidationMessages
): string | undefined {
  const item = items[index];
  const minimum = toValidPositiveInt(item?.minimum_start);
  if (minimum === undefined) return undefined;

  const maximum = toValidPositiveInt(item?.maximum_end);
  if (maximum !== undefined && minimum > maximum) {
    return messages.minimumStartExceedsMaximumEnd;
  }

  const changeRule = item?.change_rule?.value;
  if (changeRule) {
    const previous = findPreviousSameRuleItem(items, index, changeRule);
    const previousMaximum = toValidPositiveInt(previous?.maximum_end);
    if (previousMaximum !== undefined && minimum <= previousMaximum) {
      return messages.minimumStartMustExceedPreviousMaximumEnd;
    }
  }

  return undefined;
}

/**
 * Valida `maximum_end` do item em `index`: intra-item (não menor que o
 * `minimum_start` da própria linha) + cross-item (menor que o
 * `minimum_start` do PRÓXIMO item de mesma `change_rule`).
 * @param {FeedingPhaseItemForm[]} items - Itens atuais do formulário (já refletindo a edição corrente).
 * @param {number} index - Índice do item editado.
 * @param {FeedingPhaseItemValidationMessages} messages - Mensagens traduzidas.
 * @return {string | undefined} Mensagem de erro, ou `undefined` se válido/inconclusivo.
 */
export function validateFeedingPhaseItemMaximumEnd(
  items: FeedingPhaseItemForm[],
  index: number,
  messages: FeedingPhaseItemValidationMessages
): string | undefined {
  const item = items[index];
  const maximum = toValidPositiveInt(item?.maximum_end);
  if (maximum === undefined) return undefined;

  const minimum = toValidPositiveInt(item?.minimum_start);
  if (minimum !== undefined && maximum < minimum) {
    return messages.maximumEndBelowMinimumStart;
  }

  const changeRule = item?.change_rule?.value;
  if (changeRule) {
    const next = findNextSameRuleItem(items, index, changeRule);
    const nextMinimum = toValidPositiveInt(next?.minimum_start);
    if (nextMinimum !== undefined && maximum >= nextMinimum) {
      return messages.maximumEndMustPrecedeNextMinimumStart;
    }
  }

  return undefined;
}
