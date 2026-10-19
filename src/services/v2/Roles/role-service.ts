// -----------------------------------------------------------------------------
// Role Service — API v1 do backend Laravel GB.Cerne (Perfis RBAC).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /roles            → data: RoleListItem[] + meta de paginação Laravel
//   GET    /roles/{uuid}     → data: RoleDetail (com permissions atribuídas)
//   POST   /roles            → payload RolePayload
//   PUT    /roles/{uuid}     → payload RolePayload (conjunto COMPLETO de
//                              permission_uuids — o backend sincroniza)
//   DELETE /roles/{uuid}     → 204; erro de negócio (message) se houver
//                              usuários vinculados ao perfil.
//
// `listRoles` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome — assim
// nenhum hook global precisa ser alterado.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  RoleDetail,
  RoleListItem,
  RoleOptionItem,
  RoleOptionsListEnvelope,
  RolePayload,
  RolesListEnvelope,
} from '@/@types/v2/Roles';

/** Params aceitos pela listagem — paginação padrão + busca (`search`). */
export interface ListRolesParams extends PaginationQueryParams {
  search?: string;
  /**
   * TASK-BE-808/TASK-FE-900 — uuid opcional de um `User` cujos vínculos de
   * role de OUTRO tenant devem aparecer no picker mesmo fora do tenant ativo
   * (senão o operador não consegue VER — e portanto não consegue desmarcar —
   * um vínculo cross-tenant legítimo na edição). Usar SEMPRE na edição de
   * Usuário, passando o uuid do usuário sendo editado (User-contrato.md
   * §18, achado E2E da usuária Alexsandra).
   */
  include_user_uuid?: string;
}

async function listRoles(params: ListRolesParams): Promise<ResponsePagination<RoleListItem[]>> {
  const { data } = await api.V2.get<RolesListEnvelope>('/roles', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    include_user_uuid: params.include_user_uuid || undefined,
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
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// TASK-TN-FE-07/GAP-TN-FE-04 → TASK-TN-10 (homologação, 2026-08-13) —
// repontado do wrapper sobre `/roles` (+`skipFarmHeader:true`) para o
// endpoint de lookup DEDICADO `/roles/options` (`RoleController::options`/
// `ListRoleOptionsAction`), criado pelo backend FORA de qualquer
// farm-context (nem `farm.context`, nem `farm.context.optional` —
// declarado ANTES do grupo, auth-only). Resolve na ORIGEM o 403 "Header
// X-Farm-Id é obrigatório" que o wrapper anterior só contornava por fora —
// `skipFarmHeader` ficou INÓCUO neste endpoint (ele nunca olha o header) e
// foi REMOVIDO daqui; `listGlobalCostCenterOptions` continua usando o
// mecanismo normalmente (`/cost-centers/options` é híbrido, dentro de
// `farm.context.optional`).
//
// `ListRoleOptionsAction::handle()` NÃO aceita paginação/`search`/
// `include_user_uuid` — devolve SEMPRE o universo COMPLETO de perfis de
// PLATAFORMA visíveis, ordenado por `description`, numa ÚNICA resposta sem
// `meta` de paginação (`ApiResponse::success()`). Adaptado aqui como
// "página única" (mesmo truque de `listAllPlanRoles`); a busca-ao-digitar
// do select passa a ser filtrada CLIENT-SIDE pelo `filterOption` padrão do
// `react-select` sobre a lista completa já carregada — paridade com o
// select2 do legado (`_forms.blade.php`), que também carregava tudo de
// uma vez. Shape ENXUTO (`RoleOptionItem`, NÃO `RoleListItem` — o Resource
// deste endpoint não expõe `is_user_visible`/`type`/`tenant`). Usado SÓ
// pelo select de Contratantes (`CreateOrUpdateContratante.tsx`) —
// `listRoles` permanece INALTERADA para as demais telas.
async function listPlatformRoleOptions(): Promise<ResponsePagination<RoleOptionItem[]>> {
  const { data } = await api.V2.get<RoleOptionsListEnvelope>('/roles/options');

  // Adaptação envelope ApiResponse::success (SEM paginação) → ResponsePagination
  // (grid/SelectAsyncPaginate), simulando uma única "página" com tudo.
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

async function getRole(roleUuid: string) {
  const { data } = await api.V2.get<Response<RoleDetail>>(`/roles/${roleUuid}`);
  return data;
}

async function createRole(payload: RolePayload) {
  const { data } = await api.V2.post<Response<RoleDetail>>('/roles', payload);
  return data;
}

async function updateRole(roleUuid: string, payload: RolePayload) {
  const { data } = await api.V2.put<Response<RoleDetail>>(`/roles/${roleUuid}`, payload);
  return data;
}

async function deleteRole(roleUuid: string) {
  const { data } = await api.V2.delete(`/roles/${roleUuid}`);
  return data;
}

export { createRole, deleteRole, getRole, listPlatformRoleOptions, listRoles, updateRole };
