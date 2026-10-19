// src/services/v2/RatingServiceOrders/rating-service-order-service.ts
// -----------------------------------------------------------------------------
// Rating Service Order Service — API v1 do backend Laravel GB.Cerne
// (OPERACIONAL — Avaliações de Ordem de Serviço). Casa própria (mirror
// `service-order-service.ts`), esteira 041 (TASK-FE-041-AVL-01). API JÁ
// CONSTRUÍDA (commit `194a5b0e`):
//
//   GET /rating-service-orders          → paginado; listagem enxuta
//   GET /rating-service-orders/{uuid}   → hidratação de edição (reaproveita
//                                          `ServiceOrderDetailResource` —
//                                          shape `ServiceOrderDetail`)
//   PUT /rating-service-orders/{uuid}   → só os 4 campos de avaliação
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem POST/DELETE
// (mode_matrix NAO_APLICAVEL).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  RatingServiceOrderDetail,
  RatingServiceOrderFilterForm,
  RatingServiceOrderListItem,
  RatingServiceOrderPayload,
  RatingServiceOrdersListEnvelope,
} from '@/@types/v2/RatingServiceOrders';

export interface ListRatingServiceOrdersParams
  extends PaginationQueryParams, RatingServiceOrderFilterForm {}

async function getAllRatingServiceOrders(
  params: ListRatingServiceOrdersParams
): Promise<ResponsePagination<RatingServiceOrderListItem[]>> {
  const { data } = await api.V2.get<RatingServiceOrdersListEnvelope>('/rating-service-orders', {
    page: params.page,
    per_page: params.per_page,
    code: params.code || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getRatingServiceOrder(uuid: string) {
  const { data } = await api.V2.get<Response<RatingServiceOrderDetail>>(
    `/rating-service-orders/${uuid}`
  );
  return data;
}

async function updateRatingServiceOrder(uuid: string, payload: RatingServiceOrderPayload) {
  const { data } = await api.V2.put<Response<RatingServiceOrderDetail>>(
    `/rating-service-orders/${uuid}`,
    payload
  );
  return data;
}

export { getAllRatingServiceOrders, getRatingServiceOrder, updateRatingServiceOrder };
