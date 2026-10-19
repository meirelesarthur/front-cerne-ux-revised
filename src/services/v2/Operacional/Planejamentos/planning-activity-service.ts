// src/services/v2/Operacional/Planejamentos/planning-activity-service.ts
// -----------------------------------------------------------------------------
// PlanningActivity Service — API v1 do backend Laravel GB.Cerne (Atividades
// dentro de uma operação de Planejamento, nível 3 da árvore) —
// TASK-FE-PLAN-05 (execução `97-Esteiras/007`, SUR-18..20).
//
//   POST   /planning-activities       → cria (R19)
//   PUT    /planning-activities/{uuid} → edita (R20)
//   DELETE /planning-activities/{uuid} → exclui (R21)
//
// Sem `index`/`show` dedicados (R22 nunca teve handler no legado, matriz
// FID-G3A NAO_APLICAVEL). O dado de leitura vem SEMPRE da árvore
// (`getPlanningTree`, `planning-service.ts`) — este service só cobre as 3
// mutações + o catálogo de lookup (abaixo).
//
// `listPlanningActivityCatalog` — `GET /activities/options` (LK-06,
// `ActivityOptionResource`, lookup ENXUTO sem permissão dedicada,
// GAP-BE-040 Opção B, MESMO endpoint já consumido por
// `ServiceOrders/service-order-service.ts#listServiceOrderActivityOptions`).
// `operation_uuid` escopa pela OPERAÇÃO CATÁLOGO corrente (armadilha 3 do
// Roteiro) — ver nota de divergência de contrato em
// `@/@types/v2/Operacional/planning-activity` (endpoint real não suporta
// `uses[]`, só `search`+`operation_uuid`).
//
// Rotas dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { PlanningActivityTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityCatalogListEnvelope,
  PlanningActivityCatalogOption,
  PlanningActivityCreatePayload,
  PlanningActivityUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity';

async function createPlanningActivity(payload: PlanningActivityCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningActivityTreeItem>>(
    '/planning-activities',
    payload
  );
  return data;
}

async function updatePlanningActivity(uuid: string, payload: PlanningActivityUpdatePayload) {
  const { data } = await api.V2.put<Response<PlanningActivityTreeItem>>(
    `/planning-activities/${uuid}`,
    payload
  );
  return data;
}

async function deletePlanningActivity(uuid: string) {
  const { data } = await api.V2.delete(`/planning-activities/${uuid}`);
  return data;
}

export interface ListPlanningActivityCatalogParams extends PaginationQueryParams {
  search?: string;
  /** Uuid da `Operation` CATÁLOGO corrente (`PlanningOperationTreeItem.
   *  operation.uuid`, NUNCA `planning_operation_uuid`) — escopa o catálogo
   *  pela operação, armadilha 3 do Roteiro. */
  operation_uuid?: string;
}

// GET /activities/options?operation_uuid= — PAGINADO (ApiResponse::paginated).
async function listPlanningActivityCatalog(
  params: ListPlanningActivityCatalogParams
): Promise<ResponsePagination<PlanningActivityCatalogOption[]>> {
  const { data } = await api.V2.get<PlanningActivityCatalogListEnvelope>('/activities/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    operation_uuid: params.operation_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination — mesmo
  // adaptador de `listServiceOrderActivityOptions`/`listPlanningOperationCatalog`.
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

export {
  createPlanningActivity,
  deletePlanningActivity,
  listPlanningActivityCatalog,
  updatePlanningActivity,
};
