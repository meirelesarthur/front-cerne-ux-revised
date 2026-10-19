// src/services/v2/FeedlotYards/feedlot-yard-service.ts
// -----------------------------------------------------------------------------
// FeedlotYard Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Confinamento — Pátio). Casa própria (entity-flat, mirror `Pastures`/
// `Appropriations`), TASK-PT-FE-01/02 (execução 046).
//
//   GET    /feedlot-yards          → paginado (meta REAL), feedlot-yards_view
//   POST   /feedlot-yards          → 201, feedlot-yards_create
//   GET    /feedlot-yards/{uuid}   → detalhe completo, feedlot-yards_view
//   PATCH  /feedlot-yards/{uuid}   → 200, feedlot-yards_edit
//   DELETE /feedlot-yards/{uuid}   → 204; 422 (message simples) se houver
//                                    setores vinculados
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
//
// `listFeedlotYards` ADAPTA o envelope `ApiResponse::paginated` (meta REAL)
// para o shape `ResponsePagination` que a infra de grid (`useCustomGridQuery`)
// consome — mesmo adaptador de `listPastures`/`listCostCenters`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateFeedlotYardRequest,
  FeedlotYardDetail,
  FeedlotYardFilterRequest,
  FeedlotYardListItem,
  FeedlotYardsApiPaginationMeta,
  FeedlotYardsListEnvelope,
  UpdateFeedlotYardRequest,
} from '@/@types/v2/FeedlotYards';

export interface ListFeedlotYardsParams extends PaginationQueryParams, FeedlotYardFilterRequest {}

async function listFeedlotYards(
  params: ListFeedlotYardsParams
): Promise<ResponsePagination<FeedlotYardListItem[]>> {
  const { data } = await api.V2.get<FeedlotYardsListEnvelope>('/feedlot-yards', {
    page: params.page,
    per_page: params.per_page,
    code: params.code || undefined,
    name: params.name || undefined,
    is_active: params.is_active,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getFeedlotYard(uuid: string): Promise<Response<FeedlotYardDetail>> {
  const { data } = await api.V2.get<Response<FeedlotYardDetail>>(`/feedlot-yards/${uuid}`);
  return data;
}

async function createFeedlotYard(
  payload: CreateFeedlotYardRequest
): Promise<Response<FeedlotYardDetail>> {
  const { data } = await api.V2.post<Response<FeedlotYardDetail>>('/feedlot-yards', payload);
  return data;
}

// PATCH (não PUT): payload PARCIAL por `dirtyFields` — mirror Lei 2 do
// `get_pwa_form_query_pattern` (TASK-PT-FE-02 §6.7). O backend registra a
// rota em ambos os verbos (`PUT/PATCH /feedlot-yards/{uuid}`); PATCH é o
// semanticamente correto para uma atualização parcial.
async function updateFeedlotYard(
  uuid: string,
  payload: UpdateFeedlotYardRequest
): Promise<Response<FeedlotYardDetail>> {
  const { data } = await api.V2.patch<Response<FeedlotYardDetail>>(
    `/feedlot-yards/${uuid}`,
    payload
  );
  return data;
}

async function deleteFeedlotYard(uuid: string) {
  const { data } = await api.V2.delete(`/feedlot-yards/${uuid}`);
  return data;
}

export {
  createFeedlotYard,
  deleteFeedlotYard,
  getFeedlotYard,
  listFeedlotYards,
  updateFeedlotYard,
};

// Reexport de conveniência do tipo do meta paginado (usado pelo envelope acima).
export type { FeedlotYardsApiPaginationMeta };
