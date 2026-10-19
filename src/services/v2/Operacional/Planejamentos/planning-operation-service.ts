// src/services/v2/Operacional/Planejamentos/planning-operation-service.ts
// -----------------------------------------------------------------------------
// PlanningOperation Service — API v1 do backend Laravel GB.Cerne (Operações
// dentro de um cultivo de Planejamento, nível 2 da árvore) — TASK-FE-PLAN-04
// (execução `97-Esteiras/007`, SUR-13..17).
//
//   POST   /planning-operations       → cria MANUAL (catálogo use=2, R15)
//   PUT    /planning-operations/{uuid} → "Definir Período" (só datas, R16)
//   DELETE /planning-operations/{uuid} → exclusão física (R17)
//
// Sem `index`/`show` dedicados — nunca migrados (R18 nunca teve handler no
// legado, matriz FID-G3A NAO_APLICAVEL). O dado de leitura vem SEMPRE da
// árvore (`getPlanningTree`, `planning-service.ts`) — este service só cobre
// as 3 mutações + o catálogo de lookup (abaixo) + "Definir Produção"
// (reaproveita `planning-cultivations/{uuid}`, MESMO endpoint de
// `TASK-FE-PLAN-03`, payload parcial DEDICADO).
//
// `listPlanningOperationCatalog` — `GET /operations/options?category=2`
// (`OperationOptionResource`, lookup ENXUTO sem permissão dedicada,
// GAP-BE-040 Opção B, MESMO endpoint já consumido por
// `ServiceOrders/service-order-service.ts#listServiceOrderOperationOptions`).
// `category=2` (Agricultura) é FIXO — armadilha 3 do Roteiro: este NÃO é o
// catálogo do auto-seed (`use IN (1,2)`, 100% server-side,
// `SeedBlankOperationsAction`, SUR-14, sem UI própria) — é o catálogo
// restrito da criação MANUAL (SUR-15, "Criar Operação").
//
// Rotas dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PlanningCultivationTreeItem,
  PlanningOperationTreeItem,
} from '@/@types/v2/Operacional/planning';
import type {
  PlanningOperationCatalogListEnvelope,
  PlanningOperationCatalogOption,
  PlanningOperationCreatePayload,
  PlanningOperationUpdatePayload,
  PlanningProductionUpdatePayload,
} from '@/@types/v2/Operacional/planning-operation';

async function createPlanningOperation(payload: PlanningOperationCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningOperationTreeItem>>(
    '/planning-operations',
    payload
  );
  return data;
}

async function updatePlanningOperation(uuid: string, payload: PlanningOperationUpdatePayload) {
  const { data } = await api.V2.put<Response<PlanningOperationTreeItem>>(
    `/planning-operations/${uuid}`,
    payload
  );
  return data;
}

async function deletePlanningOperation(uuid: string) {
  const { data } = await api.V2.delete(`/planning-operations/${uuid}`);
  return data;
}

export interface ListPlanningOperationCatalogParams extends PaginationQueryParams {
  search?: string;
}

// GET /operations/options?category=2 — PAGINADO (ApiResponse::paginated).
// `category` FIXO nesta função (não é uma cascata configurável pelo caller,
// diferente de `listServiceOrderOperationOptions` — a criação manual de
// PlanningOperation só conhece o catálogo Agricultura, ver cabeçalho).
async function listPlanningOperationCatalog(
  params: ListPlanningOperationCatalogParams
): Promise<ResponsePagination<PlanningOperationCatalogOption[]>> {
  const { data } = await api.V2.get<PlanningOperationCatalogListEnvelope>('/operations/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    category: 2,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination — mesmo
  // adaptador de `listServiceOrderOperationOptions`/`listOperations`.
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

// "Definir Produção" (SUR-17, C-28) — MESMO endpoint de update de
// `PlanningCultivation` já usado por `TASK-FE-PLAN-03`
// (`planning-cultivation-service.ts#updatePlanningCultivation`), mas com
// payload parcial DEDICADO (só `production_quantity`, `sometimes` no
// servidor) — função própria para nunca reaproveitar/confundir com o
// payload de 6 campos do form de Cultura/Variedade.
async function updatePlanningCultivationProduction(
  uuid: string,
  payload: PlanningProductionUpdatePayload
) {
  const { data } = await api.V2.put<Response<PlanningCultivationTreeItem>>(
    `/planning-cultivations/${uuid}`,
    payload
  );
  return data;
}

export {
  createPlanningOperation,
  deletePlanningOperation,
  listPlanningOperationCatalog,
  updatePlanningCultivationProduction,
  updatePlanningOperation,
};
