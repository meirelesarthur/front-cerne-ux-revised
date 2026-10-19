// src/services/v2/FeedlotSectors/feedlot-sector-service.ts
// -----------------------------------------------------------------------------
// FeedlotSector Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Confinamento — Setor). Mirror `feedlot-yard-service.ts`, TASK-FS-FE-01/02.
//
//   GET    /feedlot-sectors          → paginado (meta REAL), feedlot-sectors_view
//   POST   /feedlot-sectors          → 201, feedlot-sectors_create
//   GET    /feedlot-sectors/{uuid}   → detalhe completo, feedlot-sectors_view
//   PATCH  /feedlot-sectors/{uuid}   → 200, feedlot-sectors_edit
//   DELETE /feedlot-sectors/{uuid}   → 204; 422 (message simples) se houver
//                                      currais/componentes vinculados
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
//
// O lookup de Pátio (select do formulário/filtro) REAPROVEITA `listFeedlotYards`
// de `src/services/v2/FeedlotYards/feedlot-yard-service.ts` — não duplicado
// aqui (contrato de tela §2.4/DA-FS-09).
//
// GAP conhecido (reportado, não corrigido aqui — fora do escopo do front):
// `feedlot_yard_id` é enviado como o UUID do Pátio, fiel ao contrato de tela
// (`FeedlotSector-contrato-tela.md §2.5`, "uuid, optional — igualdade exata"),
// mas `FeedlotSectorFilterData::$feedlot_yard_id` (backend) está tipado
// `int|Optional` e o Controller não resolve UUID→id antes de montar o Filter
// (diferente do que o próprio docblock do Data promete) — filtro por Pátio
// pode não funcionar/lançar erro de cast até a camada `api` corrigir isso.
// Ver Gap registrado pelo Executor (04-Gaps_Frontend_UI).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateFeedlotSectorRequest,
  FeedlotSectorDetail,
  FeedlotSectorFilterRequest,
  FeedlotSectorListItem,
  FeedlotSectorsApiPaginationMeta,
  FeedlotSectorsListEnvelope,
  UpdateFeedlotSectorRequest,
} from '@/@types/v2/FeedlotSectors';

export interface ListFeedlotSectorsParams
  extends PaginationQueryParams, FeedlotSectorFilterRequest {}

async function listFeedlotSectors(
  params: ListFeedlotSectorsParams
): Promise<ResponsePagination<FeedlotSectorListItem[]>> {
  const { data } = await api.V2.get<FeedlotSectorsListEnvelope>('/feedlot-sectors', {
    page: params.page,
    per_page: params.per_page,
    code: params.code || undefined,
    name: params.name || undefined,
    feedlot_yard_id: params.feedlot_yard_id || undefined,
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

async function getFeedlotSector(uuid: string): Promise<Response<FeedlotSectorDetail>> {
  const { data } = await api.V2.get<Response<FeedlotSectorDetail>>(`/feedlot-sectors/${uuid}`);
  return data;
}

async function createFeedlotSector(
  payload: CreateFeedlotSectorRequest
): Promise<Response<FeedlotSectorDetail>> {
  const { data } = await api.V2.post<Response<FeedlotSectorDetail>>('/feedlot-sectors', payload);
  return data;
}

// PATCH (não PUT): payload PARCIAL por `dirtyFields` — mirror Lei 2 do
// `get_pwa_form_query_pattern` (TASK-FS-FE-02 §6.7).
async function updateFeedlotSector(
  uuid: string,
  payload: UpdateFeedlotSectorRequest
): Promise<Response<FeedlotSectorDetail>> {
  const { data } = await api.V2.patch<Response<FeedlotSectorDetail>>(
    `/feedlot-sectors/${uuid}`,
    payload
  );
  return data;
}

async function deleteFeedlotSector(uuid: string) {
  const { data } = await api.V2.delete(`/feedlot-sectors/${uuid}`);
  return data;
}

export {
  createFeedlotSector,
  deleteFeedlotSector,
  getFeedlotSector,
  listFeedlotSectors,
  updateFeedlotSector,
};

// Reexport de conveniência do tipo do meta paginado (usado pelo envelope acima).
export type { FeedlotSectorsApiPaginationMeta };
