// src/services/v2/FeedlotCorrals/feedlot-corral-service.ts
// -----------------------------------------------------------------------------
// FeedlotCorral Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Confinamento — Curral). Casa própria, TASK-FE-042-206 (execução 042).
//
//   GET  /feedlot-corrals/options → os 5 enums do form + cochos/bebedouros
//                                   disponíveis (`corral_uuid` opcional,
//                                   inclui o vínculo atual em editar).
//   POST /feedlot-corrals         → 201, feedlot-corrals_create (duplicar
//                                   usa este MESMO endpoint, sem `id`).
//   PUT  /feedlot-corrals/{uuid}  → 200, feedlot-corrals_edit.
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AttachFeedlotCorralBatchesRequest,
  CreateFeedlotCorralRequest,
  FeedlotCorralAvailableForBatchOption,
  FeedlotCorralDetail,
  FeedlotCorralFilterRequest,
  FeedlotCorralHistoriesListEnvelope,
  FeedlotCorralHistoryItem,
  FeedlotCorralListItem,
  FeedlotCorralOptions,
  FeedlotCorralsApiPaginationMeta,
  FeedlotCorralsListEnvelope,
  UpdateFeedlotCorralRequest,
  UpdateFeedlotCorralStatusRequest,
} from '@/@types/v2/FeedlotCorrals';

// -----------------------------------------------------------------------------
// Tela standalone de Currais (F-035, lote 043, TASK-043-CUR-T01) — ADITIVO
// (`listFeedlotCorrals`/`deleteFeedlotCorral`). Mirror `listFeedlotSectors`/
// `deleteFeedlotSector` (`feedlot-sector-service.ts`) — adapta o envelope
// `ApiResponse::paginated` para `ResponsePagination` (grid V3). As demais
// funções acima (get/options/create/update/updateCorralStatus) ficam
// INTOCADAS — reuso as-is pelo `FeedlotCorralDialog`/`FeedlotCorralStatusDialog`
// do Mapa.
// -----------------------------------------------------------------------------

export interface ListFeedlotCorralsParams
  extends PaginationQueryParams, FeedlotCorralFilterRequest {}

async function listFeedlotCorrals(
  params: ListFeedlotCorralsParams
): Promise<ResponsePagination<FeedlotCorralListItem[]>> {
  const { data } = await api.V2.get<FeedlotCorralsListEnvelope>('/feedlot-corrals', {
    page: params.page,
    per_page: params.per_page,
    name: params.name || undefined,
    feedlot_sector_id: params.feedlot_sector_id || undefined,
    status: params.status || undefined,
  });

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

async function deleteFeedlotCorral(uuid: string) {
  const { data } = await api.V2.delete(`/feedlot-corrals/${uuid}`);
  return data;
}

async function getFeedlotCorral(uuid: string): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.get<Response<FeedlotCorralDetail>>(`/feedlot-corrals/${uuid}`);
  return data;
}

async function getFeedlotCorralOptions(
  corralUuid?: string
): Promise<Response<FeedlotCorralOptions>> {
  const { data } = await api.V2.get<Response<FeedlotCorralOptions>>('/feedlot-corrals/options', {
    corral_uuid: corralUuid || undefined,
  });
  return data;
}

async function createFeedlotCorral(
  payload: CreateFeedlotCorralRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.post<Response<FeedlotCorralDetail>>('/feedlot-corrals', payload);
  return data;
}

async function updateFeedlotCorral(
  uuid: string,
  payload: UpdateFeedlotCorralRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.put<Response<FeedlotCorralDetail>>(
    `/feedlot-corrals/${uuid}`,
    payload
  );
  return data;
}

