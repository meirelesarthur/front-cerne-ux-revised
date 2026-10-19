// src/services/v2/Addressing/addressing-service.ts
// -----------------------------------------------------------------------------
// Addressing Service — API v1 do backend Laravel GB.Cerne (Endereçamento
// físico de estoque: Setor→Corredor→Prateleira→Nível).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /addressings/tree    → data: AddressingTreeNode[] (árvore completa
//                                  dos 4 níveis fixos, não-paginada,
//                                  tenant-scoped — Seção 3 do
//                                  Addressing-contrato.md, DA-AD-16)
//   GET    /addressings/{uuid}  → data: AddressingData (TASK-AD-03b)
//   POST   /addressings         → data: AddressingData (TASK-AD-03b)
//   PUT    /addressings/{uuid}  → data: AddressingData — verbo HTTP `PUT`
//                                  conforme Seção 3 do contrato (TASK-AD-03b)
//   DELETE /addressings/{uuid}  → 204; bloqueia com 422 `errors.in_use[]`
//                                  se houver endereçamentos-filhos e/ou
//                                  `products` vinculados (DA-AD-05/07)
//
// Envelope real da API (`{success,message,data,errors,meta}`) diverge do
// tipo genérico `Response<I>` do projeto (`{data,notifications,success,
// statusCode,message}`, `src/@types/response-api.d.ts`) — mesma nota já
// registrada em `TASK-CV-04a`: não bloqueia (só precisamos de `data`/
// `message`); o tipo de erro estruturado (`AddressingInUseError`) é tratado
// no `catch`/`onError` da mutação de exclusão, não no tipo de retorno aqui.
//
// X-Farm-Id é propagado automaticamente pelo interceptor de `api.V2`
// (src/services/api.ts) — nenhum tratamento adicional necessário aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AddressingData,
  AddressingListItem,
  AddressingOption,
  AddressingOptionsListEnvelope,
  AddressingsListEnvelope,
  AddressingTreeNode,
  CreateAddressingRequest,
  UpdateAddressingRequest,
} from '@/@types/v2/Addressing/addressing';

// Catálogo de apoio (Select assíncrono) — consumido pelo módulo de Produtos
// (TASK-FE-500/504, campo `addressing_uuid`). `GET /addressings` (`index()`)
// já é rota real do backend (paginação REAL, `ApiResponse::paginated`), mas
// não tinha função de frontend ainda — o módulo próprio de Addressing usa só
// `/tree` (árvore completa, não-paginada). Aditivo — NÃO altera nenhuma
// função existente deste arquivo. Só `search` é exposto (mesmo escopo mínimo
// de `listWarehouses`/`listFinancialCategories` — sem variante `/active`,
// task-packet TASK-FE-500).
export interface ListAddressingsParams extends PaginationQueryParams {
  search?: string;
}

async function listAddressings(
  params: ListAddressingsParams
): Promise<ResponsePagination<AddressingListItem[]>> {
  const { data } = await api.V2.get<AddressingsListEnvelope>('/addressings', {
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

async function getAddressingTree() {
  const { data } = await api.V2.get<Response<AddressingTreeNode[]>>(
    "/addressings/tree"
  );
  return data;
}

async function getAddressingById(uuid: string) {
  const { data } = await api.V2.get<Response<AddressingData>>(
    `/addressings/${uuid}`
  );
  return data;
}

async function createAddressing(payload: CreateAddressingRequest) {
  const { data } = await api.V2.post<Response<AddressingData>>(
    "/addressings",
    payload
  );
  return data;
}

async function updateAddressing(
  uuid: string,
  payload: UpdateAddressingRequest
) {
  // Verbo `PUT` (Addressing-contrato.md Seção 3) — confirmado explicitamente,
  // não copiado de `PATCH` de outras entidades do projeto sem verificar
  // (mesma ressalva já registrada em TASK-CV-04b).
  const { data } = await api.V2.put<Response<AddressingData>>(
    `/addressings/${uuid}`,
    payload
  );
  return data;
}

async function deleteAddressing(addressingUuid: string) {
  const { data } = await api.V2.delete(`/addressings/${addressingUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /addressings/options (TASK-BE-508, aditivo TASK-FE-504) — lookup ENXUTO
// para o Select `addressing_uuid` do formulário de Produtos (Aba 2). SEM
// gate de `addressings_view`. FLAT — `meta` sempre `null`; o
// `SelectAsyncPaginate` que consome este service DEVE receber `pageSize`
// maior que o volume real do catálogo (24 linhas totais) para não disparar
// uma 2ª página fantasma.
// -----------------------------------------------------------------------------
export interface ListAddressingOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listAddressingOptions(
  params: ListAddressingOptionsParams
): Promise<ResponsePagination<AddressingOption[]>> {
  const { data } = await api.V2.get<AddressingOptionsListEnvelope>('/addressings/options', {
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
  createAddressing,
  deleteAddressing,
  getAddressingById,
  getAddressingTree,
  listAddressingOptions,
  listAddressings,
  updateAddressing,
};
