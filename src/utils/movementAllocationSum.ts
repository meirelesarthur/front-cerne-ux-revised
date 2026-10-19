// src/utils/movementAllocationSum.ts
// Soma/validação de allocations[].value vs. o valor do cabeçalho — mirror
// front do que `OpenMovement` já valida no backend (`guardRateioSum`,
// StoreOpenMovementAction.php:106-122). Compartilhado entre o schema Yup do
// form completo (movement-schema.ts, cross-field via `this.parent.value`) e
// a guarda manual do form dedicado de edit-rateio (EditRateioMovimento.tsx,
// que não tem `value` de cabeçalho no próprio useForm — TASK-MV-FE-08).

function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Soma pura de `allocations[].value` (linhas nulas/sem `value` contam como 0).
 * @param {Array} allocations - Linhas de rateio (`{ value }` cada), ou `null`/`undefined`.
 * @return {number} Soma numérica das linhas.
 */
export function sumAllocationsValue(
  allocations: Array<{ value?: number | string | null } | null | undefined> | null | undefined
): number {
  return (allocations ?? []).reduce((sum, item) => sum + (Number(item?.value) || 0), 0);
}

/**
 * Compara a soma de `allocations[].value` com o valor do cabeçalho, com
 * tolerância de 1 centavo — mesma já usada pelo badge cosmético existente
 * (`isBalanced`, `MovementAllocationEditor.tsx`).
 * @param {Array} allocations - Linhas de rateio (`{ value }` cada), ou `null`/`undefined`.
 * @param {number|string|null|undefined} headerValue - Valor do cabeçalho do movimento.
 * @return {boolean} `true` quando a soma bate com o cabeçalho (tolerância de 1 centavo).
 */
export function allocationsSumMatchesHeader(
  allocations: Array<{ value?: number | string | null } | null | undefined> | null | undefined,
  headerValue: number | string | null | undefined
): boolean {
  return (
    Math.abs(round2(sumAllocationsValue(allocations)) - round2(Number(headerValue) || 0)) < 0.01
  );
}
