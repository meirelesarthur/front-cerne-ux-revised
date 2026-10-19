// src/constants/RequestReceipts/request-receipt-status.ts
// -----------------------------------------------------------------------------
// Recebimentos NÃO cunha um enum de status próprio — opera sobre o MESMO
// enum `requestPurchaseStatus`/`requestPurchaseStatusColor` já existente
// (`@/constants/RequestPurchases/request-purchase-status`), restrito ao
// subconjunto `{7 compraEfetuada, 8 compraRecebida, 9 pedidoFinalizado}`
// (arquitetura-frontend-recebimentos.md §5.1) — mirror do padrão de
// restrição já usado por `RequestAuthorizations/request-authorization-
// status-options.ts` (subconjunto {3,4,11}).
// -----------------------------------------------------------------------------

import {
  requestPurchaseStatus,
  requestPurchaseStatusColor,
  RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

/** Subconjunto fechado de status válidos no hub de Recebimentos. */
export const REQUEST_RECEIPT_STATUSES: RequestPurchaseStatus[] = [
  requestPurchaseStatus.compraEfetuada,
  requestPurchaseStatus.compraRecebida,
  requestPurchaseStatus.pedidoFinalizado,
];

// Reexport direto — Recebimentos usa os MESMOS valores/cores, sem
// remapeamento (não há divergência visual a corrigir aqui).
export { requestPurchaseStatus, requestPurchaseStatusColor };
export type { RequestPurchaseStatus };
