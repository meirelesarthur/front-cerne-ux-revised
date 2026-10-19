// src/constants/serviceOrders/service-order-cancel-rules.ts
// -----------------------------------------------------------------------------
// Regras de domínio do cancelamento de Ordem de Serviço (execução 086, FE-01) —
// espelho de `CancelServiceOrderRequest` / `CancelServiceOrderAction` do
// backend (a autoridade final é sempre o 422 da API). Nunca literais soltos em
// componente/schema.
// -----------------------------------------------------------------------------

import type { ServiceOrderStatusValue } from '@/@types/v2/ServiceOrders';

/** `cancellation_reason`: `min:5` do `CancelServiceOrderRequest`. */
export const SERVICE_ORDER_CANCELLATION_REASON_MIN = 5;

/** `cancellation_reason`: `max:1000` do `CancelServiceOrderRequest`. */
export const SERVICE_ORDER_CANCELLATION_REASON_MAX = 1000;

/** Só OS Aberta (1) ou Em Execução (2) pode ser cancelada
 *  (`CancelServiceOrderAction` → 422 nos demais status). */
export const SERVICE_ORDER_CANCELLABLE_STATUSES: readonly ServiceOrderStatusValue[] = [1, 2];

/** Permissão exigida pela rota `POST /service-orders/{uuid}/cancel`. */
export const SERVICE_ORDER_CANCEL_PERMISSION = 'service-orders_cancel';
