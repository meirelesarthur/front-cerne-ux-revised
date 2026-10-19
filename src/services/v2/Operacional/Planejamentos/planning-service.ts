// src/services/v2/Operacional/Planejamentos/planning-service.ts
// -----------------------------------------------------------------------------
// Planning Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL /
// Agricultura — Planejamentos). TASK-FE-PLAN-01 (fatia LISTAGEM) +
// TASK-FE-PLAN-02 (fatia FORM RAIZ + ÁRVORE, aditiva).
//
//   GET    /plannings          → paginado; listagem enxuta (sem árvore)
//   GET    /plannings/{uuid}   → detalhe (SEMPRE com árvore, `show()` usa
//                                 `handleWithTree()`, `TASK-PLAN-07`) — MESMO
//                                 endpoint consumido por `getPlanningById`
//                                 (form raiz) E `getPlanningTree` (árvore),
//                                 2 funções distintas de propósito para que
//                                 os 2 hooks/queries fiquem INDEPENDENTES
//                                 (Decisão de arquitetura FID-G3F,
//                                 `TASK-FE-PLAN-02`) — nunca reaproveitar a
//                                 mesma Promise/cache entre os dois.
//   POST   /plannings          → criação (form raiz)
//   PUT    /plannings/{uuid}   → edição (form raiz)
//   DELETE /plannings/{uuid}   → exclusão (soft delete)
//
// `duplicate`/`report` (SUR-07/SUR-08, `TASK-FE-PLAN-08`):
//   POST /plannings/{uuid}/duplicate → clona o Planning (header + árvore,
//                                       `DuplicatePlanningAction`), devolve
//                                       `PlanningResource` variante listagem
//                                       ($withTree=false, `PlanningController::
//                                       duplicate()`) — só precisamos do
//                                       `uuid` do clone para navegar.
//   GET  /plannings/{uuid}/report    → PDF síncrono, binário puro (SEM
//                                       envelope `ApiResponse`), mirror
//                                       `getFoodReport`/`food-service.ts`.
//

// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// `getPlannings` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (`useCustomGridQuery`/
// `TableProvider`) consome — mesmo adaptador de `getAllServiceOrders`/
// `listInvoices`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PlanningListItem,
  PlanningPayload,
  PlanningsListEnvelope,
  PlanningTreeData,
} from '@/@types/v2/Operacional/planning';

export interface ListPlanningsParams extends PaginationQueryParams {}

async function getPlannings(
  params: ListPlanningsParams
): Promise<ResponsePagination<PlanningListItem[]>> {
  const { data } = await api.V2.get<PlanningsListEnvelope>('/plannings', {
    page: params.page,
    per_page: params.per_page,
  });

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

async function deletePlanning(uuid: string) {
  const { data } = await api.V2.delete(`/plannings/${uuid}`);
  return data;
}

// GAP-PLAN-FE-03 (item 1) — preview do próximo código, SÓ em modo criar
// (mirror EXATO `getServiceOrderNextCode`/`service-order-service.ts`).
// Resposta simples `{ code: string }`. A geração final continua SEMPRE
// server-side (`CreatePlanningAction`/`nextSequentialCode`) — este endpoint
// é só leitura/preview, `code` nunca é enviado no payload de
// `POST /plannings` (`PlanningPayload` não tem o campo).
async function getPlanningNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/plannings/next-code');
  return data;
}

// ============================================
// TASK-FE-PLAN-02 — form raiz (create/edit) + árvore
// ============================================

// Consumida SÓ por `CreateOrUpdatePlanning.tsx` (`useCustomFormQueryById`,
// `queryKey.plannings.planning`) — hidrata o form raiz (FLD-01..12). O
// payload real também traz `cultivations` (árvore), mas o form raiz nunca
// lê esse campo (mirror `getServiceOrder`/`getBreedingSeason`, leitura
// plana do detalhe).
async function getPlanningById(uuid: string) {
  const { data } = await api.V2.get<Response<PlanningTreeData>>(`/plannings/${uuid}`);
  return data;
}

async function createPlanning(payload: PlanningPayload) {
  const { data } = await api.V2.post<Response<PlanningTreeData>>('/plannings', payload);
  return data;
}

async function updatePlanning(uuid: string, payload: PlanningPayload) {
  const { data } = await api.V2.put<Response<PlanningTreeData>>(`/plannings/${uuid}`, payload);
  return data;
}

// Consumida SÓ por `PlanningTree.tsx` (`useQuery` dedicado,
// `planningDetailQueryKey`, `['planning-detail', uuid]`) — já retorna o
// detalhe DESEMPACOTADO (`data.data`), diferente de `getPlanningById`
// (que devolve o envelope `Response<T>` cru para o hook de form consumir),
// porque este é consumido por um `useQuery` cru (`queryFn`), não por
// `useCustomFormQueryById` (que desempacota internamente). Nenhuma das duas
// funções compartilha cache/Promise — cada uma dispara sua PRÓPRIA request
// (armadilha 1 do Roteiro: query keys/ciclos de vida independentes).
async function getPlanningTree(uuid: string): Promise<PlanningTreeData> {
  const { data } = await api.V2.get<Response<PlanningTreeData>>(`/plannings/${uuid}`);
  return data.data;
}

// ============================================
// TASK-FE-PLAN-08 — Duplicar (POST .../duplicate) e Imprimir PDF (GET .../report)
// ============================================

// POST /plannings/{uuid}/duplicate — clona o Planning (header + árvore
// completa, `DuplicatePlanningAction`, C-03/C-08 já corrigidos no servidor:
// verbo POST + permissão `plannings_create`). Devolve `PlanningResource`
// variante listagem ($withTree=false, mesmo shape de `PlanningListItem`) —
// suficiente para a navegação (só o `uuid` do clone é consumido pelo
// `actionSuccess`, ver `index.tsx`).
async function duplicatePlanning(uuid: string) {
  const { data } = await api.V2.post<Response<PlanningListItem>>(`/plannings/${uuid}/duplicate`);
  return data;
}

// GET /plannings/{uuid}/report — PDF síncrono, binário puro (SEM envelope
// `ApiResponse`), mirror `getFoodReport`/`food-service.ts`. `responseType:
// 'blob'` — NUNCA tentar desempacotar como JSON.
async function downloadPlanningReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/plannings/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  createPlanning,
  deletePlanning,
  downloadPlanningReport,
  duplicatePlanning,
  getPlanningById,
  getPlanningNextCode,
  getPlannings,
  getPlanningTree,
  updatePlanning,
};
