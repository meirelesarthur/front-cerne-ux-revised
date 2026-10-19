// src/services/v2/Operations/operation-service.ts
// -----------------------------------------------------------------------------
// Operation Service — API v1 do backend Laravel GB.Cerne (Operações).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /operations          → data: OperationListItem[] + meta REAL de
//                                  paginação (ApiResponse::paginated(),
//                                  Operation-contrato.md v2.1 §8/§15).
//   GET    /operations/{uuid}   → data: OperationDetail.
//   POST   /operations          → payload OperationPayload (create).
//   PUT    /operations/{uuid}   → payload OperationPayload (update).
//   DELETE /operations/{uuid}   → 204; OU 500 genérico se vínculo ativo em
//                                  `operation_activities` (D8, sem catch
//                                  especial — `onError` genérico do
//                                  `useRequest` é suficiente).
//
// Escopo MÍNIMO original (TASK-FE-035): só `listOperations`, consumida pelo
// `CheckboxListField` "Operações" de `CreateOrUpdateAtividade.tsx`
// (`useOperationsChecklist`) — PRESERVADO/ESTENDIDO (não recriado) em
// TASK-FE-041 com as 4 funções de escrita, alinhado ao CRUD completo da tela
// dedicada de Operações (TASK-FE-042/043).
//
// `listOperations` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que
// `SelectAsyncPaginate`/`AsyncPaginate`/`useCustomGridQuery` consomem
// (`response.data?.items`) — MESMO adaptador de `listActivities`/`listCostCenters`.
//
// ⚠️ ÚNICA correção pontual em `listOperations` (TASK-FE-041, `GAP-FE-006`
// resolvido, Opção B): o param da querystring passa de `grouper_id` para
// `grouper_uuid` — NÃO é mais 100% aditivo, mas o único consumidor hoje
// (`useOperationsChecklist`/Atividades) nunca envia esse filtro
// (`CheckboxListField` não filtra por Agrupador), então não há regressão
// real (confirmado: `grep -rn "grouper_id" src/pages/CadastrosBase/Atividades`
// → 0 ocorrências).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  OperationDetail,
  OperationFilterForm,
  OperationListItem,
  OperationNextOrder,
  OperationPayload,
  OperationsListEnvelope,
} from '@/@types/v2/Operations';

// Params aceitos pela listagem — paginação real + busca + filtros reais do
// backend (OperationFilterData): search/is_enabled/use/grouper_uuid.
export interface ListOperationsParams extends PaginationQueryParams, OperationFilterForm {}

async function listOperations(
  params: ListOperationsParams
): Promise<ResponsePagination<OperationListItem[]>> {
  const { data } = await api.V2.get<OperationsListEnvelope>('/operations', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    use: params.use || undefined,
    grouper_uuid: params.grouper_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination — lê
  // `meta.total`/`per_page`/`current_page`/`last_page` REAIS, mesmo padrão de
  // `listActivities`/`listCostCenters`.
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

async function getOperationByUuid(operationUuid: string) {
  const { data } = await api.V2.get<Response<OperationDetail>>(`/operations/${operationUuid}`);
  return data;
}

// Ajuste pós-E2E — backend virou AUTORITATIVO sobre `order` (recalcula no
// create, preserva no update). Campo "Ordem" vira read-only na tela; em
// CRIAÇÃO exibe esta próxima ordem disponível.
async function getNextOperationOrder() {
  const { data } = await api.V2.get<Response<OperationNextOrder>>('/operations/next-order');
  return data;
}

async function createOperation(payload: OperationPayload) {
  const { data } = await api.V2.post<Response<OperationDetail>>('/operations', payload);
  return data;
}

async function updateOperation(operationUuid: string, payload: OperationPayload) {
  const { data } = await api.V2.put<Response<OperationDetail>>(
    `/operations/${operationUuid}`,
    payload
  );
  return data;
}

async function deleteOperation(operationUuid: string) {
  const { data } = await api.V2.delete(`/operations/${operationUuid}`);
  return data;
}

export {
  createOperation,
  deleteOperation,
  getNextOperationOrder,
  getOperationByUuid,
  listOperations,
  updateOperation,
};
