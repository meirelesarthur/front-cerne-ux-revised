// src/services/v2/BaseRegistrations/systemUpdate-service.ts
// -----------------------------------------------------------------------------
// SystemUpdate Service — API v1 do backend Laravel GB.Cerne (Atualizações do
// Sistema). Execução 031, TASK-FE-1100. Mirror mecânico de
// `warehouse-service.ts` (mesma tenancy GLOBAL — sem `X-Farm-Id`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /system-updates            → data: SystemUpdateListItem[] + meta paginação (default 10, teto 100)
//   GET    /system-updates/{uuid}     → data: SystemUpdateDetail (alias estrutural do item da lista)
//   POST   /system-updates            → payload SystemUpdatePayload
//   PUT    /system-updates/{uuid}     → payload SystemUpdatePayload
//   DELETE /system-updates/{uuid}     → hard delete (sem soft delete, fiel ao legado)
//   GET    /system-updates/pending    → data: SystemUpdateListItem[] FLAT, sem paginação (GAP-BE-511)
//   POST   /system-updates/{uuid}/seen → data: null (idempotente — upsert na pivô `system_update_user`)
//
// `listSystemUpdates` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` consumido pela infra de grid do projeto
// (useCustomGridQuery/TableProvider) — mesmo truque de `listWarehouses`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SystemUpdateDetail,
  SystemUpdateListItem,
  SystemUpdatePayload,
  SystemUpdatePendingEnvelope,
  SystemUpdatesListEnvelope,
} from '@/@types/v2/BaseRegistrations/systemUpdate';

export interface ListSystemUpdatesParams extends PaginationQueryParams {}

async function listSystemUpdates(
  params: ListSystemUpdatesParams
): Promise<ResponsePagination<SystemUpdateListItem[]>> {
  const { data } = await api.V2.get<SystemUpdatesListEnvelope>('/system-updates', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function getSystemUpdate(systemUpdateUuid: string) {
  const { data } = await api.V2.get<Response<SystemUpdateDetail>>(
    `/system-updates/${systemUpdateUuid}`
  );
  return data;
}

async function createSystemUpdate(payload: SystemUpdatePayload) {
  const { data } = await api.V2.post<Response<SystemUpdateDetail>>('/system-updates', payload);
  return data;
}

async function updateSystemUpdate(systemUpdateUuid: string, payload: SystemUpdatePayload) {
  const { data } = await api.V2.put<Response<SystemUpdateDetail>>(
    `/system-updates/${systemUpdateUuid}`,
    payload
  );
  return data;
}

async function deleteSystemUpdate(systemUpdateUuid: string) {
  const { data } = await api.V2.delete(`/system-updates/${systemUpdateUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// Popup do dashboard (GAP-BE-511-systemupdate, decisão do dono: Opção A) —
// consumidos por `src/pages/Home/SystemUpdatePendingModal.tsx`, componente
// AUTOCONTIDO montado na Home (fora do CRUD administrativo desta pasta).
// -----------------------------------------------------------------------------

async function getPendingSystemUpdates() {
  const { data } = await api.V2.get<SystemUpdatePendingEnvelope>('/system-updates/pending');
  return data;
}

async function markSystemUpdateSeen(systemUpdateUuid: string) {
  const { data } = await api.V2.post<Response<null>>(`/system-updates/${systemUpdateUuid}/seen`);
  return data;
}

export {
  createSystemUpdate,
  deleteSystemUpdate,
  getPendingSystemUpdates,
  getSystemUpdate,
  listSystemUpdates,
  markSystemUpdateSeen,
  updateSystemUpdate,
};
