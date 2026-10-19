// src/services/v2/BaseRegistrations/parameter-service.ts
// -----------------------------------------------------------------------------
// Parameter Service ("Parâmetros") — API v1 do backend Laravel GB.Cerne,
// execução 031 (TASK-FE-031-40). SEM `X-Farm-Id` — tenancy GLOBAL, confirmado
// contrato-api-parametros.md §8 (rota fora do middleware `farm.context`; os 5
// consumidores migrados nunca filtram por farm/tenant). Payload é JSON puro
// (sem upload/multipart) — mirror estrutural de `cost-center-service.ts`
// combinado com o adaptador de paginação REAL de `headband-service.ts`.
//
// Endpoints (`/api/v1/parameters`): `GET/POST /parameters`, `GET/PUT/DELETE
// /parameters/{uuid}` — UUID é a chave de rota, nunca `id`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ParameterDetail,
  ParameterFilterForm,
  ParameterListItem,
  ParameterPayload,
  ParametersListEnvelope,
} from '@/@types/v2/BaseRegistrations/Parameters';

export interface ListParametersParams extends PaginationQueryParams, ParameterFilterForm {}

async function listParameters(
  params: ListParametersParams
): Promise<ResponsePagination<ParameterListItem[]>> {
  const { data } = await api.V2.get<ParametersListEnvelope>('/parameters', {
    page: params.page,
    per_page: params.per_page,
    name: params.name || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // paginação REAL (meta vem do backend), mirror `listHeadbands`.
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

async function getParameter(uuid: string) {
  const { data } = await api.V2.get<Response<ParameterDetail>>(`/parameters/${uuid}`);
  return data;
}

async function createParameter(payload: ParameterPayload) {
  const { data } = await api.V2.post<Response<ParameterDetail>>('/parameters', payload);
  return data;
}

async function updateParameter(uuid: string, payload: Partial<ParameterPayload>) {
  const { data } = await api.V2.put<Response<ParameterDetail>>(`/parameters/${uuid}`, payload);
  return data;
}

async function deleteParameter(uuid: string) {
  const { data } = await api.V2.delete(`/parameters/${uuid}`);
  return data;
}

export { createParameter, deleteParameter, getParameter, listParameters, updateParameter };
