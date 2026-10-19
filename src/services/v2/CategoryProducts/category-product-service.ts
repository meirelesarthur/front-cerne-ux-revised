// src/services/v2/CategoryProducts/category-product-service.ts
// -----------------------------------------------------------------------------
// Category Product Service — API v1 do backend Laravel GB.Cerne (Categorias de
// Produto). CRUD completo nasce em TASK-CP-FE-01 (list/delete) e é completado
// por TASK-CP-FE-02 (get/create/update).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /category-products          → data: CategoryProductListItem[], meta
//                                         com paginação REAL (current_page/
//                                         last_page/per_page/total) — mesmo
//                                         adaptador de `listProductGroups`/
//                                         `listCostCenters` (meta REAL, não o
//                                         fallback de meta:null de Breeds/
//                                         Species).
//   GET    /category-products/{uuid}   → data: CategoryProductDetail
//   POST   /category-products          → payload CategoryProductPayload
//   PUT    /category-products/{uuid}   → payload CategoryProductPayload
//                                         (SEMPRE completo — ver nota do
//                                         tipo `CategoryProductPayload`)
//   DELETE /category-products/{uuid}   → 204; guard de dependências
//                                         (`kinds()`/`products.category_id`
//                                         em uso) — `DeleteCategoryProductAction`
//                                         retorna 422 com mensagem de negócio
//                                         explícita; o `onError` GLOBAL de
//                                         `useRequest` já exibe
//                                         `error.response.data.message` — não
//                                         é preciso um `onError` dedicado aqui.
//
// Cadastro GLOBAL (sem tenant-scope) — o header `X-Farm-Id` continua sendo
// propagado automaticamente pelo interceptor axios (`src/services/api.ts`,
// não repetido/condicionado aqui), o backend apenas o ignora para este
// recurso — mesmo comportamento observado em `product-group-service.ts`
// (também GLOBAL) para o mesmo header.
//
// `listActiveCategoryProducts` (RECONCILIADO na feature 024, merge com
// develop) — consumido como catálogo de apoio (Select assíncrono) pelo
// módulo de Classes (Kind — TASK-FE-460, Kind-Frontend-Contrato.md §1):
//   GET /category-products/active → data: CategoryProductRef[], meta SEMPRE
//                                    null, `is_enabled=true`, ordenado por
//                                    `description`, com `search` opcional —
//                                    mesmo padrão de `GET /species`
//                                    (listSpecies). ADAPTA o envelope
//                                    `{ data: [], meta: null }` para o shape
//                                    `ResponsePagination` que
//                                    `SelectAsyncPaginate` consome.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CategoryProductOption,
  CategoryProductOptionsListEnvelope,
  CategoryProductRef,
  CategoryProductsActiveEnvelope,
} from '@/@types/v2/CategoryProducts';
import type {
  CategoryProductDetail,
  CategoryProductListItem,
  CategoryProductPayload,
  CategoryProductsListEnvelope,
  CategoryProductTypeCode,
} from '@/@types/v2/CategoryProducts/category-product';

// Estende `PaginationQueryParams` (mesma convenção de `ListProductGroupsParams`/
// `ListBreedsParams`) — `page`/`per_page` reais (paginação server-side de verdade).
export interface ListCategoryProductsParams extends PaginationQueryParams {
  search?: string;
  group_uuid?: string;
  // TASK-CP-FE-FIX-03 — `CategoryProductFilterData` (backend) é `int`-backed
  // igual ao payload de create/update — CÓDIGO (1/2/3), não o nome. Ver nota
  // em `CategoryProductTypeCode`/`CategoryProductFilterForm`.
  type?: CategoryProductTypeCode;
  // TASK-CP-FE-FIX-03 — Ativo=1/Inativo=0 (`#[WithCast(bool)]` no backend).
  is_enabled?: 0 | 1;
}

