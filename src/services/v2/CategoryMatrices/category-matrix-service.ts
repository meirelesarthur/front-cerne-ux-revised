// src/services/v2/CategoryMatrices/category-matrix-service.ts
// -----------------------------------------------------------------------------
// CategoryMatrix Service — API v1 do backend Laravel GB.Cerne (Estágio
// Reprodutivo, nome de negócio; `CategoryMatrix` é o nome técnico preservado
// do legado).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /category-matrices            → data: CategoryMatrixListItem[],
//                                            PAGINAÇÃO REAL (meta.current_page/
//                                            last_page/per_page/total)
//   GET    /category-matrices/{uuid}     → data: CategoryMatrixData
//   POST   /category-matrices            → payload CategoryMatrixPayload (create)
//   PUT    /category-matrices/{uuid}     → payload CategoryMatrixPayload
//                                           (update — SEMPRE completo, os 3
//                                           campos, nunca delta)
//   DELETE /category-matrices/{uuid}     → 204; 422 estruturado com mensagem
//                                           de negócio real se em uso por FK
//
// `listCategoryMatrices` ADAPTA o envelope PAGINADO REAL do backend
// (`ApiResponse::paginated()`, confirmado em `CategoryMatrixController::index()`)
// para o shape `ResponsePagination` — MESMO adaptador de `listWarehouses`/
// `listLowReasons`, NÃO o truque `meta:null` de `listSpecies`/`listBreeds`
// (CategoryMatrix pagina de verdade — divergência do precedente mais próximo).
//
// Filtro por Espécie é SERVER-SIDE real: `CategoryMatrixFilterData.specie_uuid`
// já é o UUID (não um `specie_id` interno inacessível) — enviado direto na
// querystring, sem workaround client-side.
//
// Sem `X-Farm-Id`/tenant (DA-01 do contrato — tabela GLOBAL): este serviço não
// adiciona nenhum header extra nem depende da fazenda ativa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CategoryMatrixActiveListEnvelope,
  CategoryMatricesListEnvelope,
  CategoryMatrixData,
  CategoryMatrixListItem,
  CategoryMatrixOptionItem,
  CategoryMatrixPayload,
} from '@/@types/v2/CategoryMatrices/category-matrix';

// Params aceitos pela listagem — paginação real + busca + filtros reais do
// backend (`is_enabled`/`specie_uuid`).
export interface ListCategoryMatricesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  specie_uuid?: string; // filtro SERVER-SIDE real (CategoryMatrixFilterData.specie_uuid)
}

async function listCategoryMatrices(
  params: ListCategoryMatricesParams
): Promise<ResponsePagination<CategoryMatrixListItem[]>> {
  const { data } = await api.V2.get<CategoryMatricesListEnvelope>('/category-matrices', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    specie_uuid: params.specie_uuid || undefined,
    // specie_label NUNCA é enviado — é display-only do filtro (ver
    // CategoryMatrixFilterForm em category-matrix.d.ts).
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
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function deleteCategoryMatrix(categoryMatrixUuid: string) {
  const { data } = await api.V2.delete(`/category-matrices/${categoryMatrixUuid}`);
  return data;
}

// TASK-CATYMT-02 — detalhe (form de edição).
async function getCategoryMatrixByUuid(categoryMatrixUuid: string) {
  const { data } = await api.V2.get<Response<CategoryMatrixData>>(
    `/category-matrices/${categoryMatrixUuid}`
  );
  return data;
}

async function createCategoryMatrix(payload: CategoryMatrixPayload) {
  const { data } = await api.V2.post<Response<CategoryMatrixData>>('/category-matrices', payload);
  return data;
}

// PUT recebe o payload COMPLETO — `CategoryMatrixRequest` exige
// description/specie_uuid/is_enabled também no update (sem bloco condicional
// por verbo para obrigatoriedade), mesma recorrência de
// updateSpecie/updateLowReason/updateWarehouse (TASK-ESP-FIX-PAYLOAD).
async function updateCategoryMatrix(categoryMatrixUuid: string, payload: CategoryMatrixPayload) {
  const { data } = await api.V2.put<Response<CategoryMatrixData>>(
    `/category-matrices/${categoryMatrixUuid}`,
    payload
  );
  return data;
}

// GET /category-matrices/active — TASK-FE-884, Animal-contrato.md §15
// (Bloco "Estágio/Status Reprodutivo" do formulário de Animal, endpoint
// enxuto/ungated, mirror `listActiveKinds`). Aceita `specie_uuid` opcional
// (filtro server-side, `CategoryMatrixController::active()` preservado 1:1).
// FLAT — adapta `meta: null` para o shape `ResponsePagination` que
// `SelectAsyncPaginate` consome (mesmo truque de `listActiveCategoryProducts`/
// `listActiveKinds`). NÃO substitui `listCategoryMatrices` (CRUD completo,
// gated, usado por `CategoriasMatrizes/index.tsx`) — coexistem.
// Estende `PaginationQueryParams` (mesma convenção de `ListKindOptionsParams`)
// — evita o "weak type"/`tsc` rejeitar a atribuição de `listActiveCategoryMatrices`
// à prop `service` de `SelectAsyncPaginateProps` (achado já documentado em
// `kind-service.ts`, TASK-FE-943/944) mesmo `page`/`per_page` sendo ignorados
// pelo endpoint FLAT.
export interface ListActiveCategoryMatricesParams extends PaginationQueryParams {
  specie_uuid?: string;
}

async function listActiveCategoryMatrices(
  params: ListActiveCategoryMatricesParams = {}
): Promise<ResponsePagination<CategoryMatrixOptionItem[]>> {
  const { data } = await api.V2.get<CategoryMatrixActiveListEnvelope>('/category-matrices/active', {
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

export {
  createCategoryMatrix,
  deleteCategoryMatrix,
  getCategoryMatrixByUuid,
  listActiveCategoryMatrices,
  listCategoryMatrices,
  updateCategoryMatrix,
};
