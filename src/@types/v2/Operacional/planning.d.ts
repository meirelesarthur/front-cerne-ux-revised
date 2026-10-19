// src/@types/v2/Operacional/planning.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL/Agricultura — Planejamentos (Planning, raiz da
// árvore de Planejamento de Cultura/Variedade) — TASK-FE-PLAN-01 (execução
// `97-Esteiras/007`), fatia LISTAGEM apenas (index + exclusão). Modelado por
// leitura direta de `PlanningResource.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-01`
// `🔬 PARA TESTE`), `$withTree = false` (variante de listagem, SEM a árvore
// `cultivations`).
//
//   GET    /api/v1/plannings          → paginado (envelope `meta`), listagem
//                                        ENXUTA (`PlanningResource`, sem árvore)
//   DELETE /api/v1/plannings/{uuid}   → exclusão (soft delete)
//
// CONTRATO ALVO (Adendo v4 de `TASK-PLAN-01`, ainda `[PARA EXECUÇÃO]` no
// Executor de API no momento desta Tarefa — ver `GAP-PLAN-FE-01`/
// `GAP-PLAN-FE-02`, `[AVALIADO]`, e `TASK-PLAN-01` `## Adendo v4`):
//   - `employee.name` — hoje o payload real só devolve `employee.uuid`; o
//     Adendo v4 acrescenta `name` (`Employee->people->name`). Este tipo já
//     modela o alvo (`name` OPCIONAL/nullable) — o componente NUNCA deve
//     renderizar `employee.uuid` cru; ausência de `name` cai no fallback
//     `user.name` (ver `index.tsx`).
//   - Exclusão com `PlanningCultivation` vinculada — hoje sempre `204`
//     (nenhuma guarda de FK); o Adendo v4 passa a devolver `422` com
//     `message: "Não é possível excluir um planejamento com cultivos
//     vinculados."` (`errors: null`). Sem tipo dedicado aqui — a mensagem
//     chega solta em `err.response.data.message` e é exibida pelo
//     `useRequest.onError` genérico (mirror `Invoices`/`ServiceOrders`).
//
// TASK-FE-PLAN-02 (execução `97-Esteiras/007`) acrescenta, ADITIVAMENTE, os
// tipos do FORM RAIZ (create/edit, `PlanningRequest.php`/`PlanningResource`
// variante "detalhe") e da ÁRVORE COMPLETA (`PlanningResource` `$withTree =
// true`, `TASK-PLAN-07`, `GET /api/v1/plannings/{uuid}` — MESMO endpoint do
// form raiz, consumido por 2 hooks/queries INDEPENDENTES, ver
// `CreateOrUpdatePlanning.tsx`/`PlanningTree.tsx` e a "Decisão de arquitetura
// de tela" do manifesto FID-G3F). Modelado por leitura direta de
// `PlanningResource.php`/`PlanningCultivationResource.php`/
// `PlanningOperationResource.php`/`PlanningActivityResource.php`/
// `PlanningActivityProductResource.php`/`PlanningActivityEquipmentResource.php`/
// `PlanningActivityFunctionResource.php`/`PlanningOtherActivitiesResource.php`
// (branch `feature/planejamentos-localiza-acasalamento-for-api`,
// `TASK-PLAN-01`/`07` `✅ CONCLUÍDO`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// STATUS (`PlanningStatusEnum` backend, backed int — 1/2/3)
// ============================================

/** `PlanningStatusEnum` — 1=Pendente, 2=Liberado, 3=Encerrado. */
export type PlanningStatusValue = 1 | 2 | 3;

// ============================================
// REFS ANINHADOS (leitura, mirror do `PlanningResource` real)
// ============================================

export interface PlanningHarvestRef {
  uuid: string;
  description: string;
}

/**
 * `employee.name` é o alvo do Adendo v4 (`GAP-PLAN-FE-01`) — hoje o payload
 * real só devolve `uuid`. Tipado como `string | null | undefined` de
 * propósito: `null` é o valor real possível pós-Adendo v4
 * (`Employee->people?->name`), `undefined` cobre o payload PRÉ-Adendo v4
 * (campo ausente). Em QUALQUER dos dois casos o componente cai no fallback
 * `user?.name` — nunca renderiza `uuid`.
 */
export interface PlanningEmployeeRef {
  uuid: string;
  name?: string | null;
}

