// src/validations/schemas/Diet/diet-ingredients-sum-schema.ts
// -----------------------------------------------------------------------------
// Helper de validação de soma de percentuais da composição de Dieta (Diet —
// Operacional/Pecuária, TASK-FE-DIET-01), mirror EXATO
// `Food/feedstocks-sum-schema.ts`. Quando `type === 'P'`, a soma de
// `ingredients[].quantity` (campo dual PERCENTUAL/QUANTIDADE FIXA conforme
// `Diet.type`, mesmo racional de `Food.percentage`) deve ser `=== 100`
// (tolerância de ponto flutuante) — `arquitetura-frontend-dieta.md §4.2`
// (SR-BTN-07): "botão Salvar desabilitado quando soma dos percentuais ≠
// 100%". Client-side ONLY — confirmado por leitura direta de
// `DietRequest.php`/`app/Rules/`: NÃO existe uma `FeedstocksPercentageSumRule`
// equivalente para Diet no backend (diferente de Food) — a trava é
// EXCLUSIVAMENTE desta camada.
//
// Quando `type === 'U'` (ou qualquer valor diferente de `'P'`), a trava
// NUNCA reprova.
// -----------------------------------------------------------------------------

/** Tolerância de ponto flutuante — evita falso-negativo (ex.: 33.33 × 3 = 99.99...). */
const SUM_TOLERANCE = 0.01;

const EXPECTED_SUM = 100;

export interface DietIngredientQuantityItem {
  quantity?: number | string | null;
}

/**
 * Confere se a soma de `ingredients[].quantity` é válida para o `type`
 * informado. `type === 'P'` exige soma `=== 100` (tolerância de ponto
 * flutuante); qualquer outro `type` (`'U'`) é sempre válido — sem trava.
 * @param {DietIngredientQuantityItem[] | null | undefined} items - Linhas de composição do form.
 * @param {string | null | undefined} type - Valor cru de `DietType` ('P' | 'U').
 * @return {boolean} `true` quando a soma é válida (ou quando a trava não se aplica).
 */
export function dietIngredientsSumIsValid(
  items: DietIngredientQuantityItem[] | null | undefined,
  type: string | null | undefined
): boolean {
  if (type !== 'P') return true;
  // Array vazio já é reprovado pelo `.min(1)` do schema — esta trava não
  // precisa duplicar essa mensagem.
  if (!items || items.length === 0) return true;

  const sum = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  return Math.abs(sum - EXPECTED_SUM) < SUM_TOLERANCE;
}
