// src/services/v2/DeathLosses/death-loss-service.ts
// -----------------------------------------------------------------------------
// DeathLoss Service — API v1 do backend Laravel GB.Cerne (Causa Morte/Perda).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
// `DeathLoss` pagina de verdade (`ApiResponse::paginated`, `meta` sempre
// populado) — mirror `breed-service.ts` (NÃO um módulo de `meta: null`, como
// `Species`).
//   GET    /death-losses          → data: DeathLossListItem[], meta com
//                                    paginação real (current_page, last_page,
//                                    per_page, total, ...).
//   GET    /death-losses/{uuid}   → data: DeathLossData
//   POST   /death-losses          → payload DeathLossPayload
//   PUT    /death-losses/{uuid}   → payload DeathLossPayload (SEMPRE completo
//                                    — `DeathLossRequest::rules()` não
//                                    diferencia store/update)
//   DELETE /death-losses/{uuid}   → 204; 422 estruturado se em uso
//                                    (`death_animals.cause_id`)
//   GET    /death-losses/options  → data: DeathLossOptionRef[], meta com
//                                    paginação real — lookup unificado do
//                                    Select de Causa (Perdas `cause=P` /
//                                    Mortes `cause=M`), `is_enabled=true`
//                                    fixo no backend (ver `listDeathLossOptions`).
//
// `listDeathLosses` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listBreeds`. Catálogo GLOBAL — nunca enviar `X-Farm-Id`
// manualmente (o interceptor axios global anexa por padrão; o backend ignora).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DeathLossData,
  DeathLossListItem,
  DeathLossOptionRef,
  DeathLossPayload,
  DeathLossesApiPaginationMeta,
  DeathLossesListEnvelope,
} from '@/@types/v2/DeathLosses';

export interface ListDeathLossesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  specie_uuid?: string;
  cause?: string;
}

async function listDeathLosses(
  params: ListDeathLossesParams
): Promise<ResponsePagination<DeathLossListItem[]>> {
  const { data } = await api.V2.get<DeathLossesListEnvelope>('/death-losses', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    specie_uuid: params.specie_uuid || undefined,
    cause: params.cause || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listBreeds`.
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

async function getDeathLossByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<DeathLossData>>(`/death-losses/${uuid}`);
  return data;
}

async function createDeathLoss(payload: DeathLossPayload) {
  const { data } = await api.V2.post<Response<DeathLossData>>('/death-losses', payload);
  return data;
}

// Payload SEMPRE completo — DeathLossRequest::rules() não diferencia por verbo.
async function updateDeathLoss(uuid: string, payload: DeathLossPayload) {
  const { data } = await api.V2.put<Response<DeathLossData>>(`/death-losses/${uuid}`, payload);
  return data;
}

async function deleteDeathLoss(uuid: string) {
  const { data } = await api.V2.delete(`/death-losses/${uuid}`);
  return data;
}

// GET /death-losses/options?cause=&search=&page=&per_page= — unificação
// pós-merge (TASK-FE-2771/TASK-DA-FE-02 divergiam contra `/death-losses/
// active`: a 040 paginava `DeathLossListItem[]` com `cause` opcional, o
// develop lia flat `DeathLossOptionRef[]` com `cause` fixo `'M'` no service).
// O contrato novo, criado em paralelo a esta resolução, consolida os dois
// lookups (Select de Causa do formulário/filtro de Perdas `cause=P` e de
// Mortes `cause=M`) num único endpoint PAGINADO real (`ApiResponse::
// paginated`, `meta` sempre populado — igual `listDeathLosses` acima, NÃO
// mais o envelope flat do `active()`), `is_enabled=true` sempre fixo no
// backend. `cause` é opcional e passado pelo caller via `findParams` do
// `SelectAsyncPaginate` (mirror do padrão de `listDeathLosses`/
// `listBreeds`) — mesmo adaptador de envelope→`ResponsePagination`.
export interface ListDeathLossOptionsParams extends PaginationQueryParams {
  search?: string;
  cause?: string;
}

interface DeathLossOptionsEnvelope {
  success: boolean;
  message: string;
  data: DeathLossOptionRef[];
  errors: Record<string, string[]> | null;
  meta: DeathLossesApiPaginationMeta | null;
}

async function listDeathLossOptions(
  params: ListDeathLossOptionsParams
): Promise<ResponsePagination<DeathLossOptionRef[]>> {
  const { data } = await api.V2.get<DeathLossOptionsEnvelope>('/death-losses/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    cause: params.cause || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listDeathLosses`/`listBreeds`.
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

export {
  createDeathLoss,
  deleteDeathLoss,
  getDeathLossByUuid,
  listDeathLosses,
  listDeathLossOptions,
  updateDeathLoss,
};
