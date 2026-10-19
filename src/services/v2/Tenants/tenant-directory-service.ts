// src/services/v2/Tenants/tenant-directory-service.ts
// -----------------------------------------------------------------------------
// Service de DIRETÓRIO de Contratantes (Tenants) — F-122 (Compartilhamento),
// TASK-CP-FE-02. Endpoint NOVO `GET /tenants/directory`, `auth:sanctum`,
// SEM `permission:` dedicada — qualquer usuário autenticado, DISTINTO de
// `/tenants/options` (`tenant-options-service.ts`, `Gestor_Plataf` apenas —
// 403 para usuário comum, `SURF-010` do contrato de API: reuso avaliado e
// REJEITADO). Mirror MECÂNICO do adapter "página única" de
// `listTenantOptions` (`ApiResponse::success()` sem paginação → adaptado como
// uma única "página" para o contrato `ResponsePagination` que
// `SelectAsyncPaginate` consome) — NÃO importa/reaproveita
// `tenant-options-service.ts` (endpoints e gates distintos).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  TenantDirectoryListEnvelope,
  TenantDirectoryOptionItem,
} from '@/@types/v2/Tenants/directory';

export interface ListTenantDirectoryParams extends PaginationQueryParams {
  search?: string;
}

async function listTenantDirectory(
  params: ListTenantDirectoryParams
): Promise<ResponsePagination<TenantDirectoryOptionItem[]>> {
  const { data } = await api.V2.get<TenantDirectoryListEnvelope>('/tenants/directory', {
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::success (SEM paginação) → ResponsePagination
  // (SelectAsyncPaginate), simulando uma única "página" com tudo — mesmo
  // adaptador de listTenantOptions/tenant-options-service.ts.
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

export { listTenantDirectory };