export interface PlanningUserRef {
  uuid: string;
  name: string;
}

// ============================================
// LISTAGEM (`GET /api/v1/plannings` — `PlanningResource`, `$withTree = false`)
// ============================================

export interface PlanningListItem {
  uuid: string;
  code: string;
  planted_area: number;
  commercial_dollar: number;
  real_sc: number;
  status: PlanningStatusValue;
  status_label: string;
  /**
   * Hex cru do backend (`PlanningStatusEnum::color()`) — NUNCA consumir
   * direto (Passo UX, "hex fixo fora dos tokens PROIBIDO"). Mapear por
   * `PLANNING_STATUS_META` (`planningStatus.ts`), mirror
   * `SERVICE_ORDER_STATUS_META`.
   */
  status_color: string;
  /** `null` quando `area` não está carregada (guard do próprio Resource). */
  available_area: number | null;
  /** Fonte única `CalculatePlanningAggregatesAction` (`TASK-PLAN-07`) — nunca
   *  calcular no cliente. Pode chegar `0` até `TASK-PLAN-07` estar concluída
   *  (decisão default do Arquiteto, FID-G3F — exibir normalmente, sem estado
   *  visual especial). */
  planning_total: number;
  planning_area: number;
  harvest?: PlanningHarvestRef | null;
  employee?: PlanningEmployeeRef | null;
  user?: PlanningUserRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface PlanningsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PlanningsListEnvelope {
  success: boolean;
  message: string;
  data: PlanningListItem[];
  errors: Record<string, string[]> | null;
  meta: PlanningsApiPaginationMeta | null;
}

// ============================================
// TASK-FE-PLAN-02 — FORM RAIZ (create/edit, 12 campos FLD-01..12) +
// ÁRVORE COMPLETA (`PlanningResource`, `$withTree = true`, `TASK-PLAN-07`).
// ============================================

/** Ref de Área — mirror `PlanningResource.area` (`$this->whenLoaded('area', ...)`). */
export interface PlanningAreaRef {
  uuid: string;
  description: string;
  total_area: number;
}

// --------------------------------------------
// ÁRVORE — níveis 2..4 (mirror 1:1 dos Resources de pivot, `TASK-PLAN-05`).
// Casca vazia desta Tarefa NÃO renderiza estes níveis (slot de
// `TASK-FE-PLAN-04`..`07`) — tipados aqui para que a árvore completa já
// tenha o shape certo (`PlanningTreeData`), sem redefinição futura.
// --------------------------------------------

export interface PlanningCatalogRef {
  uuid: string;
  name: string;
}

export interface PlanningWarehouseRef {
  uuid: string;
  description: string;
}

export interface PlanningEmployeeUuidRef {
  uuid: string;
}

export interface PlanningActivityProductTreeItem {
  uuid: string;
  measurement: string;
  quantity: number;
  amount: number;
  total: number;
  product?: PlanningWarehouseRef | null;
  warehouse?: PlanningWarehouseRef | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanningActivityEquipmentTreeItem {
  uuid: string;
  measurement: string;
  quantity: number;
  amount: number;
  total: number;
  equipment?: PlanningWarehouseRef | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanningActivityFunctionTreeItem {
  uuid: string;
  measurement: string;
  quantity: number;
  amount: number;
  total: number;
  function?: PlanningCatalogRef | null;
  employee?: PlanningEmployeeUuidRef | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanningOtherActivityTreeItem {
  uuid: string;
  quantity: number;
  amount: number;
  total: number;
  activity?: PlanningCatalogRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// --------------------------------------------
// ÁRVORE — nível 3 (Atividade, `TASK-PLAN-04`).
// --------------------------------------------

export interface PlanningActivityTreeItem {
  uuid: string;
  start_date: string | null;
  end_date: string | null;
  products?: PlanningActivityProductTreeItem[];
  equipments?: PlanningActivityEquipmentTreeItem[];
  functions?: PlanningActivityFunctionTreeItem[];
  planning_operation?: { uuid: string } | null;
  activity?: PlanningCatalogRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// --------------------------------------------
// ÁRVORE — nível 2 (Operação, `TASK-PLAN-03`).
// --------------------------------------------

export interface PlanningOperationTreeItem {
  uuid: string;
  start_date: string | null;
  end_date: string | null;
  activities?: PlanningActivityTreeItem[];
  planning_cultivation?: { uuid: string } | null;
  operation?: PlanningCatalogRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// --------------------------------------------
// ÁRVORE — nível 1 (Cultivo/Cultura/Variedade, `TASK-PLAN-02`). Slot de
// `TASK-FE-PLAN-03` — esta Tarefa só monta o `Accordion.Item` casca
// (`PlanningTree.tsx`), identificando o nível por `cultivation`/`variety`.
// --------------------------------------------

export interface PlanningCultivationTreeItem {
  uuid: string;
  start_date: string | null;
  end_date: string | null;
  start_planting_date: string | null;
  cycle: number;
  forecast: string | null;
  production_quantity: number;
  operations_count?: number;
  operations?: PlanningOperationTreeItem[];
  other_activities?: PlanningOtherActivityTreeItem[];
  planning?: { uuid: string } | null;
  cultivation?: PlanningCatalogRef | null;
  variety?: PlanningCatalogRef | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * `PlanningResource` variante "detalhe" (`$withTree = true`, `TASK-PLAN-07`)
 * — payload de `GET /api/v1/plannings/{uuid}` (`show()`, SEMPRE com árvore,
 * `PlanningController::show()`). Consumido por 2 hooks/queries
 * INDEPENDENTES (Decisão de arquitetura FID-G3F):
 *   - `CreateOrUpdatePlanning.tsx` — `useCustomFormQueryById` (form raiz,
 *     `queryKey.plannings.planning`), só lê os campos FLAT (FLD-01..12).
 *   - `PlanningTree.tsx` — `useQuery` dedicado (`planningDetailQueryKey`,
 *     `['planning-detail', uuid]`), só lê `cultivations`.
 * NUNCA compartilhar a mesma `queryKey` entre as duas (armadilha 1 do
 * Roteiro de `TASK-FE-PLAN-02`).
 */
export interface PlanningTreeData {
  uuid: string;
  code: string;
  planted_area: number;
  commercial_dollar: number;
  real_sc: number;
  status: PlanningStatusValue;
  status_label: string;
  status_color: string;
  available_area: number | null;
  /** Fonte única `CalculatePlanningAggregatesAction` (`TASK-PLAN-07`) — nunca
   *  recalcular no cliente (G-CALC-DUP). Só existe de fato em edição — em
   *  criação a árvore/form nem chegam a montar (FLD-12). */
  planning_total: number;
  planning_area: number;
  cultivations: PlanningCultivationTreeItem[];
  harvest?: PlanningHarvestRef | null;
  area?: PlanningAreaRef | null;
  employee?: PlanningEmployeeRef | null;
  user?: PlanningUserRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// FORM RAIZ — valores do `react-hook-form` (Controller-based, Selects
// controlados por `Option`). Conversão para `PlanningPayload` só no submit
// (`tryPersistPlanning`, mirror `AppropriationForm`→`AppropriationPayload`).
// ============================================

export interface PlanningForm {
  harvest_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  /** Derivado do `area_uuid` selecionado (`AreaListItem.total_area`, criação)
   *  ou de `PlanningTreeData.area.total_area` (edição, hidratado por
   *  `fillForm`) — NUNCA enviado no payload (FLD-06, readonly). */
  area_total: number | null;
  planted_area: number | null;
  status: Option<PlanningStatusValue> | null;
  commercial_dollar: number | null;
  real_sc: number | null;
}

/**
 * Payload de `POST /plannings` / `PUT /plannings/{uuid}` — mirror EXATO de
 * `PlanningRequest::rules()` (7 campos; `employee_uuid` é coluna DORMENTE,
 * sem select no form legado nem nesta Tarefa — nunca enviado por esta tela,
 * ver `PlanningRequest.php`). `code`/`user_id`/`farm_id` NUNCA aqui — sempre
 * resolvidos pelo servidor (armadilha 4 de `TASK-PLAN-01`).
 */
export interface PlanningPayload {
  harvest_uuid: string;
  area_uuid: string;
  planted_area: number;
  commercial_dollar: number;
  real_sc: number;
  status: PlanningStatusValue;
}

// ============================================
// ENVELOPE (`ApiResponse::success`) — `GET/POST/PUT /plannings[/{uuid}]`.
// ============================================

export interface PlanningDetailEnvelope {
  success: boolean;
  message: string;
  data: PlanningTreeData;
  errors: Record<string, string[]> | null;
  meta: null;
}
