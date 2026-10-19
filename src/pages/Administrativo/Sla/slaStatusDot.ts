// src/pages/Administrativo/Sla/slaStatusDot.ts
// -----------------------------------------------------------------------------
// Bolinha de cor por status da tela de Parâmetros SLA (execução 081,
// T-081-FE-04; legado `RequestPurchase::colors()`, paridade 11/P11). Devolve o
// NOME do token semântico `supplyStatusN` (light e dark), nunca hex fixo;
// status fora de 1..11 não tem bolinha.
// -----------------------------------------------------------------------------

import {
  requestPurchaseStatusDotToken,
  type RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

export function slaStatusDotToken(status: number | null | undefined): string | null {
  if (status == null) return null;
  return requestPurchaseStatusDotToken[status as RequestPurchaseStatus] ?? null;
}

/**
 * Contador do legado "N. Registros: {total}".
 * @param {string} template - Texto do idioma, com o marcador `{total}`.
 * @param {number} total - Quantidade de registros.
 * @return {string} Texto final do contador.
 */
export function formatSlaRecordsCount(template: string, total: number): string {
  return template.replace('{total}', String(total));
}
