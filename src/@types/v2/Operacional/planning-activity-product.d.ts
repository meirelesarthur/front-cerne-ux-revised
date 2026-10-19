// src/@types/v2/Operacional/planning-activity-product.d.ts
// -----------------------------------------------------------------------------
// Tipos do nível 4a da árvore de Planejamento — Insumo (Produto) dentro de
// uma Atividade (PlanningActivityProduct) — TASK-FE-PLAN-06 (execução
// `97-Esteiras/007`, SUR-21..23). Modelado por leitura direta de
// `PlanningActivityProductRequest.php`/`PlanningActivityProductResource.php`/
// `PlanningActivityProductController.php` (branch
// `feature/planejamentos-localiza-acasalamento-for-api`, `TASK-PLAN-05`
// `✅ CONCLUÍDO`).
//
//   POST   /api/v1/planning-activity-products        → cria (R27)
//   PUT    /api/v1/planning-activity-products/{uuid} → edita (mecanismo NOVO
//        por `uuid` real — corrige `C-27`, fim do "apaga por `created_at` e
//        reinsere" do legado; o front NUNCA implementou esse mecanismo)
//   DELETE /api/v1/planning-activity-products/{uuid} → exclui (R28)
//
// Campos reais do Request (`PlanningActivityProductRequest::rules()`):
// `planning_activity_uuid`, `product_uuid`, `warehouse_uuid` (nullable),
// `measurement` (string livre — NÃO é FK/uuid, mirror `PlanningActivity
// FunctionRequest.measurement`), `quantity`, `amount`. `total` NUNCA é
// aceito do payload — sempre recalculado no servidor
// (`CalculatePivotTotalAction`, G-CALC-DUP) mesmo se enviado.
//
// **Divergência de contrato documentada (GAP-PLAN-FE-06, `[PARA ANÁLISE]`):**
// o Roteiro descreve a cascata legada Armazém→Produto→Unidade→Estoque com 3
// lookups dedicados (`LK-08` produtos filtrados por armazém,
// `LK-09` armazéns, `LK-10` conversão de estoque por unidade). Nenhum desses
// 3 endpoints existe tal qual no legado na API migrada — os catálogos
// migrados são: `GET /warehouses/options` (LK-09, ungated, `{uuid, initials,
// description}`) e `GET /products/options` (catálogo de Produto, ungated,
// mas SEM filtro por armazém — `product_uuid` não é escopado pelo armazém
// selecionado, diferente do legado). O autofill de `measurement`+`amount`
// (`average_cost`) usa `GET /products/{uuid}` (`getProduct`, GATEADO por
// `products_view` — ver GAP-PLAN-FE-06) e o preview de estoque disponível
// usa `GET /stocks` (`listStocks`, GATEADO por `stocks_view`) filtrado por
// `product_uuid`+`warehouse_uuid` — ambos com fallback silencioso se o
// usuário não tiver a permissão do módulo dono do lookup (GAP-PLAN-FE-06).
// `measurement` é renderizado como texto RESOLVIDO (não um Select de
// unidades com conversão M/D em tempo real, que não tem endpoint dedicado
// na API migrada) — decisão registrada no mesmo Gap.
//
// `PlanningActivityProductTreeItem` (leitura, `PlanningActivityProductResource`)
// já está tipado em `./planning.d.ts` — reaproveitado aqui, NUNCA redefinido.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Estado do `react-hook-form` do diálogo (`PlanningActivityProductDialog.tsx`). */
export interface PlanningActivityProductForm {
  warehouse_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  /** Texto RESOLVIDO (autofill de `getProduct(product_uuid).measurement.
   *  description`, GAP-PLAN-FE-06) — NUNCA um Select; campo do Request é
   *  string livre, não FK. */
  measurement: string;
  quantity: number | null;
  amount: number | null;
}

/**
 * `POST /planning-activity-products` (R27) — mirror EXATO de
 * `PlanningActivityProductRequest::rules()`.
 */
export interface PlanningActivityProductCreatePayload {
  planning_activity_uuid: string;
  product_uuid: string;
  warehouse_uuid: string | null;
  measurement: string;
  quantity: number;
  amount: number;
}

/**
 * `PUT /planning-activity-products/{uuid}` — MESMOS campos do create
 * (`PlanningActivityProductRequest` é unificado store+update, sem
 * `isMethod()` condicional nas regras de campo).
 */
export type PlanningActivityProductUpdatePayload = PlanningActivityProductCreatePayload;
