// src/services/v2/Sharings/sharing-service.ts
// -----------------------------------------------------------------------------
// Service de Compartilhamento (Sharing) — Integrações, F-122, 97-Esteiras/070.
// `TASK-CP-FE-01` (listSharings/deleteSharing) + `TASK-CP-FE-02`
// (getSharing/createSharing/updateSharing) no mesmo arquivo.
//
// `listSharings` ADAPTA o envelope PAGINADO REAL (`ApiResponse::paginated()`)
// para o shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador de `listTypeTitles`/`listCategoryMatrices` (lê `data.meta.*`
// de verdade), NÃO o truque "página única"/`meta:null` usado pelos lookups
// de tenant deste mesmo módulo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  SharingDetail,
  SharingListItem,
  SharingPayload,
  SharingsListEnvelope,
} from '@/@types/v2/Sharings';

export interface ListSharingsParams extends PaginationQueryParams {}

async function listSharings(
  params: ListSharingsParams
): Promise<ResponsePagination<SharingListItem[]>> {
  const { data } = await api.V2.get<SharingsListEnvelope>('/sharings', {
    page: params.page,
    per_page: params.per_page,
  });

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

async function deleteSharing(sharingUuid: string) {
  const { data } = await api.V2.delete(`/sharings/${sharingUuid}`);
  return data;
}

async function getSharing(sharingUuid: string): Promise<Response<SharingDetail>> {
  const { data } = await api.V2.get<Response<SharingDetail>>(`/sharings/${sharingUuid}`);
  return data;
}

async function createSharing(payload: SharingPayload): Promise<Response<SharingDetail>> {
  const { data } = await api.V2.post<Response<SharingDetail>>('/sharings', payload);
  return data;
}

async function updateSharing(
  sharingUuid: string,
  patch: Partial<SharingPayload>
): Promise<Response<SharingDetail>> {
  const { data } = await api.V2.put<Response<SharingDetail>>(`/sharings/${sharingUuid}`, patch);
  return data;
}

export { createSharing, deleteSharing, getSharing, listSharings, updateSharing };
