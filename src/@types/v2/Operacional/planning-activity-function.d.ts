// src/@types/v2/Operacional/planning-activity-function.d.ts
// -----------------------------------------------------------------------------
// Tipos do nível 4c da árvore de Planejamento — MO/Serviço dentro de uma
// Atividade (PlanningActivityFunction) — TASK-FE-PLAN-06 (execução
// `97-Esteiras/007`, SUR-27..29). Modelado por leitura direta de
// `PlanningActivityFunctionRequest.php`/`PlanningActivityFunctionResource.php`/
// `PlanningActivityFunctionController.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-05`
// `✅ CONCLUÍDO`).
//
//   POST   /api/v1/planning-activity-functions        → cria (R31)
//   PUT    /api/v1/planning-activity-functions/{uuid} → edita (`PUT` real
//        por `uuid`, mecanismo NOVO — corrige `C-27`)
//   DELETE /api/v1/planning-activity-functions/{uuid} → exclui — verbo
//        `DELETE` REAL (corrige `C-32`: o legado excluía via `POST` na
//        MESMA rota de criação; a API nova declara `DELETE` de verdade,
//        `PlanningActivityFunctionController::destroy()` + rota dedicada).
//        O front nunca implementou o defeito do legado — só integra a rota
//        nova diretamente (armadilha 3 do Roteiro).
//
// Campos reais do Request: `planning_activity_uuid`, `function_uuid`
// (Função/cargo — `executor_id`/FLD-33 do contrato legado, catálogo
// GLOBAL sem escopo de farm/tenant), `employee_uuid` (nullable — FLD-34),
// `measurement` (string livre, SEMPRE 'H' fixo), `quantity`, `amount`.
// `total` NUNCA aceito do payload (G-CALC-DUP).
//
// **Divergência de contrato documentada (GAP-PLAN-FE-06, `[PARA ANÁLISE]`):**
// (1) autofill de `amount` (`vl_time_productive`, IG-14) usa `GET
// /functions/{uuid}` (`getFunction`), GATEADO por `functions_view` — o
// catálogo do Select (`GET /functions/options`, ungated) NÃO carrega
// `vl_time_productive` (`FunctionOptionResource`: só `uuid`+`name`).
// Fallback silencioso se sem permissão. (2) o legado filtrava o catálogo de
// Funcionário (`LK-13`, `GET /employees?function=`) pela Função/cargo
// selecionada — a API migrada (`GET /employees/options`) NÃO aceita filtro
// por função (`ListEmployeeOptionsParams`: só `search`); o Select de
// `employee_uuid` aqui lista TODOS os funcionários ativos do tenant, sem
// escopo por função (degradação documentada, mesmo padrão já aceito em
// `TASK-FE-PLAN-07` para catálogos sem filtro server-side equivalente —
// campo é OPCIONAL/nullable, sem impacto no DoD).
//
// `PlanningActivityFunctionTreeItem` (leitura) já está tipado em
// `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Estado do `react-hook-form` do diálogo (`PlanningActivityFunctionDialog.tsx`). */
export interface PlanningActivityFunctionForm {
  /** Função/cargo (executor, LK-12/FLD-33) — dispara autofill de
   *  `amount` (`vl_time_productive`, GAP-PLAN-FE-06) e escopo aspiracional
   *  do Select de `employee_uuid` (LK-13, degradado — ver cabeçalho). */
  function_uuid: Option<string> | null;
  /** Funcionário (FLD-34) — OPCIONAL, mirror `required: false` do Request. */
  employee_uuid: Option<string> | null;
  /** SEMPRE 'H' — fixo, readonly. */
  measurement: string;
  quantity: number | null;
  amount: number | null;
}

/**
 * `POST /planning-activity-functions` (R31) — mirror EXATO de
 * `PlanningActivityFunctionRequest::rules()`.
 */
export interface PlanningActivityFunctionCreatePayload {
  planning_activity_uuid: string;
  function_uuid: string;
  employee_uuid: string | null;
  measurement: string;
  quantity: number;
  amount: number;
}

/**
 * `PUT /planning-activity-functions/{uuid}` — MESMOS campos do create
 * (Request unificado store+update).
 */
export type PlanningActivityFunctionUpdatePayload = PlanningActivityFunctionCreatePayload;
