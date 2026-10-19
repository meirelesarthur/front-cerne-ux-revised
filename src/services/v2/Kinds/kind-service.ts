// src/services/v2/Kinds/kind-service.ts
// -----------------------------------------------------------------------------
// Kind Service — API v1 do backend Laravel GB.Cerne (Classes de Produto).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /kinds          → data: KindListItem[], meta com paginação real
//                             (current_page, last_page, per_page, total, ...).
//                             Backend default `per_page` 15 — o FRONT sempre
//                             envia 10 (pageSize do projeto).
//   GET    /kinds/{uuid}   → data: KindData
//   POST   /kinds          → payload KindPayload
//   PUT    /kinds/{uuid}   → payload KindPayload (SEMPRE completo — mesma nota
//                             de `breed-service.ts`, `KindRequest::rules()`
//                             não diferencia store/update por método)
//   DELETE /kinds/{uuid}   → 204; 422 (`BusinessRuleException`) se houver
//                             produtos vinculados (`products.kind_id`)
//
// `listKinds` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listBreeds` (espelhado literalmente). `category_uuid`
// vai na querystring de `/kinds` — filtro server-side por Categoria.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  KindData,
  KindListItem,
  KindOption,
  KindOptionsListEnvelope,
  KindPayload,
  KindsListEnvelope,
} from '@/@types/v2/Kinds';

// Estende `PaginationQueryParams` (mesma convenção de `ListBreedsParams`) —
// `page`/`per_page` consumidos de verdade pelo backend, além de `search`/
// `category_uuid`/`is_enabled` (filtros server-side).
export interface ListKindsParams extends PaginationQueryParams {
  search?: string;
  category_uuid?: string;
  /**
   * `KindIndexRequest` (regra `boolean`) só aceita `1,0,'1','0',true,false`
   * reais — `'true'/'false'` (strings) eram REJEITADAS (422), BUG-FE (E2E
   * feature 024). Contrato de front usa `'1'`/`'0'`.
   */
  is_enabled?: '1' | '0';
}

async function listKinds(params: ListKindsParams): Promise<ResponsePagination<KindListItem[]>> {
  const { data } = await api.V2.get<KindsListEnvelope>('/kinds', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    category_uuid: params.category_uuid || undefined,
    is_enabled: params.is_enabled || undefined,
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

// Catálogo de apoio (Select assíncrono) — consumido pelo módulo de Produtos
// (TASK-FE-500/504). `GET /kinds/active` (`KindController::active()`) já é
// rota real do backend, mas não tinha função de frontend ainda — aditivo,
// mesmo padrão de `listActiveCategoryProducts` (envelope `meta: null` sempre,
// adaptado para o shape paginado que `SelectAsyncPaginate` espera). NÃO
// altera `listKinds` (paginação real, filtro `category_uuid`) já existente.
//
// ACHADO (leitura direta de `ListActiveKindsAction::handle()`, sem
// parâmetros): a rota `/kinds/active` NÃO aceita `search`/`category_uuid` —
// devolve TODAS as Classes habilitadas, sem filtro server-side nenhum
// (diferente de `listActiveCategoryProducts`, que aceita `search`). A
// cascata Categoria→Classe do formulário de Produto (Product-Frontend-
// Contrato.md §3.3) usa `listKinds({ category_uuid })` (paginado, filtro
// real), NÃO esta função — `listActiveKinds` fica disponível para telas que
// só precisem do catálogo completo sem cascata. Nenhum parâmetro é enviado
// para não fingir um filtro que a API ignoraria silenciosamente.
async function listActiveKinds(): Promise<ResponsePagination<KindListItem[]>> {
  const { data } = await api.V2.get<KindsListEnvelope>('/kinds/active');

  // Adaptação envelope ApiResponse::success (meta:null) → ResponsePagination
  // (SelectAsyncPaginate) — mesmo truque estrutural de `listActiveCategoryProducts`.
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

async function getKindByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<KindData>>(`/kinds/${uuid}`);
  return data;
}

async function createKind(payload: KindPayload) {
  const { data } = await api.V2.post<Response<KindData>>('/kinds', payload);
  return data;
}

async function updateKind(uuid: string, payload: KindPayload) {
  const { data } = await api.V2.put<Response<KindData>>(`/kinds/${uuid}`, payload);
  return data;
}

async function deleteKind(uuid: string) {
  const { data } = await api.V2.delete(`/kinds/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /kinds/options (TASK-BE-601, aditivo TASK-FE-942) — lookup ENXUTO para
// o `SelectAsyncPaginate` de Classe da cascata Grupo→Categoria→Classe
// (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`) e para
// `ProdutoEstoqueFinanceiroTab.tsx`. Aceita `category_uuid` opcional —
// filtro por Categoria pai, PRESERVA a cascata (GAP-FE-161 ✅ RESOLVIDA,
// emendado em `TASK-BE-601`). ARMADILHA: nunca descartar `category_uuid` da
// querystring — sem ele a cascata para de filtrar SEM erro (200 OK com a
// lista inteira). `category_uuid` inexistente/inválido NÃO dispara 422
// (`sometimes|string` + `whereHas`, sem `Rule::exists`, mirror
// `CityOptionsRequest`) — devolve LISTA VAZIA, estado de UI honesto, não
// erro. SEM gate de permissão. FLAT — `meta` sempre `null`. NÃO altera
// `listKinds`/`listActiveKinds` já existentes — coexistem (diferente de
// `/kinds/active`, que NÃO aceita `search`/`category_uuid` — ver nota
// acima).
// -----------------------------------------------------------------------------
//
// DESVIO HERDADO DA TASK-FE-942 (corrigido em TASK-FE-943/944): esta
// interface não estendia `PaginationQueryParams` — diferente de TODOS os
// irmãos `*OptionsParams` do codebase (`ListMeasurementOptionsParams`/
// `ListNcmOptionsParams`/`ListCultivationOptionsParams`). Passou pelo `tsc` da
// 942 porque nenhum consumidor usava `service={listKindOptions}` ainda —
// `SelectAsyncPaginateProps.service` exige
// `(pageParams: PaginationQueryParams) => ...` e o TS rejeita a atribuição
// como "weak type" (nenhuma propriedade em comum entre 2 tipos só-opcionais)
// quando a interface não estende. Corrigido aqui — não muda o corpo da
// função, `page`/`per_page`/etc. continuam ignorados, só
// `search`/`category_uuid` são lidos.
export interface ListKindOptionsParams extends PaginationQueryParams {
  search?: string;
  category_uuid?: string;
}

async function listKindOptions(
  params: ListKindOptionsParams
): Promise<ResponsePagination<KindOption[]>> {
  const { data } = await api.V2.get<KindOptionsListEnvelope>('/kinds/options', {
    search: params.search || undefined,
    category_uuid: params.category_uuid || undefined,
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
  createKind,
  deleteKind,
  getKindByUuid,
  listActiveKinds,
  listKindOptions,
  listKinds,
  updateKind,
};
