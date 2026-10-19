// src/services/v2/Configuracoes/Apps/app-service.ts
// -----------------------------------------------------------------------------
// App Service — API v1 do backend Laravel GB.Cerne (Aplicativos, TASK-APP-FE-01).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /apps                → data: AppData[] + meta de paginação
//                                  (ApiResponse::paginated), filtro OPCIONAL
//                                  `platform`/`version` (WHERE exato,
//                                  App-contrato.md Seção 1)
//   GET    /apps/{uuid}          → data: AppData
//   POST   /apps                 → payload CreateAppRequest
//   PATCH  /apps/{uuid}           → payload UpdateAppRequest (campos
//                                  opcionais — `sometimes` no backend,
//                                  App-contrato.md Seção 6)
//   DELETE /apps/{uuid}           → 204 (sem guarda de FK — nada referencia
//                                  `apps.id`, App-contrato.md Seção 1)
//
// Catálogo GLOBAL (App-contrato.md Seção 4) — SEM `farm_id`/`tenant_id`. NÃO
// construir filtro/estado por fazenda; o header `X-Farm-Id` continua sendo
// propagado pelo interceptor axios global, mas o backend o ignora aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AppData,
  AppsListEnvelope,
  CreateAppRequest,
  UpdateAppRequest,
} from '@/@types/v2/Configuracoes/apps';

// Params aceitos pela listagem — paginação + filtro opcional por
// plataforma/versão (App-contrato.md Seção 1).
export interface ListAppsParams extends PaginationQueryParams {
  platform?: string;
  version?: string;
}

async function getAllApps(params: ListAppsParams): Promise<ResponsePagination<AppData[]>> {
  const { data } = await api.V2.get<AppsListEnvelope>('/apps', {
    page: params.page,
    per_page: params.per_page,
    platform: params.platform || undefined,
    version: params.version || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listCostCenters/getAllHelps (meta REAL).
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

async function getAppByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<AppData>>(`/apps/${uuid}`);
  return data;
}

async function createApp(payload: CreateAppRequest) {
  const { data } = await api.V2.post<Response<AppData>>('/apps', payload);
  return data;
}

async function updateApp(uuid: string, payload: UpdateAppRequest) {
  const { data } = await api.V2.patch<Response<AppData>>(`/apps/${uuid}`, payload);
  return data;
}

async function deleteApp(uuid: string) {
  const { data } = await api.V2.delete(`/apps/${uuid}`);
  return data;
}

export { createApp, deleteApp, getAllApps, getAppByUuid, updateApp };
