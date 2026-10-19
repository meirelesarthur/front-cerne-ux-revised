// src/services/v2/Maintenances/maintenance-service.ts
// -----------------------------------------------------------------------------
// Maintenance Service — API v1 do backend Laravel GB.Cerne (Manutenções,
// Gestão de Frota, F-103). Header reaproveitado de `Appropriation`
// (mirror `supply-service.ts`), com sequência de `code` PRÓPRIA
// (`MaintenanceRepository::nextSequentialCode`, nunca a de Apropriações).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /maintenances                          → data: MaintenanceListItem[]
//                                                    + meta de paginação
//                                                    (Tarefa 43)
//   GET    /maintenances/{uuid}                    → MaintenanceDetail (show —
//                                                    reusado para hidratar a
//                                                    Visualização E a Edição,
//                                                    sem GET .../edit, Tarefa 43)
//   DELETE /maintenances/{uuid}                    → 204 (Tarefa 43)
//   POST   /maintenances                           → payload MaintenancePayload
//                                                    (Tarefa 44)
//   PUT    /maintenances/{uuid}                    → payload MaintenancePayload,
//                                                    full-replace de items[]
//                                                    (Tarefa 44)
//   POST   /maintenances/{uuid}/generate-financial → payload
//                                                    GenerateFinancialPayload
//                                                    (Tarefa 45)
//
// `listMaintenances` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` que a infra de grid do
// projeto (useCustomGridQuery/TableProvider) consome — mirror
// `listSupplies`/`listStocks` (meta REAL, nunca fallback fake).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { ExpenseListItem } from '@/@types/v2/Financeiro/expense';
import type {
  GenerateFinancialPayload,
  MaintenanceDetail,
  MaintenanceDetailApi,
  MaintenanceListItem,
  MaintenancePayload,
  MaintenancesListEnvelope,
} from '@/@types/v2/Maintenances';

import { mapMaintenanceDetail } from './maintenance-mapper';

// ============================================
// LISTAGEM — GET /maintenances (Tarefa 43)
// ============================================

export interface ListMaintenancesParams extends PaginationQueryParams {
  equipment_uuid?: string;
  start_date?: string;
  end_date?: string;
}

async function listMaintenances(
  params: ListMaintenancesParams
): Promise<ResponsePagination<MaintenanceListItem[]>> {
  const { data } = await api.V2.get<MaintenancesListEnvelope>('/maintenances', {
    page: params.page,
    per_page: params.per_page,
    equipment_uuid: params.equipment_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listSupplies`/`listWarehouses`/`listStocks` (meta REAL).
  // UT-000684 — itens normalizados (executor aninhado → plano) pelo mapper.
  const items = data.data.map(mapMaintenanceDetail);
  return {
    success: data.success,
    message: data.message,
    data: {
      items,
      pagination: {
        total: data.meta?.total ?? items.length,
        count: items.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// ============================================
// DETALHE — GET /maintenances/{uuid} (Tarefa 43 — reusado pela Edição na Tarefa 44)
// ============================================

async function getMaintenanceByUuid(uuid: string): Promise<Response<MaintenanceDetail>> {
  const { data } = await api.V2.get<Response<MaintenanceDetailApi>>(`/maintenances/${uuid}`);
  // UT-000684 — ponto ÚNICO de normalização do executor aninhado da API.
  return { ...data, data: mapMaintenanceDetail(data.data) };
}

// ============================================
// EXCLUSÃO — DELETE /maintenances/{uuid} (Tarefa 43)
// ============================================

async function deleteMaintenance(uuid: string): Promise<void> {
  await api.V2.delete(`/maintenances/${uuid}`);
}

// ============================================
// CRIAÇÃO/EDIÇÃO — POST/PUT /maintenances (Tarefa 44). JSON puro (sem
// `FormData` — o contrato §4 NÃO tem upload de arquivo nesta feature,
// mirror `createSupply`/`updateSupply`).
// ============================================

async function createMaintenance(
  payload: MaintenancePayload
): Promise<Response<MaintenanceDetail>> {
  const { data } = await api.V2.post<Response<MaintenanceDetailApi>>('/maintenances', payload);
  return { ...data, data: mapMaintenanceDetail(data.data) };
}

async function updateMaintenance(
  uuid: string,
  payload: MaintenancePayload
): Promise<Response<MaintenanceDetail>> {
  const { data } = await api.V2.put<Response<MaintenanceDetailApi>>(
    `/maintenances/${uuid}`,
    payload
  );
  return { ...data, data: mapMaintenanceDetail(data.data) };
}

// ============================================
// "GERAR FINANCEIRO" — POST /maintenances/{uuid}/generate-financial
// (Tarefa 45). Resposta: N `Expense`s criados — reusa `ExpenseListItem`
// (Contas a Pagar, já existente) em vez de um tipo próprio
// (`MaintenanceFinancialResource` não foi criado pelo backend, conforme o
// Histórico de Mudanças da Tarefa 44 backend — "reusa ExpenseResource já
// existente").
// ============================================

async function generateMaintenanceFinancial(
  uuid: string,
  payload: GenerateFinancialPayload
): Promise<Response<ExpenseListItem[]>> {
  const { data } = await api.V2.post<Response<ExpenseListItem[]>>(
    `/maintenances/${uuid}/generate-financial`,
    payload
  );
  return data;
}

export {
  createMaintenance,
  deleteMaintenance,
  generateMaintenanceFinancial,
  getMaintenanceByUuid,
  listMaintenances,
  updateMaintenance,
};