// Troca de status (`R27`, `AM13`, `TASK-FE-042-208`) — fluxo PRÓPRIO
// (histórico + detach de lotes em cascata no backend), separado do
// `update()` genérico (que NUNCA altera `status`, `prohibited` no
// `FeedlotCorralRequest`). `feedlot-map_manage`, não `feedlot-corrals_edit`.
async function updateCorralStatus(
  uuid: string,
  payload: UpdateFeedlotCorralStatusRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.put<Response<FeedlotCorralDetail>>(
    `/feedlot-corrals/${uuid}/status`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Anexo de lotes pela tela standalone (T06, GAP-API-06, `TASK-BE-043-CUR-02`)
// — `PUT /feedlot-corrals/{uuid}/batches` (`syncBatchesFromForm`), endpoint
// NOVO e corral-scoped sob `feedlot-corrals_edit` (PARADA-API-07 Opção A,
// confirmado em `AttachFeedlotCorralBatchesRequest::authorize()`,
// GB.Cerne.Api). NÃO é `syncCorralBatches` do Mapa (`FeedlotMap/
// feedlot-map-service.ts`, gate `feedlot-map_manage`, exige datas) — aquela
// assinatura permanece intocada.
// -----------------------------------------------------------------------------
async function attachFeedlotCorralBatches(
  uuid: string,
  payload: AttachFeedlotCorralBatchesRequest
): Promise<Response<FeedlotCorralDetail>> {
  const { data } = await api.V2.put<Response<FeedlotCorralDetail>>(
    `/feedlot-corrals/${uuid}/batches`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Histórico de situação (T09, GAP-API-01, `TASK-BE-043-CUR-01`) —
// `GET /feedlot-corrals/{uuid}/histories`, corral-scoped, `useCustomGridQueryById`
// (mirror `listIbptItems`/`ibpt-service.ts` — adapta o envelope
// `ApiResponse::paginated` para `ResponsePagination`). Backend ordena
// `created_at DESC` internamente (`FeedlotCorralRepository::
// paginateStatusHistories`) — sem `orderBy` no request.
// -----------------------------------------------------------------------------
async function listFeedlotCorralHistories(
  uuid: string,
  params: PaginationQueryParams
): Promise<ResponsePagination<FeedlotCorralHistoryItem[]>> {
  const { data } = await api.V2.get<FeedlotCorralHistoriesListEnvelope>(
    `/feedlot-corrals/${uuid}/histories`,
    {
      page: params.page,
      per_page: params.per_page,
    }
  );

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

// -----------------------------------------------------------------------------
// Picklist "Curral Confinamento" do modal "Novo Lote" (TASK-063-PROC-QA3-06,
// execução 063, roteiro `processamento-novolote-roteiro-qa3.md` §4) —
// `GET /feedlot-corrals/available-for-batch`, endpoint NOVO sob `farm.context`
// SEM permissão própria (mirror `listFeedlotCorralAvailableForBatchAction`,
// GB.Cerne.Api). Já devolve `{value,label}` filtrado/rotulado pelo backend
// (currais com vaga, `"{nome} | Capacidade: x/y | Situação: ..."`) — o front
// só adapta o envelope `ApiResponse::success` (`meta:null`, sem paginação
// real) para `ResponsePagination`, mesmo truque de `listCategoryAnimalOptions`/
// `listSpecies`, para casar com o contrato `service` do `SelectAsyncPaginate`.
// O parâmetro é exigido pela ASSINATURA do contrato `service` (mesmo shape de
// `listCategoryAnimalOptions`/`listSpecies`), mas o endpoint NÃO aceita
// `search`/paginação (`ListFeedlotCorralAvailableForBatchAction::handle(farmId)`)
// — por isso não é encaminhado ao axios.
// -----------------------------------------------------------------------------
async function listFeedlotCorralAvailableForBatch(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: PaginationQueryParams
): Promise<ResponsePagination<FeedlotCorralAvailableForBatchOption[]>> {
  const { data } = await api.V2.get<Response<FeedlotCorralAvailableForBatchOption[]>>(
    '/feedlot-corrals/available-for-batch'
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export {
  attachFeedlotCorralBatches,
  createFeedlotCorral,
  deleteFeedlotCorral,
  getFeedlotCorral,
  getFeedlotCorralOptions,
  listFeedlotCorralAvailableForBatch,
  listFeedlotCorralHistories,
  listFeedlotCorrals,
  updateCorralStatus,
  updateFeedlotCorral,
};

// Reexport de conveniência do tipo do meta paginado (usado pelo envelope acima).
export type { FeedlotCorralsApiPaginationMeta };
