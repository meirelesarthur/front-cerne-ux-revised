// src/@types/v2/Operacional/planning-other-activities.d.ts
// -----------------------------------------------------------------------------
// Tipos do grupo fixo "Outros" do cultivo — Outras Atividades
// (PlanningOtherActivities) — TASK-FE-PLAN-07 (execução `97-Esteiras/007`,
// SUR-30..32). Modelado por leitura direta de
// `PlanningOtherActivitiesRequest.php`/`PlanningOtherActivitiesResource.php`/
// `PlanningOtherActivitiesController.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-06`
// `✅ CONCLUÍDO` — gap HIGH `G-ROUTING-OTHER-ACTIVITIES` corrigido por
// desenho e confirmado pelo cenário `T-OTHER-ACT-ROUTING`).
//
//   POST   /api/v1/planning-other-activities        → cria (R23)
//   DELETE /api/v1/planning-other-activities/{uuid} → exclui (R24, rota
//        ÚNICA, sem colisão de padrão de URI com `planning-activities/
//        {uuid}` — corrige `C-31`/`SE-04` do legado)
//
// Sem `index`/`show`/`update` — a UI legada só expõe "Excluir"
// (`AM-17`/`C-26`), preservado exatamente (armadilha 2 do Roteiro: sem
// edição exposta). O dado de leitura vem SEMPRE da árvore
// (`PlanningOtherActivityTreeItem`, já tipado em `./planning.d.ts` —
// reaproveitado aqui, NUNCA redefinido).
//
// **Catálogo "Outros" (LK-07, armadilha 4 do Roteiro):** o legado hardcoda
// `operation=11` (id numérico fixo do catálogo "Outros" de Operations); a
// API nova NÃO restringe `activity_uuid` por operação no servidor
// (`PlanningOtherActivitiesRequest::rules()` só exige `Rule::exists`
// tenant-scoped — `TASK-PLAN-06` Passo 0.1, histórico v3: "cliente escolhe
// livremente entre as atividades do tenant, filtro de grupo 'Outros' é
// responsabilidade do front"). Esta Tarefa resolve o identificador ESTÁVEL
// (nome "Outros" do catálogo de Operations, via `GET /operations/options?
// search=Outros` — MESMO endpoint/Resource já usado por
// `listPlanningOperationCatalog`, mas SEM `category` fixo,
// `findOtherActivitiesCatalogGroup` em `planning-other-activities-service.
// ts`) em vez do id numérico hardcoded, e reaproveita o MESMO endpoint de
// lookup de Activities já consumido por `TASK-FE-PLAN-05`
// (`listPlanningActivityCatalog`, `operation_uuid=<uuid resolvido>`) para
// filtrar o catálogo do `react-select`. Se o registro "Outros" não existir
// no tenant (catálogo nunca semeado), o filtro degrada para o catálogo
// completo de Activities, sem bloquear a funcionalidade — decisão default
// documentada aqui, sem Gap (o servidor já não impõe essa restrição, então
// não há regressão de segurança em não achar o registro).
//
// `total` (CV-04, `Vl.Unit(amount) × Qtd/ha(quantity) × Área total do
// planning`) é preview CLIENTE, NÃO-AUTORITATIVO — o servidor SEMPRE
// recalcula via `CalculatePivotTotalAction` (G-CALC-DUP) e ignora qualquer
// `total` que o payload enviar; o preview nunca é enviado no payload.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/**
 * Estado do `react-hook-form` do diálogo de criação
 * (`PlanningOtherActivitiesDialog.tsx`, SUR-31). Sem edição exposta —
 * este é o ÚNICO shape de formulário desta entidade (armadilha 2).
 */
export interface PlanningOtherActivitiesForm {
  activity_uuid: Option<string> | null;
  /** Qtd/ha (FLD-36) — igual em espírito a `PlanningProductionForm.
   *  production_quantity`, mas campo PRÓPRIO desta entidade. */
  quantity: number | null;
  /** Vl. Unitário (FLD-36). */
  amount: number | null;
}

/**
 * `POST /planning-other-activities` (R23) — mirror EXATO de
 * `PlanningOtherActivitiesRequest::rules()`. `total` NUNCA é enviado — o
 * servidor sempre recalcula (G-CALC-DUP), mesmo que o cliente envie algo.
 */
export interface PlanningOtherActivitiesCreatePayload {
  planning_cultivation_uuid: string;
  activity_uuid: string;
  quantity: number;
  amount: number;
}
