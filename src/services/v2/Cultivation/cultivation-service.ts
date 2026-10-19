// src/services/v2/Cultivation/cultivation-service.ts
// -----------------------------------------------------------------------------
// Cultivation Service — API v1 do backend Laravel GB.Cerne (Cultura/Variedade).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /cultivations/tree   → data: CultivationTreeNode[] (árvore completa,
//                                  não-paginada, tenant-scoped — Seção 3 do
//                                  Cultivation-contrato.md)
//   GET    /cultivations/active → data: CultivationTreeNode[] (raízes + filhos
//                                  habilitados, 1 nível — DA-CV-09, TASK-CV-04b,
//                                  usado para popular o Select de Cultura-pai)
//   GET    /cultivations/{uuid} → data: CultivationData (TASK-CV-04b)
//   POST   /cultivations        → data: CultivationData (TASK-CV-04b)
//   PUT    /cultivations/{uuid} → data: CultivationData — verbo HTTP `PUT`
//                                  conforme Seção 3 do contrato (divergência
//                                  intencional do `PATCH` usado por outras
//                                  entidades do projeto, TASK-CV-04b)
//   DELETE /cultivations/{uuid} → 204; bloqueia com 422 flat (`message`)
//                                  se houver qualquer vínculo (toast genérico)
//
// X-Farm-Id é propagado automaticamente pelo interceptor de `api.V2`
// (src/services/api.ts) — nenhum tratamento adicional necessário aqui.
// -----------------------------------------------------------------------------

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from "@/@types/response-api";
import type {
  CreateCultivationRequest,
  CultivationData,
  CultivationListItem,
  CultivationOption,
  CultivationOptionsListEnvelope,
  CultivationsListEnvelope,
  CultivationTreeNode,
  UpdateCultivationRequest,
} from "@/@types/v2/Cultivation/cultivation";
import api from "@/services/api";

// Catálogo de apoio (Select assíncrono) — consumido pelo módulo de Produtos
// (TASK-FE-500/504, campo `cultivation_uuid`). `GET /cultivations` (`index()`)
// já é rota real do backend (paginação REAL, `ApiResponse::paginated`), mas
// não tinha função de frontend ainda — o módulo próprio de Cultivation usa
// `/tree`/`/active` (não-paginados). Aditivo — NÃO altera nenhuma função
// existente deste arquivo. Só `search` é exposto (mesmo escopo mínimo de
// `listWarehouses`/`listFinancialCategories` — sem variante `/active`
// adicional, task-packet TASK-FE-500).
export interface ListCultivationsParams extends PaginationQueryParams {
  search?: string;
}

async function listCultivations(
  params: ListCultivationsParams
): Promise<ResponsePagination<CultivationListItem[]>> {
  const { data } = await api.V2.get<CultivationsListEnvelope>('/cultivations', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listKinds`/`listProductGroups` (meta REAL, não fallback fake).
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

async function getCultivationTree() {
  const { data } = await api.V2.get<Response<CultivationTreeNode[]>>(
    "/cultivations/tree"
  );
  return data;
}

async function getCultivationActive() {
  const { data } = await api.V2.get<Response<CultivationTreeNode[]>>(
    "/cultivations/active"
  );
  return data;
}

async function getCultivationById(uuid: string) {
  const { data } = await api.V2.get<Response<CultivationData>>(
    `/cultivations/${uuid}`
  );
  return data;
}

async function createCultivation(payload: CreateCultivationRequest) {
  const { data } = await api.V2.post<Response<CultivationData>>(
    "/cultivations",
    payload
  );
  return data;
}

async function updateCultivation(
  uuid: string,
  payload: UpdateCultivationRequest
) {
  const { data } = await api.V2.put<Response<CultivationData>>(
    `/cultivations/${uuid}`,
    payload
  );
  return data;
}

async function deleteCultivation(cultivationUuid: string) {
  const { data } = await api.V2.delete(`/cultivations/${cultivationUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /cultivations/options (TASK-BE-600/601, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de `cultivation_uuid`
// (`ProdutoEstoqueFinanceiroTab.tsx`). Catálogo PLANO, sem cascata — só
// `search`. SEM gate de permissão. FLAT — `meta` sempre `null`. NÃO altera
// `listCultivations`/`getCultivationTree`/`getCultivationActive` já
// existentes — coexistem.
// -----------------------------------------------------------------------------
// `extends PaginationQueryParams` (mirror `ListWarehouseOptionsParams`/
// `ListMeasurementOptionsParams`/`ListAddressingOptionsParams`) — descoberto
// em `TASK-FE-947`: sem essa herança, `tsc` recusa a atribuição ao prop
// `service` de `SelectAsyncPaginate` (`PaginationQueryParams` "has no
// properties in common" com um tipo só-`search`, weak-type detection do TS).
// `page`/`per_page` continuam não-lidos no corpo da função (endpoint FLAT,
// sem paginação real) — herança é só para satisfazer o contrato de tipo do
// componente, sem mudança de comportamento em runtime.
export interface ListCultivationOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listCultivationOptions(
  params: ListCultivationOptionsParams
): Promise<ResponsePagination<CultivationOption[]>> {
  const { data } = await api.V2.get<CultivationOptionsListEnvelope>('/cultivations/options', {
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
  createCultivation,
  deleteCultivation,
  getCultivationActive,
  getCultivationById,
  getCultivationTree,
  listCultivationOptions,
  listCultivations,
  updateCultivation,
};
