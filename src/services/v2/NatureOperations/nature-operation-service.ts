// src/services/v2/NatureOperations/nature-operation-service.ts
// -----------------------------------------------------------------------------
// NatureOperation Service — API v1 do backend Laravel GB.Cerne (Natureza de
// Operação).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /nature-operations          → data: NatureOperationListItem[],
//                                         meta com paginação real. Dentro do
//                                         bloco farm.context ESTRITO (Scope
//                                         dedicado NatureOperationTenantScope).
//   GET    /nature-operations/active   → data: NatureOperationListItem[] SEM
//                                         paginação (`ApiResponse::success`,
//                                         `ativo=true`) — GAP-SEC-09 P0-B,
//                                         picker real do CT-e
//                                         (`getCte-service` consome via
//                                         `listActiveNatureOperations`).
//   DELETE /nature-operations/{uuid}   → 204; 422 estruturado
//                                         (`errors.in_use[]`) se em uso
//                                         (DeleteNatureOperationAction, guarda
//                                         dupla dependencyUsageCounts()+catch
//                                         23503) — a `message` real do
//                                         envelope já é exibida pelo
//                                         `onError` genérico do `useRequest`,
//                                         sem precisar decodificar
//                                         `errors.in_use[]` estruturado nesta
//                                         tela.
//   GET    /nature-operations/{uuid}   → data: NatureOperationData
//                                         (TASK-NO-FE-02)
//   POST   /nature-operations          → payload NatureOperationPayload
//                                         SEMPRE completo (TASK-NO-FE-02,
//                                         `NatureOperationRequest::rules()`
//                                         não diferencia por verbo nos campos
//                                         base)
//   PUT    /nature-operations/{uuid}   → payload NatureOperationPayload
//                                         SEMPRE completo (idem)
//
// `listNatureOperations` ADAPTA o envelope { data: [], meta: {} } para o
// shape `ResponsePagination` que `useCustomGridQuery`/`TableProvider`
// consomem — mesmo adaptador de `listAdditionalInfos`/`listTaxRules`
// (paginação REAL, meta vem do backend).
//
// Criado em TASK-NO-FE-01 (listNatureOperations/deleteNatureOperation).
// TASK-NO-FE-02 (este bloco) ESTENDE este arquivo com
// getNatureOperation/createNatureOperation/updateNatureOperation.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  NatureOperationData,
  NatureOperationImportDefaultsResult,
  NatureOperationListItem,
  NatureOperationPayload,
  NatureOperationsListEnvelope,
} from '@/@types/v2/NatureOperations';

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (`tipo`/`ativo`).
export interface ListNatureOperationsParams extends PaginationQueryParams {
  search?: string;
  tipo?: number; // 0=Entrada, 1=Saída — TipoOperacaoEnum
  ativo?: boolean;
}

async function listNatureOperations(
  params: ListNatureOperationsParams
): Promise<ResponsePagination<NatureOperationListItem[]>> {
  const { data } = await api.V2.get<NatureOperationsListEnvelope>('/nature-operations', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    tipo: params.tipo ?? undefined,
    ativo: params.ativo ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination — mesmo
  // mecanismo de listAdditionalInfos/listTaxRules (paginação REAL, meta vem
  // do backend: current_page/last_page/per_page/total).
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

async function deleteNatureOperation(natureOperationUuid: string) {
  const { data } = await api.V2.delete(`/nature-operations/${natureOperationUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /nature-operations/active (`NatureOperationController::active()`,
// `ListActiveNatureOperationsAction`) — GAP-SEC-09 P0-B (picker real de
// natureza de operação no formulário de CT-e, `natureza_id` FK tenant-scoped
// substituindo o estático 1/2/3 do legado, NT-01/DV08 REVOGADO). Envelope
// `ApiResponse::success` (NÃO paginado, reaproveita `NatureOperationResource`
// completo) — adaptado aqui para o shape `ResponsePagination` que
// `SelectAsyncPaginate` espera, mesmo mecanismo de `listActiveLowReasons`
// (BaseRegistrations): devolve TODAS as naturezas ativas do tenant
// (`ativo=true`) numa página só, sem parâmetro `search` no backend
// (`ListActiveNatureOperationsAction::handle()` não recebe argumento).
// -----------------------------------------------------------------------------
async function listActiveNatureOperations(): Promise<
  ResponsePagination<NatureOperationListItem[]>
> {
  const { data } = await api.V2.get<NatureOperationsListEnvelope>('/nature-operations/active');

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

// -----------------------------------------------------------------------------
// TASK-NO-FE-02 — formulário create/edit.
// -----------------------------------------------------------------------------

async function getNatureOperation(natureOperationUuid: string) {
  const { data } = await api.V2.get<Response<NatureOperationData>>(
    `/nature-operations/${natureOperationUuid}`
  );
  return data;
}

// Payload SEMPRE completo (create/update — `NatureOperationRequest` não usa
// `sometimes` nos campos base do PUT, contrato §4.3).
async function createNatureOperation(payload: NatureOperationPayload) {
  const { data } = await api.V2.post<Response<NatureOperationData>>('/nature-operations', payload);
  return data;
}

async function updateNatureOperation(natureOperationUuid: string, payload: NatureOperationPayload) {
  const { data } = await api.V2.put<Response<NatureOperationData>>(
    `/nature-operations/${natureOperationUuid}`,
    payload
  );
  return data;
}

// UT-000779 — "Usar modelos": POST /nature-operations/import-defaults (sem body,
// permissão `natop_create`, idempotente). Copia para o tenant as naturezas
// padrão do sistema ainda inexistentes; retorna { created, existing }.
async function importDefaultNatureOperations() {
  const { data } = await api.V2.post<Response<NatureOperationImportDefaultsResult>>(
    '/nature-operations/import-defaults'
  );
  return data;
}

export {
  createNatureOperation,
  deleteNatureOperation,
  getNatureOperation,
  importDefaultNatureOperations,
  listActiveNatureOperations,
  listNatureOperations,
  updateNatureOperation,
};
