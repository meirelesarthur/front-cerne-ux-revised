// src/services/v2/BreedingSeasons/breeding-season-service.ts
// -----------------------------------------------------------------------------
// Breeding Season Service — API v1 do backend Laravel GB.Cerne (Estação de
// Monta, Operacional / Reprodução, 97-Esteiras/003, Tarefas 12/13). Mirror
// estrutural de `absence-service.ts` (mesmo adaptador do envelope paginado
// real `ApiResponse::paginated` → `ResponsePagination`, consumido pela grid
// via `useCustomGridQuery`) + `proprietary-service.ts` (mirror exato de
// `listProprietaryOptions` para o lookup PLANO de `user-options`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /breeding-seasons               → data: BreedingSeasonListItem[] +
//                                             meta paginação real (filtro
//                                             opcional `user_uuid`)
//   GET    /breeding-seasons/user-options  → data: UserOption[] — resposta
//                                             PLANA (sem paginação, sem
//                                             `meta`) — NUNCA
//                                             `SelectAsyncPaginate`.
//   GET    /breeding-seasons/next-code     → data: { code: string } —
//                                             sugestão de código, só em modo
//                                             criação (Tarefa 13).
//   GET    /breeding-seasons/{uuid}        → data: BreedingSeasonDetail
//                                             (`days`/`weeks` computados no
//                                             servidor).
//   POST   /breeding-seasons               → payload BreedingSeasonPayload
//                                             (Tarefa 13).
//   PUT    /breeding-seasons/{uuid}        → payload BreedingSeasonPayload
//                                             (Tarefa 13).
//   DELETE /breeding-seasons/{uuid}        → hard delete; 422 possível
//                                             (`BusinessRuleException`, FK
//                                             filha) — exibir a mensagem do
//                                             servidor tal como vem.
//
// `createBreedingSeason`/`updateBreedingSeason`/`getBreedingSeasonNextCode`
// só são CONSUMIDOS pela Tarefa 13 (formulário), mas nascem aqui junto do
// resto do service — fundação completa do módulo (mirror da nota já usada em
// `employee-event-service.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BreedingSeasonDetail,
  BreedingSeasonListItem,
  BreedingSeasonPayload,
  BreedingSeasonsListEnvelope,
  UserOption,
} from '@/@types/v2/BreedingSeasons';

// Params aceitos pela listagem — paginação real + filtro opcional do backend
// (`BreedingSeasonFilterData`): `user_uuid` + `search` (mirror EXATO do campo
// `search` de `listWarehouseOptions`/`listProductOptions` — paridade exigida
// para o `SelectAsyncPaginate` de Estação de Monta filtrar ao digitar).
export interface ListBreedingSeasonsParams extends PaginationQueryParams {
  user_uuid?: string;
  search?: string;
}

async function listBreedingSeasons(
  params: ListBreedingSeasonsParams
): Promise<ResponsePagination<BreedingSeasonListItem[]>> {
  const { data } = await api.V2.get<BreedingSeasonsListEnvelope>('/breeding-seasons', {
    page: params.page,
    per_page: params.per_page,
    user_uuid: params.user_uuid || undefined,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listAbsences`/`listEvents`.
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

async function getBreedingSeason(uuid: string): Promise<Response<BreedingSeasonDetail>> {
  const { data } = await api.V2.get<Response<BreedingSeasonDetail>>(`/breeding-seasons/${uuid}`);
  return data;
}

async function createBreedingSeason(
  payload: BreedingSeasonPayload
): Promise<Response<BreedingSeasonDetail>> {
  const { data } = await api.V2.post<Response<BreedingSeasonDetail>>('/breeding-seasons', payload);
  return data;
}

async function updateBreedingSeason(
  uuid: string,
  payload: BreedingSeasonPayload
): Promise<Response<BreedingSeasonDetail>> {
  const { data } = await api.V2.put<Response<BreedingSeasonDetail>>(
    `/breeding-seasons/${uuid}`,
    payload
  );
  return data;
}

async function deleteBreedingSeason(uuid: string) {
  const { data } = await api.V2.delete(`/breeding-seasons/${uuid}`);
  return data;
}

// `GET /breeding-seasons/user-options` — resposta PLANA (sem paginação, sem
// `meta`), gate `breeding-seasons_view`. Mirror EXATO `listProprietaryOptions`
// — `Select` + `useQuery`, NUNCA `SelectAsyncPaginate` (o endpoint não pagina).
async function listBreedingSeasonUserOptions(): Promise<UserOption[]> {
  const { data } = await api.V2.get<Response<UserOption[]>>('/breeding-seasons/user-options');
  return data.data ?? [];
}

// `GET /breeding-seasons/next-code` — sugestão de código, só chamada em modo
// CRIAÇÃO (Tarefa 13), gate `breeding-seasons_create`. Resposta simples
// `{ code: string }`, sem Resource dedicado (contrato de API §8).
async function getBreedingSeasonNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/breeding-seasons/next-code');
  return data;
}

export {
  createBreedingSeason,
  deleteBreedingSeason,
  getBreedingSeason,
  getBreedingSeasonNextCode,
  listBreedingSeasonUserOptions,
  listBreedingSeasons,
  updateBreedingSeason,
};
