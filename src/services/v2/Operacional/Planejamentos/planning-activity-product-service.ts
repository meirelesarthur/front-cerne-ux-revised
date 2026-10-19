// src/services/v2/Operacional/Planejamentos/planning-activity-product-service.ts
// -----------------------------------------------------------------------------
// PlanningActivityProduct Service — API v1 do backend Laravel GB.Cerne
// (Insumo dentro de uma Atividade de Planejamento, nível 4a da árvore) —
// TASK-FE-PLAN-06 (execução `97-Esteiras/007`, SUR-21..23).
//
//   POST   /planning-activity-products        → cria (R27)
//   PUT    /planning-activity-products/{uuid} → edita — `PUT` REAL por
//        `uuid` (mecanismo NOVO, corrige `C-27` — fim do "apaga por
//        `created_at` e reinsere" do legado; nunca implementado no front)
//   DELETE /planning-activity-products/{uuid} → exclui (R28)
//
// Sem `index`/`show` dedicados — o dado de leitura vem SEMPRE da árvore
// (`getPlanningTree`), mirror `planning-activity-service.ts`.
//
// Lookups de catálogo/autofill (Armazém/Produto/Estoque) NÃO vivem aqui —
// reaproveitados diretamente dos services já existentes dos módulos donos
// (`listWarehouseOptions`, `listProductOptions`, `getProduct`, `listStocks`),
// consumidos por `PlanningActivityProductDialog.tsx`. Ver divergência de
// contrato documentada em `@/@types/v2/Operacional/planning-activity-product`
// e `GAP-PLAN-FE-06`.
//
// Rotas dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlanningActivityProductTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityProductCreatePayload,
  PlanningActivityProductUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-product';

async function createPlanningActivityProduct(payload: PlanningActivityProductCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningActivityProductTreeItem>>(
    '/planning-activity-products',
    payload
  );
  return data;
}

async function updatePlanningActivityProduct(
  uuid: string,
  payload: PlanningActivityProductUpdatePayload
) {
  const { data } = await api.V2.put<Response<PlanningActivityProductTreeItem>>(
    `/planning-activity-products/${uuid}`,
    payload
  );
  return data;
}

async function deletePlanningActivityProduct(uuid: string) {
  const { data } = await api.V2.delete(`/planning-activity-products/${uuid}`);
  return data;
}

export {
  createPlanningActivityProduct,
  deletePlanningActivityProduct,
  updatePlanningActivityProduct,
};
