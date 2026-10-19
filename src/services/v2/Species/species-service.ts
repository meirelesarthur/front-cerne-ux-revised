// src/services/v2/Species/species-service.ts
// -----------------------------------------------------------------------------
// Species Service — API v1 do backend Laravel GB.Cerne (Espécies).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /species            → data: SpeciesListItem[], meta SEMPRE null
//   GET    /species/{uuid}     → data: SpecieData (TASK-ESP-02 — inclui
//                                 `cost_center` aninhado, mesmo Resource do index)
//   POST   /species            → payload SpeciePayload (create)
//   PUT    /species/{uuid}     → payload SpeciePayload (update — só o delta
//                                 de `dirtyFields`, ver CreateOrUpdateEspecie.tsx)
//   DELETE /species/{uuid}     → 204; erro de negócio (message) se referenciado —
//                                 HOJE via 500 genérico, não um 422/409
//                                 estruturado (ver species.d.ts e a ficha
//                                 TASK-ESP-01, seção "Achado real").
//
// `listSpecies` ADAPTA o envelope `{ data: [], meta: null }` (Species NUNCA
// pagina — `index()` do `SpecieAnimalController` usa `ApiResponse::success()`,
// nunca `::paginated()`) para o shape `ResponsePagination` que
// `useCustomGridQuery` consome — mesmo truque estrutural de `listCostCenters`/
// `listRoles`, mas aqui `meta` é sempre `null` (não "às vezes ausente"), então
// TODOS os campos de paginação caem direto no fallback (sem optional chaining
// `?.`, que seria cosmético — `data.meta` nunca é outra coisa que não `null`).
//
// `getSpecieByUuid`/`createSpecie`/`updateSpecie` (TASK-ESP-02): verbo de
// update confirmado `PUT` — `routes/api.php:260-265` registra
// `Route::apiResource('species', ...)`, que usa `PUT|PATCH`; `api.V2.put`
// segue o mesmo padrão de `updateCostCenter`/`updateRole`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SpecieData,
  SpeciePayload,
  SpecieOptionItem,
  SpeciesFilterForm,
  SpeciesListEnvelope,
  SpeciesListItem,
  SpeciesOptionsListEnvelope,
} from '@/@types/v2/Species/species';

// Params aceitos pela listagem — busca (`search`) + filtro (`is_enabled`).
// Estende `PaginationQueryParams` (mesma convenção de ListCostCentersParams/
// ListRolesParams) para satisfazer a assinatura `asyncFunction` exigida por
// `useCustomGridQuery` — o `page`/`per_page` chegam por causa da família Grid,
// mas `listSpecies` os IGNORA (Species não pagina; ver nota acima).
export interface ListSpeciesParams extends PaginationQueryParams, SpeciesFilterForm {}

async function listSpecies(
  params: ListSpeciesParams
): Promise<ResponsePagination<SpeciesListItem[]>> {
  const { data } = await api.V2.get<SpeciesListEnvelope>('/species', {
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::success (meta:null) → ResponsePagination
  // (grid) — 1 única página com o array inteiro, mesmo truque estrutural de
  // listCostCenters/listRoles (ali por paginação real; aqui por ausência dela).
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

async function deleteSpecie(specieUuid: string) {
  const { data } = await api.V2.delete(`/species/${specieUuid}`);
  return data;
}

// TASK-ESP-02 — detalhe (form de edição). Mesmo Resource do `index()`
// (`SpecieAnimalResource`), já com `cost_center` aninhado.
async function getSpecieByUuid(specieUuid: string) {
  const { data } = await api.V2.get<Response<SpecieData>>(`/species/${specieUuid}`);
  return data;
}

async function createSpecie(payload: SpeciePayload) {
  const { data } = await api.V2.post<Response<SpecieData>>('/species', payload);
  return data;
}

// Update recebe o payload COMPLETO (`SpeciePayload`) — o
// `SpecieAnimalRequest` (api_root) exige `description`/`is_enabled` também no
// PUT (full-resource-replace, TASK-ESP-FIX-PAYLOAD). Assinatura mantida em
// `Partial<SpeciePayload>` só por compatibilidade estrutural (o objeto
// completo satisfaz o tipo parcial); o chamador em
// `CreateOrUpdateEspecie.tsx` já envia sempre os 3 campos.
async function updateSpecie(specieUuid: string, payload: Partial<SpeciePayload>) {
  const { data } = await api.V2.put<Response<SpecieData>>(`/species/${specieUuid}`, payload);
  return data;
}

// GET /species/options — GAP-FE-206 (correção pós-E2E, 2026-08-03): lookup
// ENXUTO, SEM `specie_view` (`SpecieAnimalOptionResource`, uuid+label) —
// existe justamente para o Select de Espécie do form de Animal, consumido
// por qualquer usuário autenticado (`animals_create`/`animals_edit`),
// independente de privilégio administrativo sobre o catálogo de Espécies.
// `listSpecies` (índice completo, GATEADO por `specie_view`) PERMANECE
// intocado — usado pela tela de administração `Especies/`.
// GAP-BE-427/TASK-BE-892: a rota agora exige `X-Farm-Id` (`farm.context`
// ESTRITO) — o interceptor genérico de `api.ts` já propaga o header.
export interface ListSpecieOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listSpecieOptions(
  params: ListSpecieOptionsParams
): Promise<ResponsePagination<SpecieOptionItem[]>> {
  const { data } = await api.V2.get<SpeciesOptionsListEnvelope>('/species/options', {
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::success (flat, meta:null) →
  // ResponsePagination — 1 única página com o array inteiro (mirror
  // listBatchOptions/listActiveCategoryMatrices).
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
  createSpecie,
  deleteSpecie,
  getSpecieByUuid,
  listSpecieOptions,
  listSpecies,
  updateSpecie,
};
