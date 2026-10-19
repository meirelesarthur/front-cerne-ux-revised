// src/pages/Administrativo/Cotacoes/separateAtQuotationRules.ts
// -----------------------------------------------------------------------------
// Regras PURAS do diálogo "Criar Sub Solicitação" na cotação (execução 081,
// T-081-FE-08; LEGADO 05 P73/V25, 10 PS12): rótulo do item e validação mínima.
// -----------------------------------------------------------------------------

import type { RequestItemRow } from '@/@types/v2/RequestPurchases';

// Rótulo do item: descrição, senão o produto (legado lista a descrição do item).
export function buildSeparateItemLabel(item: RequestItemRow): string {
  const base = item.description ?? item.product?.description ?? item.uuid;
  return item.quantity !== null && item.quantity !== undefined
    ? `${base} (${item.quantity})`
    : base;
}

// "Selecione ao menos um item" (legado IG-16, `#btn-submit`).
export function canSubmitSeparation(selectedUuids: ReadonlyArray<string>): boolean {
  return selectedUuids.length > 0;
}
