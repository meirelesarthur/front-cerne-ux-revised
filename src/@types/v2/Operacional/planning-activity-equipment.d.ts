// src/@types/v2/Operacional/planning-activity-equipment.d.ts
// -----------------------------------------------------------------------------
// Tipos do nível 4b da árvore de Planejamento — Equipamento dentro de uma
// Atividade (PlanningActivityEquipment) — TASK-FE-PLAN-06 (execução
// `97-Esteiras/007`, SUR-24..26). Modelado por leitura direta de
// `PlanningActivityEquipmentRequest.php`/`PlanningActivityEquipmentResource.php`/
// `PlanningActivityEquipmentController.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-05`
// `✅ CONCLUÍDO`).
//
//   POST   /api/v1/planning-activity-equipments        → cria (R29)
//   PUT    /api/v1/planning-activity-equipments/{uuid} → edita (`PUT` real
//        por `uuid`, mecanismo NOVO — corrige `C-27`)
//   DELETE /api/v1/planning-activity-equipments/{uuid} → exclui (R30)
//
// Campos reais do Request: `planning_activity_uuid`, `equipment_uuid`,
// `measurement` (string livre, SEMPRE 'H' fixo — FLD-32), `quantity`,
// `amount`. `total` NUNCA aceito do payload (G-CALC-DUP).
//
// **Divergência de contrato documentada (GAP-PLAN-FE-06, `[PARA ANÁLISE]`):**
// autofill de `amount` (`vl_time_productive`, IG-13) usa `GET
// /equipments/{uuid}` (`getEquipment`), GATEADO por `equipments_view` — o
// catálogo do Select (`GET /equipments/options`, ungated) NÃO carrega
// `vl_time_productive` (`EquipmentCatalogOptionResource`: só `uuid`+`code`+
// `description`). Fallback silencioso se o usuário não tiver a permissão
// (ver Gap) — `amount` fica editável manualmente.
//
// `PlanningActivityEquipmentTreeItem` (leitura) já está tipado em
// `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Estado do `react-hook-form` do diálogo (`PlanningActivityEquipmentDialog.tsx`). */
export interface PlanningActivityEquipmentForm {
  equipment_uuid: Option<string> | null;
  /** SEMPRE 'H' — fixo, readonly (FLD-32, `IG-13`). Mantido no form (não
   *  hardcoded só no payload) para exibição consistente via `InputReadOnly`. */
  measurement: string;
  quantity: number | null;
  amount: number | null;
}

/**
 * `POST /planning-activity-equipments` (R29) — mirror EXATO de
 * `PlanningActivityEquipmentRequest::rules()`.
 */
export interface PlanningActivityEquipmentCreatePayload {
  planning_activity_uuid: string;
  equipment_uuid: string;
  measurement: string;
  quantity: number;
  amount: number;
}

/**
 * `PUT /planning-activity-equipments/{uuid}` — MESMOS campos do create
 * (Request unificado store+update).
 */
export type PlanningActivityEquipmentUpdatePayload = PlanningActivityEquipmentCreatePayload;
