// src/services/v2/Pastures/pasture-service.ts
// -----------------------------------------------------------------------------
// Pasture Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Pastagem). Casa própria (entity-flat, mirror `Appropriations`/`Batches`/
// `Equipments`), TASK-PAST-FE-01 (execução 041).
//
//   GET    /pastures                          → paginado (10/pág, code desc)
//   POST   /pastures                          → 201, pastures_create
//   GET    /pastures/{uuid}                   → detalhe completo
//   PUT    /pastures/{uuid}                   → 200, pastures_edit
//   DELETE /pastures/{uuid}                   → 204, pastures_delete
//   GET    /pastures/{uuid}/appropriation      → 200, pastures_edit
//   PUT    /pastures/{uuid}/appropriation      → 200, pastures_edit
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`. Sem axios cru, sem fetch em
// componente (Lei 3/7).
//
// `listPastures` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para
// o shape `ResponsePagination` que a infra de grid (`useCustomGridQuery`)
// consome — mesmo adaptador de `listAppropriations`/`listWarehouses`.
//
// `GET /pastures/form-context` (AC-EP-08) NÃO existe no fork (confirmado,
// ver `@/@types/v2/Pastures` cabeçalho) — nenhuma função aqui a chama.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AppropriatePastureRequestPayload,
  AppropriationData,
  PastureDetail,
  PastureFilterRequest,
  PastureListItem,
  PasturesApiPaginationMeta,
  PastureWritePayload,
} from '@/@types/v2/Pastures';

export interface ListPasturesParams extends PaginationQueryParams, PastureFilterRequest {}

interface PasturesListEnvelope {
  success: boolean;
  message: string;
  data: PastureListItem[];
  errors: Record<string, string[]> | null;
  meta: PasturesApiPaginationMeta | null;
}

async function listPastures(
  params: ListPasturesParams
): Promise<ResponsePagination<PastureListItem[]>> {
  const { data } = await api.V2.get<PasturesListEnvelope>('/pastures', {
    page: params.page,
    per_page: params.per_page,
    user_uuid: params.user_uuid || undefined,
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
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getPasture(uuid: string): Promise<Response<PastureDetail>> {
  const { data } = await api.V2.get<Response<PastureDetail>>(`/pastures/${uuid}`);
  return data;
}

async function createPasture(payload: PastureWritePayload): Promise<Response<PastureDetail>> {
  const { data } = await api.V2.post<Response<PastureDetail>>('/pastures', payload);
  return data;
}

async function updatePasture(
  uuid: string,
  payload: PastureWritePayload
): Promise<Response<PastureDetail>> {
  const { data } = await api.V2.put<Response<PastureDetail>>(`/pastures/${uuid}`, payload);
  return data;
}

async function deletePasture(uuid: string) {
  const { data } = await api.V2.delete(`/pastures/${uuid}`);
  return data;
}

async function getPastureAppropriation(uuid: string): Promise<Response<AppropriationData>> {
  const { data } = await api.V2.get<Response<AppropriationData>>(`/pastures/${uuid}/appropriation`);
  return data;
}

async function appropriatePasture(
  uuid: string,
  payload: AppropriatePastureRequestPayload
): Promise<Response<PastureDetail>> {
  const { data } = await api.V2.put<Response<PastureDetail>>(
    `/pastures/${uuid}/appropriation`,
    payload
  );
  return data;
}

export {
  appropriatePasture,
  createPasture,
  deletePasture,
  getPasture,
  getPastureAppropriation,
  listPastures,
  updatePasture,
};
