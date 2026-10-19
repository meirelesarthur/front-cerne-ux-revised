// src/services/v2/Operacional/Planejamentos/planning-other-activities-service.ts
// -----------------------------------------------------------------------------
// PlanningOtherActivities Service — API v1 do backend Laravel GB.Cerne (grupo
// fixo "Outros" do cultivo, filha de PlanningCultivation — NÃO de
// PlanningActivity) — TASK-FE-PLAN-07 (execução `97-Esteiras/007`,
// SUR-30..32).
//
//   POST   /planning-other-activities        → cria (R23)
//   DELETE /planning-other-activities/{uuid} → exclui (R24, rota ÚNICA, sem
//        colisão de padrão de URI com `planning-activities/{uuid}` —
//        corrige `G-ROUTING-OTHER-ACTIVITIES`/`C-31` por desenho, confirmado
//        pelo cenário de Tester dedicado `T-OTHER-ACT-ROUTING`, `TASK-PLAN-06`
//        `✅ CONCLUÍDO`)
//
// Sem `index`/`show`/`update` (só criar/excluir na UI legada, `AM-17`/`C-26`
// — preservado exatamente, armadilha 2 do Roteiro). O dado de leitura vem
// SEMPRE da árvore (`getPlanningTree`, `planning-service.ts`) — este service
// só cobre as 2 mutações + a resolução do catálogo "Outros" (abaixo).
//
// `findOtherActivitiesCatalogGroup` — resolve o registro "Outros" do
// catálogo de Operations por NOME estável (`GET /operations/options?search=
// Outros`, MESMO endpoint/Resource de `listPlanningOperationCatalog`, mas
// SEM `category` fixo — armadilha 4 do Roteiro, ver nota de divergência de
// contrato em `@/@types/v2/Operacional/planning-other-activities`). O
// resultado alimenta `operation_uuid` de `listPlanningActivityCatalog`
// (MESMO catálogo de Activities já usado por `TASK-FE-PLAN-05`), filtrando o
// `react-select` de Atividade só às atividades do grupo "Outros" — sem
// hardcode de id numérico (`LK-07` do legado, `operation=11`).
//
// Rotas dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlanningOtherActivityTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningOperationCatalogListEnvelope,
  PlanningOperationCatalogOption,
} from '@/@types/v2/Operacional/planning-operation';
import type { PlanningOtherActivitiesCreatePayload } from '@/@types/v2/Operacional/planning-other-activities';

async function createPlanningOtherActivities(payload: PlanningOtherActivitiesCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningOtherActivityTreeItem>>(
    '/planning-other-activities',
    payload
  );
  return data;
}

async function deletePlanningOtherActivities(uuid: string) {
  const { data } = await api.V2.delete(`/planning-other-activities/${uuid}`);
  return data;
}

// GET /operations/options?search=Outros — resolve o catálogo "Outros" por
// NOME estável (armadilha 4), NUNCA por id numérico hardcoded (`LK-07`).
// Sem paginação dedicada: o registro é único por tenant (catálogo
// administrativo de Operations), a 1ª página já basta. `null` quando o
// tenant não tem o registro "Outros" semeado — o caller degrada para o
// catálogo completo de Activities (ver nota de divergência no arquivo de
// tipos, sem Gap: o servidor já não impõe essa restrição).
async function findOtherActivitiesCatalogGroup(): Promise<PlanningOperationCatalogOption | null> {
  const { data } = await api.V2.get<PlanningOperationCatalogListEnvelope>('/operations/options', {
    search: 'Outros',
    per_page: 50,
  });

  return data.data.find((item) => item.name.trim().toLocaleLowerCase() === 'outros') ?? null;
}

export {
  createPlanningOtherActivities,
  deletePlanningOtherActivities,
  findOtherActivitiesCatalogGroup,
};
