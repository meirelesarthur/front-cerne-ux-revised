// src/services/v2/BaseRegistrations/lowReasons-service.ts
// -----------------------------------------------------------------------------
// Low Reason Service — API v1 do backend Laravel GB.Cerne (Motivos de Baixa).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /low-reasons            → data: LowReasonListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated() —
//                                     current_page/last_page/per_page/total).
//   GET    /low-reasons/{uuid}     → data: LowReasonData
//   POST   /low-reasons            → payload LowReasonPayload (create)
//   PUT    /low-reasons/{uuid}     → payload LowReasonPayload (update —
//                                     SEMPRE os 3 campos, nunca delta; ver
//                                     `tryPersistLowReason` em
//                                     CreateOrUpdateLowReasons.tsx)
//   DELETE /low-reasons/{uuid}     → 204; 422 estruturado se em uso em
//                                     write_offs — a `message` real do
//                                     envelope já é exibida pelo `onError`
//                                     genérico do `useRequest`.
//
// `listLowReasons` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mirror ESTRUTURAL de `listCostCenters` (paginação REAL), não o truque
// `meta:null` de `listSpecies` (Species não pagina; LowReason pagina de
// verdade — ApiResponse::paginated() real).
//
// Criado em TASK-LR-FE-01 (listLowReasons/deleteLowReason). Completado em
// TASK-LR-FE-02 (getLowReason/createLowReason/updateLowReason). Verbo de
// update confirmado `PUT` — `LowReason-contrato.md` seção 3, `routes/api.php`
// usa `apiResource` (registra PUT|PATCH), mesma convenção de
// `updateCostCenter`/`updateSpecie`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  LowReasonData,
  LowReasonPayload,
  LowReasonsListEnvelope,
  LowReasonListItem,
} from '@/@types/v2/BaseRegistrations/lowReasons';

// -----------------------------------------------------------------------------
// GET /low-reasons/active (`LowReasonController::active()`,
// `ListActiveLowReasonsAction`) — TASK-FE-036-331 (módulo compartilhado de
// Baixa Manual, campo "Motivo da baixa" do `WriteOffCreateModal`). Rota REAL
// do backend, sem função de frontend ainda — aditivo, mesmo padrão de
// `listActiveKinds`/`listActiveCategoryProducts` (envelope
// `ApiResponse::success`, `meta: null`, adaptado para o shape paginado que
// `SelectAsyncPaginate` espera). NÃO aceita `search` (`ListActiveLowReasonsAction::handle()`
// não recebe parâmetro nenhum) — devolve TODOS os motivos habilitados
// (`is_enabled=true`), sem filtro server-side. NÃO altera `listLowReasons`
// (paginação real, usada pela tela de cadastro).
// -----------------------------------------------------------------------------
async function listActiveLowReasons(): Promise<ResponsePagination<LowReasonListItem[]>> {
  const { data } = await api.V2.get<LowReasonsListEnvelope>('/low-reasons/active');

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

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (`is_enabled`/`do_movement`).
export interface ListLowReasonsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: 'true' | 'false';
  do_movement?: 'true' | 'false';
}

async function listLowReasons(
  params: ListLowReasonsParams
): Promise<ResponsePagination<LowReasonListItem[]>> {
  const { data } = await api.V2.get<LowReasonsListEnvelope>('/low-reasons', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    do_movement: params.do_movement || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo mecanismo de listCostCenters (paginação REAL, não o truque
  // meta:null de listSpecies).
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

async function deleteLowReason(lowReasonUuid: string) {
  const { data } = await api.V2.delete(`/low-reasons/${lowReasonUuid}`);
  return data;
}

// TASK-LR-FE-02 — detalhe (form de edição).
async function getLowReason(lowReasonUuid: string) {
  const { data } = await api.V2.get<Response<LowReasonData>>(`/low-reasons/${lowReasonUuid}`);
  return data;
}

async function createLowReason(payload: LowReasonPayload) {
  const { data } = await api.V2.post<Response<LowReasonData>>('/low-reasons', payload);
  return data;
}

// Update envia o payload COMPLETO (description+do_movement+is_enabled SEMPRE
// presentes) — NÃO delta. Diverge conscientemente de `updateSpecie` por
// exigência real do backend: `LowReasonRequest.rules()` marca os 3 campos
// como obrigatórios também no PUT (sem suporte a atualização parcial).
async function updateLowReason(lowReasonUuid: string, payload: LowReasonPayload) {
  const { data } = await api.V2.put<Response<LowReasonData>>(
    `/low-reasons/${lowReasonUuid}`,
    payload
  );
  return data;
}

export {
  createLowReason,
  deleteLowReason,
  getLowReason,
  listActiveLowReasons,
  listLowReasons,
  updateLowReason,
};
