// src/services/v2/Operacional/Planejamentos/planning-activity-equipment-service.ts
// -----------------------------------------------------------------------------
// PlanningActivityEquipment Service — API v1 do backend Laravel GB.Cerne
// (Equipamento dentro de uma Atividade de Planejamento, nível 4b da árvore)
// — TASK-FE-PLAN-06 (execução `97-Esteiras/007`, SUR-24..26).
//
//   POST   /planning-activity-equipments        → cria (R29)
//   PUT    /planning-activity-equipments/{uuid} → edita — `PUT` REAL por
//        `uuid` (mecanismo NOVO, corrige `C-27`)
//   DELETE /planning-activity-equipments/{uuid} → exclui (R30)
//
// Sem `index`/`show` dedicados — dado de leitura vem da árvore. Lookup de
// catálogo/autofill (Equipamento) reaproveitado de
// `@/services/v2/Equipments/equipment-service` (`listEquipmentCatalogOptions`
// para o Select, `getEquipment` para o autofill de `vl_time_productive` —
// ver divergência de contrato/permissão em `GAP-PLAN-FE-06`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlanningActivityEquipmentTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityEquipmentCreatePayload,
  PlanningActivityEquipmentUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-equipment';

async function createPlanningActivityEquipment(payload: PlanningActivityEquipmentCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningActivityEquipmentTreeItem>>(
    '/planning-activity-equipments',
    payload
  );
  return data;
}

async function updatePlanningActivityEquipment(
  uuid: string,
  payload: PlanningActivityEquipmentUpdatePayload
) {
  const { data } = await api.V2.put<Response<PlanningActivityEquipmentTreeItem>>(
    `/planning-activity-equipments/${uuid}`,
    payload
  );
  return data;
}

async function deletePlanningActivityEquipment(uuid: string) {
  const { data } = await api.V2.delete(`/planning-activity-equipments/${uuid}`);
  return data;
}

export {
  createPlanningActivityEquipment,
  deletePlanningActivityEquipment,
  updatePlanningActivityEquipment,
};
