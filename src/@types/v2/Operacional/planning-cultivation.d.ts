// src/@types/v2/Operacional/planning-cultivation.d.ts
// -----------------------------------------------------------------------------
// Tipos do diálogo de Cultura/Variedade (PlanningCultivation, nível 1 da
// árvore de Planejamento) — TASK-FE-PLAN-03 (execução `97-Esteiras/007`).
// Modelado por leitura direta de `PlanningCultivationRequest.php`/
// `PlanningCultivationData.php`/`PlanningCultivationResource.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-02`
// `🔬 PARA TESTE`).
//
//   POST /api/v1/planning-cultivations          → cria + auto-seed (SE-01)
//   PUT  /api/v1/planning-cultivations/{uuid}    → edita (parcial, `sometimes`)
//   DELETE /api/v1/planning-cultivations/{uuid}
//
// `PlanningCultivationTreeItem` (leitura, `PlanningCultivationResource`) já
// está tipado em `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
//
// `forecast` NUNCA entra em nenhum payload de escrita — é SEMPRE calculado
// pelo servidor (`start_planting_date + cycle`, CV-01, armadilha 1 do
// Roteiro). `production_quantity` ("Definir Produção", AM-18) também não
// entra aqui — é escopo de `TASK-FE-PLAN-04` (mesmo endpoint de update,
// campo dedicado, linha fixa da árvore).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/**
 * Estado do `react-hook-form` do diálogo (`PlanningCultivationDialog.tsx`).
 * Datas como `Date | null` (convertidas para `yyyy-MM-dd` só no payload,
 * mirror `CreateOrUpdateParameterWeights.tsx`/`format`+`parseISO` de
 * `date-fns`) — nunca string solta no estado do form.
 */
export interface PlanningCultivationForm {
  cultivation_uuid: Option<string> | null;
  variety_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  start_planting_date: string | null;
  cycle: number | null;
}

/**
 * `POST /planning-cultivations` — mirror EXATO de
 * `PlanningCultivationRequest::rules()` para o verbo POST (todos `required`
 * + `planning_uuid`, imutável após a criação — `PlanningCultivationData`).
 */
export interface PlanningCultivationCreatePayload {
  planning_uuid: string;
  cultivation_uuid: string;
  variety_uuid: string;
  start_date: string;
  end_date: string;
  start_planting_date: string;
  cycle: number;
}

/**
 * `PUT /planning-cultivations/{uuid}` — o diálogo sempre reenvia os 6 campos
 * (full-resource, mirror `UpdateCultivationRequest`) mesmo o backend
 * aceitando `sometimes`; `production_quantity` ("Definir Produção") nunca é
 * enviado por este payload — `TASK-FE-PLAN-04` usa o MESMO endpoint com um
 * payload parcial próprio, dedicado.
 */
export interface PlanningCultivationUpdatePayload {
  cultivation_uuid?: string;
  variety_uuid?: string;
  start_date?: string;
  end_date?: string;
  start_planting_date?: string;
  cycle?: number;
}
