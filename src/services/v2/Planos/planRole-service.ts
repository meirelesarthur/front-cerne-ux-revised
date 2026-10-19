// src/services/v2/Planos/planRole-service.ts
// -----------------------------------------------------------------------------
// PlanRole Service — API v1 do backend Laravel GB.Cerne (Planos). TASK-FE-2700
// — "casa definitiva" do domínio Planos, absorve e substitui a fatia mínima
// de leitura que vivia em `Configuracoes/Config/planRole-service.ts`
// (TASK-FE-2600, só `listPlanRoles`) com o CRUD completo.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /plan-roles              → paginado (15/página, backend fixo),
//                                      filtro `search` (nome, ILIKE) e
//                                      `is_free` (bool)
//   GET    /plan-roles/{uuid}       → data: PlanRoleDetail (role/roles/
//                                      segments eager-loaded)
//   POST   /plan-roles              → payload PlanRolePayload, 201, permission `plan_create`
//   PUT    /plan-roles/{uuid}       → payload PlanRolePayload, 200, permission `plan_edit`
//   DELETE /plan-roles/{uuid}       → 204, permission `plan_delete`
//
// `listPlanRoles` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` que a infra de grid do projeto
// (useCustomGridQuery/TableProvider) consome — mesmo adaptador de
// `listRoles`/`listCostCenters`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PlanRoleDetail,
  PlanRoleListItem,
  PlanRoleOptionItem,
  PlanRoleOptionsListEnvelope,
  PlanRolePayload,
  PlanRolesListEnvelope,
} from '@/@types/v2/Planos';

export interface ListPlanRolesParams extends PaginationQueryParams {
  search?: string;
  is_free?: boolean;
}

async function listPlanRoles(
  params: ListPlanRolesParams
): Promise<ResponsePagination<PlanRoleListItem[]>> {
  const { data } = await api.V2.get<PlanRolesListEnvelope>('/plan-roles', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_free: params.is_free ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

/**
 * TASK-TN-FE-04 → TASK-TN-10 (homologação, 2026-08-13) — repontado da
 * varredura de páginas sobre `/plan-roles` (paginado, 15/página fixo,
 * histórico abaixo) para o endpoint de lookup DEDICADO `/plan-roles/options`
 * (`PlanRoleController::options`/`ListPlanRoleOptionsAction`), que devolve
 * `PlanRole::query()->orderBy('nome')->get()` — o universo COMPLETO de
 * planos, SEM paginação/filtro, fora de qualquer farm-context — numa ÚNICA
 * resposta sem `meta` (`ApiResponse::success()`). A varredura multi-página
 * que existia aqui deixou de ser necessária: o backend já entrega tudo de
 * uma vez, mirror fiel do select2 do legado.
 *
 * Não aceita `search`: a busca-ao-digitar do select passa a ser filtrada
 * CLIENT-SIDE pelo `filterOption` padrão do `react-select` sobre a lista
 * completa já carregada — mesma paridade visual do legado (que também
 * carregava tudo de uma vez e filtrava no navegador).
 *
 * Shape ENXUTO (`PlanRoleOptionItem`, campo `nome` em PT) — NÃO é
 * `PlanRoleListItem` (Resource do CRUD completo `/plan-roles`, campo `name`
 * em EN); `listPlanRoles` permanece INALTERADA para a grid de Planos.
 *
 * Sem parâmetros — assinatura enxuta compatível com o `service` do
 * `SelectAsyncPaginate` (aceita chamada com ou sem args; o backend não
 * recebe nenhum filtro aqui).
 *
 * @return {Promise<ResponsePagination<PlanRoleOptionItem[]>>} Envelope com
 *   TODOS os planos, numa única "página" simulada.
 */
async function listAllPlanRoles(): Promise<ResponsePagination<PlanRoleOptionItem[]>> {
  const { data } = await api.V2.get<PlanRoleOptionsListEnvelope>('/plan-roles/options');

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function getPlanRole(planRoleUuid: string) {
  const { data } = await api.V2.get<Response<PlanRoleDetail>>(`/plan-roles/${planRoleUuid}`);
  return data;
}

async function createPlanRole(payload: PlanRolePayload) {
  const { data } = await api.V2.post<Response<PlanRoleDetail>>('/plan-roles', payload);
  return data;
}

async function updatePlanRole(planRoleUuid: string, payload: PlanRolePayload) {
  const { data } = await api.V2.put<Response<PlanRoleDetail>>(
    `/plan-roles/${planRoleUuid}`,
    payload
  );
  return data;
}

async function deletePlanRole(planRoleUuid: string) {
  const { data } = await api.V2.delete(`/plan-roles/${planRoleUuid}`);
  return data;
}

export {
  createPlanRole,
  deletePlanRole,
  getPlanRole,
  listAllPlanRoles,
  listPlanRoles,
  updatePlanRole,
};
