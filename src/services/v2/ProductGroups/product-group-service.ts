// src/services/v2/ProductGroups/product-group-service.ts
// -----------------------------------------------------------------------------
// Product Group Service — API v1 do backend Laravel GB.Cerne (Grupos de
// Produto).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /product-groups          → data: ProductGroupListItem[], meta com
//                                      paginação REAL (current_page/last_page/
//                                      per_page/total) — confirmado em
//                                      GroupProductController::index() /
//                                      GroupProductRepository::
//                                      listWithFilters() (LengthAwarePaginator
//                                      de verdade). DIFERENTE do adaptador de
//                                      meta:null de Breeds/Species — o
//                                      adaptador aqui espelha
//                                      `listCostCenters` (paginação real).
//   GET    /product-groups/{uuid}   → data: ProductGroupDetail
//   POST   /product-groups          → payload ProductGroupPayload
//   PUT    /product-groups/{uuid}   → payload ProductGroupPayload (SEMPRE
//                                      completo — `GroupProductRequest` é
//                                      full-resource, description+is_enabled
//                                      ambos `required` em store E update)
//   DELETE /product-groups/{uuid}   → 204; exclusão DEFINITIVA (sem
//                                      SoftDeletes) — mas com guard de FK
//                                      ativo no backend (`DeleteGroupProductAction`
//                                      captura SQLSTATE 23503 e relança 422
//                                      com "Grupo de produto está em uso e
//                                      não pode ser excluído."); o `onError`
//                                      global de `useRequest` já exibe
//                                      `error.response.data.message` — não é
//                                      preciso um onError dedicado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ProductGroupDetail,
  ProductGroupListItem,
  ProductGroupOption,
  ProductGroupOptionsListEnvelope,
  ProductGroupPayload,
  ProductGroupsListEnvelope,
} from '@/@types/v2/ProductGroups/product-group';

// Estende `PaginationQueryParams` (mesma convenção de `ListCostCentersParams`/
// `ListBreedsParams`) — `page`/`per_page` são consumidos de verdade pelo
// backend (paginação real, achado #1 de TASK-GRP-01).
export interface ListProductGroupsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
}

async function listProductGroups(
  params: ListProductGroupsParams
): Promise<ResponsePagination<ProductGroupListItem[]>> {
  const { data } = await api.V2.get<ProductGroupsListEnvelope>('/product-groups', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listCostCenters`/`listBreeds` (meta REAL, não fallback fake).
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

async function getProductGroup(uuid: string) {
  const { data } = await api.V2.get<Response<ProductGroupDetail>>(`/product-groups/${uuid}`);
  return data;
}

async function createProductGroup(payload: ProductGroupPayload) {
  const { data } = await api.V2.post<Response<ProductGroupDetail>>('/product-groups', payload);
  return data;
}

// PUT full-resource: GroupProductRequest exige description + is_enabled
// SEMPRE, não aceita payload parcial — nunca enviar Partial<ProductGroupPayload>
// aqui, ao contrário de updateCostCenter/updateBreed (que também enviam
// completo na prática, mas o contrato não FORÇA como aqui).
async function updateProductGroup(uuid: string, payload: ProductGroupPayload) {
  const { data } = await api.V2.put<Response<ProductGroupDetail>>(
    `/product-groups/${uuid}`,
    payload
  );
  return data;
}

async function deleteProductGroup(uuid: string) {
  const { data } = await api.V2.delete(`/product-groups/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /product-groups/options (TASK-BE-600, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de topo da cascata Grupo→Categoria→
// Classe (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`). Topo da
// cascata — sem parâmetro de filtro por pai, só `search`. SEM gate de
// permissão (fecha o toast "Sem permissão" do drawer de filtro de
// Produtos). FLAT — `meta` sempre `null`. NÃO altera `listProductGroups`
// (paginação real, gateado) já existente — coexistem.
// -----------------------------------------------------------------------------
//
// DESVIO HERDADO DA TASK-FE-942 (corrigido em TASK-FE-943): esta interface não
// estendia `PaginationQueryParams` — diferente de TODOS os irmãos
// `*OptionsParams` do codebase (`ListMeasurementOptionsParams`/
// `ListNcmOptionsParams`/`ListCultivationOptionsParams`). Passou pelo `tsc` da
// 942 porque nenhum consumidor usava `service={listProductGroupOptions}`
// ainda — `SelectAsyncPaginateProps.service` exige
// `(pageParams: PaginationQueryParams) => ...` e o TS rejeita a atribuição
// como "weak type" (nenhuma propriedade em comum entre 2 tipos só-opcionais)
// quando a interface não estende. Corrigido aqui — não muda o corpo da
// função, `page`/`per_page`/etc. continuam ignorados, só `search` é lido.
export interface ListProductGroupOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listProductGroupOptions(
  params: ListProductGroupOptionsParams
): Promise<ResponsePagination<ProductGroupOption[]>> {
  const { data } = await api.V2.get<ProductGroupOptionsListEnvelope>('/product-groups/options', {
    search: params.search || undefined,
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
  createProductGroup,
  deleteProductGroup,
  getProductGroup,
  listProductGroupOptions,
  listProductGroups,
  updateProductGroup,
};