async function listCategoryProducts(
  params: ListCategoryProductsParams
): Promise<ResponsePagination<CategoryProductListItem[]>> {
  const { data } = await api.V2.get<CategoryProductsListEnvelope>('/category-products', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    group_uuid: params.group_uuid || undefined,
    // `??` (NUNCA `||`) — `type` é 1/2/3 (nunca 0, inofensivo) mas `is_enabled`
    // pode ser `0` (Inativo), que é falsy em JS; `||` descartaria o filtro
    // "Inativo" silenciosamente (TASK-CP-FE-FIX-03).
    type: params.type ?? undefined,
    is_enabled: params.is_enabled ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listProductGroups`/`listCostCenters` (meta REAL, não fallback fake).
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

// Catálogo de apoio (Select assíncrono) — consumido pelo módulo de Classes
// (Kind, TASK-FE-460). Ver nota do cabeçalho: envelope `meta: null` sempre,
// adaptado para o shape paginado que `SelectAsyncPaginate` espera.
export interface ListActiveCategoryProductsParams extends PaginationQueryParams {
  search?: string;
}

async function listActiveCategoryProducts(
  params: ListActiveCategoryProductsParams
): Promise<ResponsePagination<CategoryProductRef[]>> {
  const { data } = await api.V2.get<CategoryProductsActiveEnvelope>('/category-products/active', {
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::success (meta:null) → ResponsePagination
  // (SelectAsyncPaginate) — mesmo truque estrutural de `listSpecies`.
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

async function getCategoryProduct(uuid: string) {
  const { data } = await api.V2.get<Response<CategoryProductDetail>>(`/category-products/${uuid}`);
  return data;
}

async function createCategoryProduct(payload: CategoryProductPayload) {
  const { data } = await api.V2.post<Response<CategoryProductDetail>>(
    '/category-products',
    payload
  );
  return data;
}

// PUT full-resource: CategoryProductRequest exige description/is_enabled/type/
// group_uuid SEMPRE (financial_category_uuid é o único nullable) — nunca
// enviar Partial<CategoryProductPayload> aqui.
async function updateCategoryProduct(uuid: string, payload: CategoryProductPayload) {
  const { data } = await api.V2.put<Response<CategoryProductDetail>>(
    `/category-products/${uuid}`,
    payload
  );
  return data;
}

async function deleteCategoryProduct(uuid: string) {
  const { data } = await api.V2.delete(`/category-products/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /category-products/options (TASK-BE-600, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de Categoria da cascata Grupo→
// Categoria→Classe (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`) e
// para o submódulo de Classes (Kind, sem pai). Aceita `group_uuid` opcional
// — filtro por Grupo pai, PRESERVA a cascata (GAP-FE-161 ✅ RESOLVIDA,
// emendado em `TASK-BE-600`). ARMADILHA: nunca descartar `group_uuid` da
// querystring — sem ele a cascata para de filtrar SEM erro (200 OK com a
// lista inteira). `group_uuid` inexistente/inválido NÃO dispara 422
// (`sometimes|string` + `whereHas`, sem `Rule::exists`, mirror
// `CityOptionsRequest`) — devolve LISTA VAZIA, estado de UI honesto, não
// erro. SEM gate de permissão. FLAT — `meta` sempre `null`. NÃO altera
// `listCategoryProducts`/`listActiveCategoryProducts` já existentes —
// coexistem.
// -----------------------------------------------------------------------------
//
// DESVIO HERDADO DA TASK-FE-942 (corrigido em TASK-FE-943/944/945): esta
// interface não estendia `PaginationQueryParams` — diferente de TODOS os
// irmãos `*OptionsParams` do codebase (`ListMeasurementOptionsParams`/
// `ListNcmOptionsParams`/`ListCultivationOptionsParams`). Passou pelo `tsc` da
// 942 porque nenhum consumidor usava `service={listCategoryProductOptions}`
// ainda — `SelectAsyncPaginateProps.service` exige
// `(pageParams: PaginationQueryParams) => ...` e o TS rejeita a atribuição
// como "weak type" (nenhuma propriedade em comum entre 2 tipos só-opcionais)
// quando a interface não estende. Corrigido aqui — não muda o corpo da
// função, `page`/`per_page`/etc. continuam ignorados, só `search`/`group_uuid`
// são lidos.
export interface ListCategoryProductOptionsParams extends PaginationQueryParams {
  search?: string;
  group_uuid?: string;
}

async function listCategoryProductOptions(
  params: ListCategoryProductOptionsParams
): Promise<ResponsePagination<CategoryProductOption[]>> {
  const { data } = await api.V2.get<CategoryProductOptionsListEnvelope>(
    '/category-products/options',
    {
      search: params.search || undefined,
      group_uuid: params.group_uuid || undefined,
    }
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
  createCategoryProduct,
  deleteCategoryProduct,
  getCategoryProduct,
  listActiveCategoryProducts,
  listCategoryProductOptions,
  listCategoryProducts,
  updateCategoryProduct,
};
