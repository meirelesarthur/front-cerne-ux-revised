// src/services/v2/MaintenancePreventives/maintenance-preventive-service.ts
// -----------------------------------------------------------------------------
// Maintenance Preventive Service — API v1 do backend Laravel GB.Cerne
// (Manutenções Preventivas, Gestão de Frota). Tabela dedicada
// `maintenance_preventives` (Rota A do
// `GAP-CONFLITO-MANUTENCOES-PREVENTIVAS-01`, zero reuso de Apontamentos).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /maintenance-preventives          → data: MaintenancePreventiveListItem[]
//                                              + meta de paginação (Tarefa 43)
//   POST   /maintenance-preventives          → payload
//                                              MaintenancePreventivePayload,
//                                              permission
//                                              maintenance-preventives_create
//                                              (Tarefa 44)
//   GET    /maintenance-preventives/{uuid}   → MaintenancePreventiveDetail
//                                              (show — reusado para hidratar
//                                              Visualização E Edição, sem
//                                              GET .../edit, Tarefa 43)
//   PUT    /maintenance-preventives/{uuid}   → payload
//                                              MaintenancePreventivePayload,
//                                              full-replace de items[]
//                                              (Tarefa 44)
//   DELETE /maintenance-preventives/{uuid}   → 204 (Tarefa 43)
//
// `listMaintenancePreventives` ADAPTA o envelope paginado do backend
// ({ data: [], meta: {} }) para o shape `ResponsePagination`
// ({ data: { items, pagination } }) que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — mirror `listSupplies`/
// `listStocks` (meta REAL, nunca fallback fake).
//
// `createMaintenancePreventive`/`updateMaintenancePreventive` enviam JSON
// puro (sem `FormData`) — o contrato NÃO tem upload de arquivo nesta feature.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MaintenancePreventiveDetail,
  MaintenancePreventiveListItem,
  MaintenancePreventivePayload,
  MaintenancePreventivesListEnvelope,
} from '@/@types/v2/MaintenancePreventives';

// ============================================
// LISTAGEM — GET /maintenance-preventives (Tarefa 43)
// ============================================

export interface ListMaintenancePreventivesParams extends PaginationQueryParams {
  equipment_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listMaintenancePreventives(
  params: ListMaintenancePreventivesParams
): Promise<ResponsePagination<MaintenancePreventiveListItem[]>> {
  const { data } = await api.V2.get<MaintenancePreventivesListEnvelope>(
    '/maintenance-preventives',
    {
      page: params.page,
      per_page: params.per_page,
      equipment_uuid: params.equipment_uuid || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    }
  );

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listSupplies`/`listStocks` (meta REAL, não fallback fake).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// ============================================
// DETALHE — GET /maintenance-preventives/{uuid} (Tarefa 43 — reusado pela
// Edição na Tarefa 44)
// ============================================

async function getMaintenancePreventiveByUuid(
  uuid: string
): Promise<Response<MaintenancePreventiveDetail>> {
  const { data } = await api.V2.get<Response<MaintenancePreventiveDetail>>(
    `/maintenance-preventives/${uuid}`
  );
  return data;
}

// ============================================
// EXCLUSÃO — DELETE /maintenance-preventives/{uuid} (Tarefa 43)
// ============================================

async function deleteMaintenancePreventive(uuid: string): Promise<void> {
  await api.V2.delete(`/maintenance-preventives/${uuid}`);
}

// ============================================
// CRIAÇÃO/EDIÇÃO — POST/PUT /maintenance-preventives (Tarefa 44)
// ============================================

async function createMaintenancePreventive(
  payload: MaintenancePreventivePayload
): Promise<Response<MaintenancePreventiveDetail>> {
  const { data } = await api.V2.post<Response<MaintenancePreventiveDetail>>(
    '/maintenance-preventives',
    payload
  );
  return data;
}

async function updateMaintenancePreventive(
  uuid: string,
  payload: MaintenancePreventivePayload
): Promise<Response<MaintenancePreventiveDetail>> {
  const { data } = await api.V2.put<Response<MaintenancePreventiveDetail>>(
    `/maintenance-preventives/${uuid}`,
    payload
  );
  return data;
}

export {
  createMaintenancePreventive,
  deleteMaintenancePreventive,
  getMaintenancePreventiveByUuid,
  listMaintenancePreventives,
  updateMaintenancePreventive,
};
