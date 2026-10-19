// src/services/v2/BaseRegistrations/permission-service.ts
// -----------------------------------------------------------------------------
// Permission Service — API v1 do backend Laravel GB.Cerne (Permissões,
// catálogo técnico GLOBAL do sistema, RBAC Spatie). Execução 032,
// TASK-FE-2400. Mirror mecânico de `systemUpdate-service.ts`/`bank-service.ts`
// (a busca `search` server-side é mirror de `listBanks`, contrato de tela §7.2).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /permissions          → data: PermissionListItem[] + meta paginação
//                                    (`paginate(20)` HARDCODED no backend —
//                                    contrato de tela §7.4: `per_page` enviado
//                                    é ignorado hoje, harmless/forward-compatible)
//   GET    /permissions/{uuid}   → data: PermissionDetail (alias estrutural do item da lista)
//   POST   /permissions          → payload PermissionPayload
//   PUT    /permissions/{uuid}   → payload PermissionPayload
//   DELETE /permissions/{uuid}   → cascade silencioso (sem guarda de FK — contrato §5 item 3)
//
// NÃO confundir com `src/services/v2/Roles/permission-service.ts`
// (`getPermissionTree`, consome `/permissions/tree`) nem
// `src/services/v2/Configuracoes/Permission/permission-screens-service.ts`
// (`getPermissionScreens`, consome `/permissions/screens`) — arquivos
// distintos, endpoints distintos, leituras auxiliares de OUTRAS telas
// (contrato de tela §1.1).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PermissionDetail,
  PermissionListItem,
  PermissionPayload,
  PermissionsListEnvelope,
} from '@/@types/v2/BaseRegistrations/permission';

export interface ListPermissionsParams extends PaginationQueryParams {
  search?: string;
}

async function listPermissions(
  params: ListPermissionsParams
): Promise<ResponsePagination<PermissionListItem[]>> {
  const { data } = await api.V2.get<PermissionsListEnvelope>('/permissions', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
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

async function getPermission(permissionUuid: string) {
  const { data } = await api.V2.get<Response<PermissionDetail>>(`/permissions/${permissionUuid}`);
  return data;
}

async function createPermission(payload: PermissionPayload) {
  const { data } = await api.V2.post<Response<PermissionDetail>>('/permissions', payload);
  return data;
}

async function updatePermission(permissionUuid: string, payload: PermissionPayload) {
  const { data } = await api.V2.put<Response<PermissionDetail>>(
    `/permissions/${permissionUuid}`,
    payload
  );
  return data;
}

async function deletePermission(permissionUuid: string) {
  const { data } = await api.V2.delete(`/permissions/${permissionUuid}`);
  return data;
}

export { createPermission, deletePermission, getPermission, listPermissions, updatePermission };
