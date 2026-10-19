// src/@types/v2/Operacional/planning-activity.d.ts
// -----------------------------------------------------------------------------
// Tipos do nível 3 da árvore de Planejamento — Atividades da operação
// (PlanningActivity) — TASK-FE-PLAN-05 (execução `97-Esteiras/007`,
// SUR-18..20). Modelado por leitura direta de `PlanningActivityRequest.php`/
// `PlanningActivityResource.php`/`PlanningActivityController.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-04`
// `✅ CONCLUÍDO`) + `ActivityOptionsRequest.php`/`ActivityOptionResource.php`
// (lookup ENXUTO já migrado/congelado, GAP-BE-040 Opção B, mesmo endpoint já
// consumido por `ServiceOrders/service-order-service.ts#
// listServiceOrderActivityOptions`).
//
//   POST   /api/v1/planning-activities         → cria (R19)
//   PUT    /api/v1/planning-activities/{uuid}  → edita (R20)
//   DELETE /api/v1/planning-activities/{uuid}  → exclui (R21)
//   GET    /api/v1/activities/options          → catálogo `react-select`
//        (`operation_uuid` filtra pela OPERAÇÃO catálogo corrente — LK-06,
//        armadilha 3 da Tarefa). Sem `show()` dedicado (R22 NAO_APLICAVEL).
//
// **Divergência de contrato resolvida sem Gap:** o Roteiro descreve o
// catálogo legado como `operation=<id>&uses[]=1&uses[]=2`, mas o endpoint
// REAL já migrado/congelado (`TASK-BE-048`, reaproveitado por
// `ServiceOrders`) só aceita `search`+`operation_uuid`
// (`ActivityOptionsRequest::rules()` — sem suporte a `uses[]`). O `uses[]` do
// legado era um filtro client-only do componente antigo, nunca uma regra de
// backend — usar o parâmetro real (`operation_uuid`) cumpre a mesma
// armadilha 3 ("escopar pela operação corrente") sem inventar filtro
// inexistente no servidor. `operation_uuid` aqui é o uuid da `Operation`
// CATÁLOGO (`PlanningOperationTreeItem.operation.uuid` — ex.: "Plantio"),
// NUNCA o `planning_operation_uuid` (instância da árvore).
//
// **Fidelidade ao legado (diferente de `PlanningOperation`):** `activity_uuid`
// e `planning_operation_uuid` são `required` em AMBOS store/update
// (`PlanningActivityRequest::rules()` sem `isMethod()` condicional) — o
// legado (`fill($request->all())->save()`) permite trocar a atividade e/ou
// mover a atividade para outra operação na edição. `PlanningActivityDialog`
// NUNCA desabilita esses campos ao editar (diferente de `operation_uuid` em
// `PlanningOperationDialog`, armadilha 1 daquela Tarefa).
//
// `employee_id`/`description`/`use_app`/`anticipate` NÃO existem — código
// morto removido fisicamente do legado em 2023 (`GAP-PLAN-ACT-EMPLOYEE-01`,
// `[AVALIADO]`) — nenhum tipo aqui os declara.
//
// `PlanningActivityTreeItem` (leitura, `PlanningActivityResource`) já está
// tipado em `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/**
 * Estado do `react-hook-form` do diálogo (`PlanningActivityDialog.tsx`).
 * Datas herdadas da operação corrente ao CRIAR (pré-preenchidas pelo
 * cliente via `buildDefaultValues`, seção "Leitura do dev" da Tarefa) —
 * mas sempre editáveis; o servidor valida o intervalo de qualquer forma
 * (G-VALIDATION, 422 se o usuário alterar para fora do intervalo).
 */
export interface PlanningActivityForm {
  activity_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/**
 * `POST /planning-activities` (R19) — mirror EXATO de
 * `PlanningActivityRequest::rules()` (4 campos sempre `required`).
 */
export interface PlanningActivityCreatePayload {
  planning_operation_uuid: string;
  activity_uuid: string;
  start_date: string;
  end_date: string;
}

/**
 * `PUT /planning-activities/{uuid}` (R20) — MESMOS 4 campos sempre
 * `required` (fidelidade ao legado, ver cabeçalho do arquivo);
 * `planning_operation_uuid` NÃO é imutável aqui (diferente de
 * `PlanningOperationUpdatePayload`) — reenviado sempre com o valor corrente
 * da operação em que o diálogo foi aberto.
 */
export interface PlanningActivityUpdatePayload {
  planning_operation_uuid: string;
  activity_uuid: string;
  start_date: string;
  end_date: string;
}

/**
 * `GET /activities/options?operation_uuid=` (`ActivityOptionResource`) —
 * lookup ENXUTO (`uuid`+`name`), SEM permissão dedicada (GAP-BE-040 Opção
 * B), MESMO endpoint já consumido por
 * `listServiceOrderActivityOptions`/`listPlanningOperationCatalog` (mirror
 * de forma, catálogo diferente).
 */
export interface PlanningActivityCatalogOption {
  uuid: string;
  name: string;
}

export interface PlanningActivityCatalogPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PlanningActivityCatalogListEnvelope {
  success: boolean;
  message: string;
  data: PlanningActivityCatalogOption[];
  errors: Record<string, string[]> | null;
  meta: PlanningActivityCatalogPaginationMeta | null;
}
