// src/services/v2/Operacional/Planejamentos/planning-cultivation-service.ts
// -----------------------------------------------------------------------------
// PlanningCultivation Service — API v1 do backend Laravel GB.Cerne
// (Cultura/Variedade dentro de um Planning, nível 1 da árvore) —
// TASK-FE-PLAN-03 (execução `97-Esteiras/007`).
//
//   POST   /planning-cultivations       → cria + auto-seed de operações (SE-01)
//   PUT    /planning-cultivations/{uuid} → edita (datas/ciclo)
//   DELETE /planning-cultivations/{uuid} → exclusão física (cascade real em
//                                          `planning_operations`, confirmado
//                                          por introspecção em `TASK-PLAN-02`)
//
// Sem `index`/`show` dedicados — nunca migrados (R14 nunca teve handler no
// legado, matriz FID-G3A NAO_APLICAVEL). O dado de leitura vem SEMPRE da
// árvore (`getPlanningTree`, `planning-service.ts`) — este service só cobre
// as 3 mutações.
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlanningCultivationTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningCultivationCreatePayload,
  PlanningCultivationUpdatePayload,
} from '@/@types/v2/Operacional/planning-cultivation';

async function createPlanningCultivation(payload: PlanningCultivationCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningCultivationTreeItem>>(
    '/planning-cultivations',
    payload
  );
  return data;
}

async function updatePlanningCultivation(uuid: string, payload: PlanningCultivationUpdatePayload) {
  const { data } = await api.V2.put<Response<PlanningCultivationTreeItem>>(
    `/planning-cultivations/${uuid}`,
    payload
  );
  return data;
}

async function deletePlanningCultivation(uuid: string) {
  const { data } = await api.V2.delete(`/planning-cultivations/${uuid}`);
  return data;
}

export { createPlanningCultivation, deletePlanningCultivation, updatePlanningCultivation };
