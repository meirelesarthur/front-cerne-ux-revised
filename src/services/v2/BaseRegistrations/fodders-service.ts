// src/services/v2/BaseRegistrations/fodders-service.ts
// -----------------------------------------------------------------------------
// Fodder Service — API v1 do backend Laravel GB.Cerne (Forragem). TASK-FD-FE-01
// (fundação de dados, listagem, exclusão bloqueada).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /fodders            → data: FodderListItem[], meta REAL (paginação
//                                 Laravel, `ApiResponse::paginated`, 10/página
//                                 default, ordenado por `description` asc)
//   GET    /fodders/{uuid}     → data: FodderData
//   POST   /fodders            → payload FodderPayload (create)
//   PUT    /fodders/{uuid}     → payload FodderPayload (update — SEMPRE os 2
//                                 campos, nunca delta)
//   DELETE /fodders/{uuid}     → 204; 422 estruturado (`errors.in_use.grazings`)
//                                 se em uso por `Grazing`
//
// `listFodders` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listIdentificationTypes`/`listStates` (lê
// `data.meta.*` de verdade). NÃO fabrica 1 única página a partir do array
// inteiro.
//
// Farm-scoped (`X-Farm-Id` injetado automaticamente por `src/services/api.ts`,
// sem ação do front — `Fodder-contrato.md` DA-FD-01, grupo `farm.context`
// ESTRITO).
//
// SEM FILTRO (DA-FD-11) — o backend IGNORA silenciosamente `?search=`/
// `?is_enabled=`; o front NUNCA os envia. Params da listagem são só
// `PaginationQueryParams` (`page`/`per_page`) — NÃO existe
// `ListFoddersParams`/`FodderFilterForm` intermediário (diferente de
// `identificationTypes-service.ts`, onde o backend aceita filtro de verdade).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FodderData,
  FodderListItem,
  FodderPayload,
  FoddersListEnvelope,
} from '@/@types/v2/BaseRegistrations/fodders';

async function listFodders(
  params: PaginationQueryParams
): Promise<ResponsePagination<FodderListItem[]>> {
  const { data } = await api.V2.get<FoddersListEnvelope>('/fodders', {
    page: params.page,
    per_page: params.per_page,
    // Sem `search`/`is_enabled` — DA-FD-11, o backend ignora silenciosamente
    // qualquer filtro; o front nunca envia esses params.
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listIdentificationTypes/listStates), NÃO fabrica mais
  // 1 página só a partir do array inteiro.
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

async function getFodderByUuid(fodderUuid: string) {
  const { data } = await api.V2.get<Response<FodderData>>(`/fodders/${fodderUuid}`);
  return data;
}

async function createFodder(payload: FodderPayload) {
  const { data } = await api.V2.post<Response<FodderData>>('/fodders', payload);
  return data;
}

// Payload SEMPRE completo — description/is_enabled são `required` nos dois
// verbos (`FodderRequest::rules()` não diferencia por verbo), full-resource-
// replace, mesmo racional de updateIdentificationType.
async function updateFodder(fodderUuid: string, payload: FodderPayload) {
  const { data } = await api.V2.put<Response<FodderData>>(`/fodders/${fodderUuid}`, payload);
  return data;
}

async function deleteFodder(fodderUuid: string) {
  const { data } = await api.V2.delete(`/fodders/${fodderUuid}`);
  return data;
}

export { createFodder, deleteFodder, getFodderByUuid, listFodders, updateFodder };
