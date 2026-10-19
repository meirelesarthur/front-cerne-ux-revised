// src/services/v2/RecentActivities/recent-activity-service.ts
// -----------------------------------------------------------------------------
// Service de ATIVIDADES RECENTES (UT-000690 / F-349) — API v1, SOMENTE LEITURA.
// Mirror estrutural de `absence-service.ts` (adaptador do envelope
// `ApiResponse::paginated` → `ResponsePagination`, consumido pela grid via
// `useCustomGridQuery`).
//
//   GET /recent-activities        → data: RecentActivityListItem[] + meta
//                                    (ordenação `created_at desc` fixa no servidor)
//   GET /recent-activities/types  → data: [{ value, label }] (só os tipos que
//                                    o usuário pode ver)
//
// `X-Farm-Id` define o CONTRATANTE (interceptor de `api.ts`). `farm_uuids` NUNCA
// é enviado (CL-FE-13 NAO_APLICAVEL). `types` só vai quando o array não é vazio
// (axios serializa como `types[]=a&types[]=b`, formato aceito pelo Laravel).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  RecentActivitiesListEnvelope,
  RecentActivityListItem,
  RecentActivityTypeOption,
  RecentActivityTypesEnvelope,
} from '@/@types/v2/RecentActivities';

export interface ListRecentActivitiesParams extends PaginationQueryParams {
  types?: string[];
  start_date?: string;
  end_date?: string;
}

async function listRecentActivities(
  params: ListRecentActivitiesParams
): Promise<ResponsePagination<RecentActivityListItem[]>> {
  const { data } = await api.V2.get<RecentActivitiesListEnvelope>('/recent-activities', {
    page: params.page,
    per_page: params.per_page,
    types: params.types && params.types.length > 0 ? params.types : undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

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

async function listRecentActivityTypes(): Promise<RecentActivityTypeOption[]> {
  const { data } = await api.V2.get<RecentActivityTypesEnvelope>('/recent-activities/types');
  return data.data ?? [];
}

export { listRecentActivities, listRecentActivityTypes };
