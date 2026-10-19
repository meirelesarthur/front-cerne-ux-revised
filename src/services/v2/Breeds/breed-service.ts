// src/services/v2/Breeds/breed-service.ts
// -----------------------------------------------------------------------------
// Breed Service — API v1 do backend Laravel GB.Cerne (Raças).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
// TASK-BREED-FRONT-PAG — a API de Breeds passou a paginar de verdade
// (ApiResponse::paginated, com meta) e aceita page/per_page + specie_uuid:
//   GET    /breeds          → data: BreedListItem[], meta com paginação real
//                              (current_page, last_page, per_page, total, ...).
//   GET    /breeds/{uuid}   → data: BreedData
//   POST   /breeds          → payload BreedPayload
//   PUT    /breeds/{uuid}   → payload BreedPayload (SEMPRE completo — ver nota
//                              em `BreedPayload`/`CreateOrUpdateRaca.tsx`)
//   DELETE /breeds/{uuid}   → 204; exclusão DEFINITIVA (sem SoftDeletes)
//
// `listBreeds` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listCostCenters` (espelhado literalmente). `specie_uuid`
// agora é enviado na querystring de `/breeds` — o filtro por Espécie é
// server-side (ver `useBreeds.tsx`/`FilterSideRacas.tsx`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BreedData,
  BreedListItem,
  BreedOptionItem,
  BreedPayload,
  BreedsListEnvelope,
  BreedsOptionsListEnvelope,
} from '@/@types/v2/Breeds/breed';

// Estende `PaginationQueryParams` (mesma convenção de `ListCostCentersParams`)
// — `page`/`per_page` agora são consumidos de verdade pelo backend (TASK-BREED-
// FRONT-PAG), além de `specie_uuid` (filtro server-side por Espécie).
export interface ListBreedsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  specie_uuid?: string;
}

async function listBreeds(params: ListBreedsParams): Promise<ResponsePagination<BreedListItem[]>> {
  const { data } = await api.V2.get<BreedsListEnvelope>('/breeds', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    specie_uuid: params.specie_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listCostCenters`.
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

async function getBreedByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<BreedData>>(`/breeds/${uuid}`);
  return data;
}

async function createBreed(payload: BreedPayload) {
  const { data } = await api.V2.post<Response<BreedData>>('/breeds', payload);
  return data;
}

async function updateBreed(uuid: string, payload: BreedPayload) {
  const { data } = await api.V2.put<Response<BreedData>>(`/breeds/${uuid}`, payload);
  return data;
}

async function deleteBreed(uuid: string) {
  const { data } = await api.V2.delete(`/breeds/${uuid}`);
  return data;
}

// GET /breeds/options — GAP-FE-206 (correção pós-E2E, 2026-08-03): lookup
// ENXUTO, SEM `breeds_view` (`BreedOptionResource`, uuid+label) — existe
// justamente para o Select de Raça do form de Animal, consumido por
// qualquer usuário autenticado, independente de privilégio administrativo
// sobre o catálogo de Raças. `listBreeds` (índice completo, GATEADO por
// `breeds_view`, com `specie_uuid` server-side) PERMANECE intocado — usado
// pela tela de administração `Racas/`.
//
// TASK-BE-930 (fechamento do Gap reportado na correção anterior) —
// `specie_uuid` (filtro opcional) confirmado por leitura direta do
// Request/Repository do `api_root`, restaura a narrowing server-side por
// Espécie que se perdeu na primeira migração para este endpoint.
export interface ListBreedOptionsParams extends PaginationQueryParams {
  search?: string;
  specie_uuid?: string;
}

async function listBreedOptions(
  params: ListBreedOptionsParams
): Promise<ResponsePagination<BreedOptionItem[]>> {
  const { data } = await api.V2.get<BreedsOptionsListEnvelope>('/breeds/options', {
    search: params.search || undefined,
    specie_uuid: params.specie_uuid || undefined,
  });

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

export { createBreed, deleteBreed, getBreedByUuid, listBreedOptions, listBreeds, updateBreed };
