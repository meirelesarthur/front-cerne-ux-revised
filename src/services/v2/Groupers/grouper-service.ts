// src/services/v2/Groupers/grouper-service.ts
// -----------------------------------------------------------------------------
// Grouper Service — API v1 do backend Laravel GB.Cerne (Agrupadores).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
// Catálogo GLOBAL (sem farm_id/tenant_id) — nenhuma função aqui envia
// `X-Farm-Id` manualmente (mesmo racional de CategoryMatrix/TypeTitle).
//
//   GET    /groupers            → 3 MODOS de listagem, decididos pelo
//                                  BACKEND conforme os parâmetros presentes
//                                  (contrato §6, TASK-BE-052) — `listGroupers`
//                                  é UM ÚNICO modo no service, nunca decodifica
//                                  3 endpoints:
//     · sem `search`/`parent_uuid` → RAIZ, paginado (per_page default 10).
//     · `parent_uuid=<uuid>`       → FILHOS DIRETOS daquele nó, paginado.
//     · `search=<termo>`           → BUSCA achatada (qualquer nível), paginado.
//     Filtros `type`/`condition`/`is_enabled` combináveis com qualquer modo.
//     Meta REAL (current_page/last_page/per_page/total) — mesmo shape de
//     `ProductGroupsApiPaginationMeta`.
//   GET    /groupers/{uuid}     → data: GrouperDetail
//   POST   /groupers            → payload GrouperPayload
//   PUT    /groupers/{uuid}     → payload GrouperPayload — `code` NÃO
//                                  recalcula quando o pai muda (fidelidade
//                                  ao legado, D4 do contrato); `parent_uuid`
//                                  com os 3 estados reais (ver ATENÇÃO abaixo).
//   DELETE /groupers/{uuid}     → 204; exclusão FÍSICA (cascata de subárvore
//                                  em transação no backend); 422 se algum
//                                  descendente tiver `FinancialCategory`
//                                  vinculada — `onError` genérico do
//                                  `useRequest` já exibe `error.response.data.message`.
//
// `listGroupers` ADAPTA o envelope PAGINADO REAL do backend para o shape
// `ResponsePagination` que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — mesmo adaptador de
// `listProductGroups`/`listTypeTitles` (meta REAL, não fallback fake).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  GrouperDetail,
  GrouperListItem,
  GrouperPayload,
  GroupersListEnvelope,
} from '@/@types/v2/Groupers';

// Estende `PaginationQueryParams` (mesma convenção de `ListProductGroupsParams`/
// `ListTypeTitlesParams`) — `parent_uuid`/`search` são exclusivos entre si na
// prática (o backend prioriza `search` se ambos vierem — contrato §6), mas o
// TYPE não impõe essa exclusão: é responsabilidade do CHAMADOR (hooks) nunca
// mandar os dois ao mesmo tempo.
export interface ListGroupersParams extends PaginationQueryParams {
  search?: string;
  parent_uuid?: string;
  type?: number;
  condition?: number;
  is_enabled?: 'true' | 'false';
}

// Modo único no service — o BACKEND decide raiz/filhos/busca pela presença
// de `search`/`parent_uuid` (contrato §6, TASK-BE-052). O front só precisa
// mandar o parâmetro certo; não decodificar 3 endpoints aqui.
async function listGroupers(
  params: ListGroupersParams
): Promise<ResponsePagination<GrouperListItem[]>> {
  const { data } = await api.V2.get<GroupersListEnvelope>('/groupers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    parent_uuid: params.parent_uuid || undefined,
    type: params.type || undefined,
    condition: params.condition || undefined,
    is_enabled: params.is_enabled || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS.
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

// GET /groupers/options — lookup ENXUTO (GAP-BE-040 Opção B), sem gate de
// `groupers_view` (só `auth:sanctum`). Alimenta o Select "Agrupador" de
// telas QUE NÃO SÃO a própria tela de Agrupadores (ex.: Operações) — usuários
// sem `groupers_view` continuam sem acessar CRUD/árvore de Agrupadores, mas
// conseguem escolher um Agrupador ao criar/filtrar Operação.
// MESMO adaptador de `listGroupers` (ResponsePagination) — só a rota muda.
// Params: apenas `search`/`per_page`/`page` (o endpoint não aceita
// `parent_uuid`/`type`/`condition`/`is_enabled` — não é a árvore completa).
async function listGrouperOptions(
  params: Pick<ListGroupersParams, 'search' | 'per_page' | 'page'>
): Promise<ResponsePagination<GrouperListItem[]>> {
  const { data } = await api.V2.get<GroupersListEnvelope>('/groupers/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

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

async function getGrouper(uuid: string) {
  const { data } = await api.V2.get<Response<GrouperDetail>>(`/groupers/${uuid}`);
  return data;
}

async function createGrouper(payload: GrouperPayload) {
  const { data } = await api.V2.post<Response<GrouperDetail>>('/groupers', payload);
  return data;
}

// ATENÇÃO: para respeitar a semântica de 3 estados de `parent_uuid` no
// update (TASK-BE-051), o CHAMADOR decide se a chave entra no objeto —
// `delete payload.parent_uuid` quando "manter pai atual" (nunca enviar
// `parent_uuid: undefined` explícito e confiar apenas no `JSON.stringify`
// para omiti-la; deixar explícito na tela é mais seguro). `code` nunca é
// enviado (não recalcula no update — fidelidade ao legado, D4).
async function updateGrouper(uuid: string, payload: GrouperPayload) {
  const { data } = await api.V2.put<Response<GrouperDetail>>(`/groupers/${uuid}`, payload);
  return data;
}

// Exclusão FÍSICA (cascata de subárvore em transação no backend) — 422 se
// algum descendente tiver `FinancialCategory` vinculada.
async function deleteGrouper(uuid: string) {
  const { data } = await api.V2.delete(`/groupers/${uuid}`);
  return data;
}

export {
  createGrouper,
  deleteGrouper,
  getGrouper,
  listGrouperOptions,
  listGroupers,
  updateGrouper,
};
