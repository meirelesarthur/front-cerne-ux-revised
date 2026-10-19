// src/validations/schemas/Food/feedstocks-sum-schema.ts
// -----------------------------------------------------------------------------
// Helper de validação de soma de percentuais da composição de Formulação
// (Food — Fábrica/Ração, TASK-FOOD-FE-02). Mirror do `.test()` cross-field
// já usado em `movement-schema.ts` (`allocationsSumMatchesHeader`,
// `@/utils/movementAllocationSum.ts`) — aqui a trava é: quando
// `type === 'P'`, a soma de `feedstocks[].percentage` deve ser `=== 100`
// (tolerância de ponto flutuante), espelhando `handleTotal()`/
// `.btn-save-food` do legado (`_forms.blade.php:158-178`) e a Decisão 4
// (APROVADA) do `Food-contrato.md §9` — o backend também valida soma=100
// server-side quando `type='P'` (`FeedstocksPercentageSumRule`). Requisito
// EXPLÍCITO do dono para este ciclo (task-packet, inviolável): a MESMA trava
// também no client — defesa em profundidade.
//
// Quando `type === 'U'` (ou qualquer valor diferente de `'P'`), a trava
// NUNCA reprova — mirror regra 10 da Doc Bruta (sem soma obrigatória para
// quantidade fixa).
// -----------------------------------------------------------------------------

/** Tolerância de ponto flutuante — evita falso-negativo (ex.: 33.33 × 3 = 99.99...). */
const SUM_TOLERANCE = 0.01;

const EXPECTED_SUM = 100;

export interface FeedstockPercentageItem {
  percentage?: number | string | null;
}

/**
 * Confere se a soma de `feedstocks[].percentage` é válida para o `type`
 * informado. `type === 'P'` exige soma `=== 100` (tolerância de ponto
 * flutuante); qualquer outro `type` (`'U'`) é sempre válido — sem trava.
 * @param {FeedstockPercentageItem[] | null | undefined} items - Linhas de composição do form.
 * @param {string | null | undefined} type - Valor cru de `FoodType` ('P' | 'U').
 * @return {boolean} `true` quando a soma é válida (ou quando a trava não se aplica).
 */
export function feedstocksSumIsValid(
  items: FeedstockPercentageItem[] | null | undefined,
  type: string | null | undefined
): boolean {
  if (type !== 'P') return true;
  // Array vazio já é reprovado pelo `.min(1)` do schema — esta trava não
  // precisa duplicar essa mensagem.
  if (!items || items.length === 0) return true;

  const sum = items.reduce((total, item) => total + (Number(item.percentage) || 0), 0);
  return Math.abs(sum - EXPECTED_SUM) < SUM_TOLERANCE;
}
