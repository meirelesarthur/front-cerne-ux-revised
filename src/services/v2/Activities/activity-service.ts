// src/services/v2/Activities/activity-service.ts
// -----------------------------------------------------------------------------
// Activity Service — API v1 do backend Laravel GB.Cerne (Atividades).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /activities             → data: ActivityListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total —
//                                     confirmado em Activity-contrato.md §9/§10,
//                                     precedente WarehouseRepository/IndexRequest).
//   GET    /activities/{uuid}      → data: ActivityData
//   POST   /activities             → payload ActivityPayload (create)
//   PUT    /activities/{uuid}      → payload ActivityPayload (update)
//   DELETE /activities/{uuid}      → 204; pode retornar erro de negócio (FK em
//                                     uso, ex. activity_cost_centers) — o
//                                     `onError` genérico do `useRequest` exibe
//                                     a `message` do envelope, mesmo tratamento
//                                     de TypeTitles/Warehouse.
//
// `listActivities` ADAPTA o envelope PAGINADO REAL do backend
// (`ApiResponse::paginated()`) para o shape `ResponsePagination` que a infra
// de grid do projeto (useCustomGridQuery/TableProvider) consome — MESMO
// adaptador de `listTypeTitles`, NÃO o truque `meta:null` de `listSpecies`/
// `listBreeds` (Activity pagina de verdade, default 10 por hectare/negócio).
//
// Escopo por TENANT (não Farm) — o interceptor axios global (`api.ts`) já
// anexa `X-Farm-Id` automaticamente quando há fazenda ativa; o backend resolve
// o tenant a partir do FarmContext. Nenhum header extra é montado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ActivitiesListEnvelope,
  ActivityData,
  ActivityFilterForm,
  ActivityListItem,
  ActivityPayload,
} from '@/@types/v2/Activities';

// Params aceitos pela listagem — paginação real + busca + filtros reais do
// backend (ActivityFilterData): search/type/use/is_enabled/operation_id.
export interface ListActivitiesParams extends PaginationQueryParams, ActivityFilterForm {}

async function listActivities(
  params: ListActivitiesParams
): Promise<ResponsePagination<ActivityListItem[]>> {
  const { data } = await api.V2.get<ActivitiesListEnvelope>('/activities', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    use: params.use || undefined,
    is_enabled: params.is_enabled || undefined,
    operation_id: params.operation_id || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // lê `meta.total`/`per_page`/`current_page`/`last_page` REAIS, NÃO fixados
  // em `1`/`data.length`.
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

async function getActivityByUuid(activityUuid: string) {
  const { data } = await api.V2.get<Response<ActivityData>>(`/activities/${activityUuid}`);
  return data;
}

async function createActivity(payload: ActivityPayload) {
  const { data } = await api.V2.post<Response<ActivityData>>('/activities', payload);
  return data;
}

async function updateActivity(activityUuid: string, payload: ActivityPayload) {
  const { data } = await api.V2.put<Response<ActivityData>>(`/activities/${activityUuid}`, payload);
  return data;
}

async function deleteActivity(activityUuid: string) {
  const { data } = await api.V2.delete(`/activities/${activityUuid}`);
  return data;
}

export { createActivity, deleteActivity, getActivityByUuid, listActivities, updateActivity };
