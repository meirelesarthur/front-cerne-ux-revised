// src/@types/v2/Operacional/planning-operation.d.ts
// -----------------------------------------------------------------------------
// Tipos do nível 2 da árvore de Planejamento — Operações do cultivo
// (PlanningOperation) — TASK-FE-PLAN-04 (execução `97-Esteiras/007`,
// SUR-13..17). Modelado por leitura direta de `PlanningOperationRequest.php`/
// `PlanningOperationData.php`/`PlanningOperationResource.php`/
// `PlanningCultivationRequest.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-02`/`03`
// `✅ CONCLUÍDO`).
//
//   POST /api/v1/planning-operations          → cria MANUAL (catálogo use=2)
//   PUT  /api/v1/planning-operations/{uuid}    → "Definir Período" (só datas)
//   DELETE /api/v1/planning-operations/{uuid}
//   GET  /api/v1/operations/options?category=2 → catálogo `react-select` da
//        criação MANUAL (lookup enxuto SEM permissão dedicada, GAP-BE-040
//        Opção B — NÃO confundir com o catálogo do auto-seed `use IN (1,2)`,
//        que é 100% server-side, SEM UI própria, `SeedBlankOperationsAction`,
//        SUR-14). `category=2` é FIXO (Agricultura) — mirror do comentário
//        real de `PlanningOperationRequest.php` ("o filtro use=2 visto em
//        ModalOperation/index.js é exclusivamente do CATÁLOGO exibido no
//        select, nunca uma regra de validação server-side").
//   PUT  /api/v1/planning-cultivations/{uuid}  → "Definir Produção" (SUR-17,
//        C-28) — MESMO endpoint de `TASK-FE-PLAN-03`, payload parcial
//        DEDICADO (só `production_quantity`) — NUNCA o payload de 6 campos
//        de `PlanningCultivationUpdatePayload` (`planning-cultivation.d.ts`).
//
// `PlanningOperationTreeItem` (leitura, `PlanningOperationResource`) já está
// tipado em `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
//
// `planning_cultivation_uuid`/`operation_uuid` só existem no payload de
// CRIAÇÃO manual (`PlanningOperationRequest::rules()` só declara essas 2
// regras para o verbo POST) — imutáveis após a criação (armadilha 1 da
// Tarefa: "Definir Período" grava só datas, nunca deveria trocar
// `operation_uuid` de uma operação já existente, auto-semeada ou não).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/**
 * Estado do `react-hook-form` do diálogo único
 * (`PlanningOperationDialog.tsx`, SUR-15). `operation_uuid` é o MESMO campo
 * em ambos os modos — condicionalmente desabilitado (`FLD-20`) quando a
 * operação já existe ("Definir Período"), habilitado ao "Criar Operação"
 * manual. Datas como `Date | null` (convertidas para `yyyy-MM-dd` só no
 * payload, mirror `PlanningCultivationForm`).
 */
export interface PlanningOperationForm {
  operation_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/**
 * `POST /planning-operations` (R15, criação MANUAL) — mirror EXATO de
 * `PlanningOperationRequest::rules()` para o verbo POST.
 */
export interface PlanningOperationCreatePayload {
  planning_cultivation_uuid: string;
  operation_uuid: string;
  start_date: string;
  end_date: string;
}

/**
 * `PUT /planning-operations/{uuid}` (R16, "Definir Período") — só datas;
 * `operation_uuid`/`planning_cultivation_uuid` são imutáveis após a criação
 * (armadilha 1 da Tarefa) e por isso NUNCA aparecem neste payload.
 */
export interface PlanningOperationUpdatePayload {
  start_date: string;
  end_date: string;
}

/**
 * `GET /operations/options?category=2` (`OperationOptionResource`) — lookup
 * ENXUTO (`uuid`+`name`), SEM `use`/`is_enabled`/demais campos do CRUD
 * completo de Operation (`OperationResource`, gateado por
 * `operations_view` — este endpoint não exige permissão, GAP-BE-040 Opção B).
 */
export interface PlanningOperationCatalogOption {
  uuid: string;
  name: string;
}

export interface PlanningOperationCatalogPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PlanningOperationCatalogListEnvelope {
  success: boolean;
  message: string;
  data: PlanningOperationCatalogOption[];
  errors: Record<string, string[]> | null;
  meta: PlanningOperationCatalogPaginationMeta | null;
}

/**
 * Estado do `react-hook-form` de "Definir Produção" (`PlanningProduction
 * Dialog.tsx`, SUR-17, FLD-37) — único campo editável do modal.
 */
export interface PlanningProductionForm {
  production_quantity: number | null;
}

/**
 * `PUT /planning-cultivations/{uuid}` — payload parcial DEDICADO de "Definir
 * Produção" (`production_quantity` é `sometimes` no servidor,
 * `PlanningCultivationRequest::rules()` — aceita parcial). NUNCA reaproveitar
 * `PlanningCultivationUpdatePayload` (6 campos de `TASK-FE-PLAN-03`) aqui —
 * enviaria campos fora do escopo desta ação (mirror do comentário em
 * `planning-cultivation.d.ts`).
 */
export interface PlanningProductionUpdatePayload {
  production_quantity: number;
}
