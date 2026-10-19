// src/services/v2/ScheduledReviews/scheduled-review-service.ts
// -----------------------------------------------------------------------------
// Scheduled Review Service — API v1 do backend Laravel GB.Cerne (Revisões
// Agendadas).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /scheduled-reviews → data: ScheduledReviewListItem[], meta REAL
//                            (paginação Laravel, `ApiResponse::paginated`,
//                            10/página default). Ordenado por `date` DESC
//                            NULLS LAST. SEM filtros — só `page`/`per_page`.
//
// `listScheduledReviews` ADAPTA o envelope `ApiResponse::paginated` (meta
// REAL) para o shape `ResponsePagination` que `useCustomGridQuery` consome —
// mesmo adaptador estrutural de `listStates`/`state-service.ts`
// (TASK-REVAG-FE-01, contrato-tela §2).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  ScheduledReviewListItem,
  ScheduledReviewsListEnvelope,
} from '@/@types/v2/ScheduledReviews';

// Params aceitos pela listagem — endpoint sem filtros, só paginação real
// (`page`/`per_page`), mesma convenção de `ListStatesParams` sem o `search`.
export type ListScheduledReviewsParams = Pick<PaginationQueryParams, 'page' | 'per_page'>;

async function listScheduledReviews(
  params: ListScheduledReviewsParams
): Promise<ResponsePagination<ScheduledReviewListItem[]>> {
  const { data } = await api.V2.get<ScheduledReviewsListEnvelope>('/scheduled-reviews', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listStates/listCities), NÃO fabrica mais 1 página só
  // a partir do array inteiro.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export { listScheduledReviews };
