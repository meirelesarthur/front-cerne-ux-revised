// src/services/v2/BaseRegistrations/tenant-service.ts
// Tenant Service — API v1 do backend Laravel GB.Cerne (Contratantes). SEM
// `X-Farm-Id` — Tenant não é escopado por farm (DA-T01, Tenant-contrato.md).
// Envelope ApiResponse { success, message, data, errors, meta } —
// `listTenants` ADAPTA a paginação REAL do backend para o shape
// `ResponsePagination` que `useCustomGridQuery` consome — mesmo adaptador
// estrutural de `listDiagnosisPregnancies`/`listRoles`/`listCities`
// (`meta` vem do backend; NÃO fabricar 1 única página como `listSpecies`).

import { toTenantListParams } from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  TenantData,
  TenantListItem,
  TenantPayload,
  TenantsFilterForm,
  TenantsListEnvelope,
} from '@/@types/v2/BaseRegistrations/tenant';

// Params aceitos pela listagem — paginação padrão + filtros do drawer
// (TASK-072-FE-07, I10: `TenantIndexRequest` da API v1.2). Só as chaves do
// contrato são enviadas (`toTenantListParams`); vazios são omitidos.
export interface ListTenantsParams extends PaginationQueryParams, TenantsFilterForm {}

async function listTenants(
  params: ListTenantsParams
): Promise<ResponsePagination<TenantListItem[]>> {
  const { data } = await api.V2.get<TenantsListEnvelope>('/tenants', {
    page: params.page,
    per_page: params.per_page,
    ...toTenantListParams(params),
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

async function getTenantByUuid(tenantUuid: string) {
  const { data } = await api.V2.get<Response<TenantData>>(`/tenants/${tenantUuid}`);
  return data;
}

async function createTenant(payload: TenantPayload) {
  const { data } = await api.V2.post<Response<TenantData>>('/tenants', payload);
  return data;
}

// PUT aceita payload completo ou delta — `plan_uuid`/`list_all_farms`/
// `uses_cash_book`/`zip_code`/`cancellation_reason`/`centers` são
// `sometimes` nos dois verbos (contrato §4); `Partial<TenantPayload>`
// acomoda ambos os usos sem forçar shape errado no `TASK-TN-FE-04`.
async function updateTenant(tenantUuid: string, payload: Partial<TenantPayload>) {
  const { data } = await api.V2.put<Response<TenantData>>(`/tenants/${tenantUuid}`, payload);
  return data;
}

async function deleteTenant(tenantUuid: string) {
  const { data } = await api.V2.delete(`/tenants/${tenantUuid}`);
  return data;
}

export { createTenant, deleteTenant, getTenantByUuid, listTenants, updateTenant };
