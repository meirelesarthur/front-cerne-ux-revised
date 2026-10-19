// src/services/v2/DiscountTables/discount-table-service.ts
// -----------------------------------------------------------------------------
// DiscountTable Service — API v1 do backend Laravel GB.Cerne (Descontos/
// Classificação — Operacional/Agricultura, F-032, TASK-DT-FE-01). Fachada
// CRUD completa + `product-options` (lookup único, SEM paginação) sobre o
// Model `DiscountTable`/`DiscountTableProduct`/`DiscountRule`. Mirror
// estrutural de `feeding-phase-service.ts`/`diet-service.ts` (adaptador de
// envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse), confirmado por leitura direta do
// `DiscountTableController`/`DiscountTableRepository` (`GB.Cerne.Api`):
//   GET    /discount-tables                 → data: DiscountTableListItem[],
//                                              meta paginação REAL (filtro
//                                              `search` code/name ILIKE).
//                                              Paginação FIXA em 10 no
//                                              servidor (`->paginate(10)`) —
//                                              `per_page` NUNCA enviado por
//                                              este service.
//   GET    /discount-tables/product-options → data: ProductOption[], lookup
//                                              único (tenant+group_id=8,
//                                              order description asc), SEM
//                                              paginação/busca server-side.
//   GET    /discount-tables/{uuid}          → data: DiscountTableDetail
//                                              (products[] + rules[] sempre
//                                              populados).
//   POST   /discount-tables                 → payload DiscountTablePayload.
//   PUT    /discount-tables/{uuid}          → payload DiscountTablePayload —
//                                              a API RECONCILIA (TR-03) o
//                                              estado final completo enviado.
//   DELETE /discount-tables/{uuid}          → soft delete (cascade
//                                              produtos+regras).
//
// `X-Farm-Id` via interceptor genérico de `@/services/api.ts` — nunca setado
// manualmente aqui, nunca em querystring.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DiscountTableDetail,
  DiscountTableListItem,
  DiscountTablePayload,
  DiscountTablesListEnvelope,
  ProductOption,
  ProductOptionsEnvelope,
} from '@/@types/v2/DiscountTables';

// Params aceitos pela listagem — paginação real (só `page`, servidor fixa
// `per_page=10`) + o único filtro CONFIRMADO (`DiscountTableFilterData::$search`).
export interface ListDiscountTablesParams extends Omit<PaginationQueryParams, 'per_page'> {
  search?: string;
}

async function listDiscountTables(
  params: ListDiscountTablesParams
): Promise<ResponsePagination<DiscountTableListItem[]>> {
  const { data } = await api.V2.get<DiscountTablesListEnvelope>('/discount-tables', {
    page: params.page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFeedingPhases`/`listDiets` (meta REAL, nunca fabricada).
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

// GET /discount-tables/{uuid} — detalhe + subcadastros (produtos + regras).
async function getDiscountTable(discountTableUuid: string) {
  const { data } = await api.V2.get<Response<DiscountTableDetail>>(
    `/discount-tables/${discountTableUuid}`
  );
  return data;
}

// GET /discount-tables/product-options — lookup elegíveis (TR-06/LK-03),
// consumido pelo picker modal de Produtos (TASK-DT-FE-03). Busca é
// CLIENT-SIDE sobre a lista completa (mirror do picker do legado, `#product-
// search` — não é AJAX remoto).
async function getProductOptions(): Promise<ProductOption[]> {
  const { data } = await api.V2.get<ProductOptionsEnvelope>('/discount-tables/product-options');
  return data.data;
}

async function createDiscountTable(payload: DiscountTablePayload) {
  const { data } = await api.V2.post<Response<DiscountTableDetail>>('/discount-tables', payload);
  return data;
}

// PUT /discount-tables/{uuid} — a API reconcilia (TR-03: diff de produtos e,
// por produto, diff de regras por `type`+ordinal) — o front SEMPRE envia o
// estado final desejado completo, nunca uuid de regra.
async function updateDiscountTable(discountTableUuid: string, payload: DiscountTablePayload) {
  const { data } = await api.V2.put<Response<DiscountTableDetail>>(
    `/discount-tables/${discountTableUuid}`,
    payload
  );
  return data;
}

// DELETE /discount-tables/{uuid} — soft delete (cascade produtos+regras em
// nível de aplicação, TR-04).
async function deleteDiscountTable(discountTableUuid: string) {
  const { data } = await api.V2.delete(`/discount-tables/${discountTableUuid}`);
  return data;
}

export {
  createDiscountTable,
  deleteDiscountTable,
  getDiscountTable,
  getProductOptions,
  listDiscountTables,
  updateDiscountTable,
};
