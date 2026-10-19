// src/services/v2/Operacional/Planejamentos/planning-activity-function-service.ts
// -----------------------------------------------------------------------------
// PlanningActivityFunction Service — API v1 do backend Laravel GB.Cerne
// (MO/Serviço dentro de uma Atividade de Planejamento, nível 4c da árvore)
// — TASK-FE-PLAN-06 (execução `97-Esteiras/007`, SUR-27..29).
//
//   POST   /planning-activity-functions        → cria (R31)
//   PUT    /planning-activity-functions/{uuid} → edita — `PUT` REAL por
//        `uuid` (mecanismo NOVO, corrige `C-27`)
//   DELETE /planning-activity-functions/{uuid} → exclui — verbo `DELETE`
//        REAL (corrige `C-32`: o legado excluía via `POST` na mesma rota de
//        criação; nunca implementado no front, que só integra a rota nova
//        diretamente, armadilha 3 do Roteiro).
//
// Sem `index`/`show` dedicados — dado de leitura vem da árvore. Lookups de
// catálogo/autofill (Função/Funcionário) reaproveitados de
// `@/services/v2/Functions/function-service` (`listFunctionOptions`/
// `getFunction`) e `@/services/v2/CadastrosBase/Employee/employee-service`
// (`listEmployeeOptions`) — ver divergência de contrato/permissão em
// `GAP-PLAN-FE-06`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PlanningActivityFunctionTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityFunctionCreatePayload,
  PlanningActivityFunctionUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-function';

async function createPlanningActivityFunction(payload: PlanningActivityFunctionCreatePayload) {
  const { data } = await api.V2.post<Response<PlanningActivityFunctionTreeItem>>(
    '/planning-activity-functions',
    payload
  );
  return data;
}

async function updatePlanningActivityFunction(
  uuid: string,
  payload: PlanningActivityFunctionUpdatePayload
) {
  const { data } = await api.V2.put<Response<PlanningActivityFunctionTreeItem>>(
    `/planning-activity-functions/${uuid}`,
    payload
  );
  return data;
}

// `DELETE` REAL — corrige `C-32` (legado usava `POST` na mesma rota de
// criação). Nenhum tratamento especial necessário aqui: é o verbo HTTP
// correto desde o início, sem workaround a remover.
async function deletePlanningActivityFunction(uuid: string) {
  const { data } = await api.V2.delete(`/planning-activity-functions/${uuid}`);
  return data;
}

export {
  createPlanningActivityFunction,
  deletePlanningActivityFunction,
  updatePlanningActivityFunction,
};
