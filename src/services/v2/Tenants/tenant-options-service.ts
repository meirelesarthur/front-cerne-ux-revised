// src/services/v2/Tenants/tenant-options-service.ts
// -----------------------------------------------------------------------------
// Service de OPTIONS de Contratantes (Tenants) — PLANO-ADMIN-USER-ANALYSIS
// §3.5/§4. Endpoint dedicado `GET /tenants/options`, FORA de qualquer
// farm-context, restrito a `Gestor_Plataf` (403 para os demais — o backend
// decide, aqui só consumimos). Mirror mecânico de `listPlatformRoleOptions`
// (`role-service.ts`/`/roles/options`): resposta `ApiResponse::success()`
// SEM paginação (universo completo de tenants ativos, filtrado por `search`
// quando presente), adaptada aqui como "página única" para o contrato que
// `SelectAsyncPaginate` (`ResponsePagination`) consome.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { TenantOptionItem, TenantOptionsListEnvelope } from '@/@types/v2/Tenants';

export interface ListTenantOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listTenantOptions(
  params: ListTenantOptionsParams
): Promise<ResponsePagination<TenantOptionItem[]>> {
  const { data } = await api.V2.get<TenantOptionsListEnvelope>('/tenants/options', {
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::success (SEM paginação) → ResponsePagination
  // (SelectAsyncPaginate), simulando uma única "página" com tudo.
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

export { listTenantOptions };
