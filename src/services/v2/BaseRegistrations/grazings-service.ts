// src/services/v2/BaseRegistrations/grazings-service.ts
// -----------------------------------------------------------------------------
// Grazing Service — API v1 do backend Laravel GB.Cerne (Módulo Pastejo).
// TASK-GZ-FE-01 (fundação de dados, listagem, exclusão bloqueada).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /grazings           → data: GrazingListItem[], meta REAL (paginação
//                                 Laravel, `ApiResponse::paginated`, 10/página
//                                 default, ordenado por `code desc`)
//   GET    /grazings/{uuid}    → data: GrazingData
//   POST   /grazings           → payload GrazingPayload (create) — consumido
//                                 só por TASK-GZ-FE-02/03
//   PUT    /grazings/{uuid}    → payload GrazingPayload (update) — idem
//   DELETE /grazings/{uuid}    → 204; 422 flat (`message`) se em uso
//
// `listGrazings` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para o
// shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listFodders`/`listIdentificationTypes` (lê
// `data.meta.*` de verdade, NÃO fabrica 1 única página a partir do array
// inteiro).
//
// Farm-scoped (`X-Farm-Id` injetado automaticamente por `src/services/api.ts`,
// sem ação do front). Binding por `uuid`, nunca `id` sequencial.
//
// SEM FILTRO (Doc Bruta §7 item 1) — o legado não tem busca. Params da
// listagem são só `PaginationQueryParams` (`page`/`per_page`) — NÃO existe
// `ListGrazingsParams`/`GrazingFilterForm` intermediário.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  GrazingData,
  GrazingListItem,
  GrazingOption,
  GrazingOptionsListEnvelope,
  GrazingPayload,
  GrazingsListEnvelope,
} from '@/@types/v2/BaseRegistrations/grazings';

async function listGrazings(
  params: PaginationQueryParams
): Promise<ResponsePagination<GrazingListItem[]>> {
  const { data } = await api.V2.get<GrazingsListEnvelope>('/grazings', {
    page: params.page,
    per_page: params.per_page,
    // Sem `search`/etc. — o legado não tem busca (Doc Bruta §7 item 1); o
    // front nunca envia filtro nesta listagem.
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listFodders/listIdentificationTypes), NÃO fabrica
  // mais 1 página só a partir do array inteiro.
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

async function getGrazingByUuid(grazingUuid: string) {
  const { data } = await api.V2.get<Response<GrazingData>>(`/grazings/${grazingUuid}`);
  return data;
}

// Consumida só por TASK-GZ-FE-02 (formulário) — criada aqui por ser fundação
// compartilhada (service único do módulo).
async function createGrazing(payload: GrazingPayload) {
  const { data } = await api.V2.post<Response<GrazingData>>('/grazings', payload);
  return data;
}

// Payload SEMPRE completo — `GrazingRequest::rules()` não diferencia por
// verbo (full-resource-replace), mesmo racional de `updateFodder`. Consumida
// só por TASK-GZ-FE-02.
async function updateGrazing(grazingUuid: string, payload: GrazingPayload) {
  const { data } = await api.V2.put<Response<GrazingData>>(`/grazings/${grazingUuid}`, payload);
  return data;
}

async function deleteGrazing(grazingUuid: string) {
  const { data } = await api.V2.delete(`/grazings/${grazingUuid}`);
  return data;
}

// GET /grazings/options — lookup do select "Módulo" do bloco Pecuária de
// Contas a Pagar (UT-000795). FLAT, sem `is_enabled`, sem paginação:
// adaptador de 1 página.
export interface ListGrazingOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listGrazingOptions(
  params: ListGrazingOptionsParams
): Promise<ResponsePagination<GrazingOption[]>> {
  const { data } = await api.V2.get<GrazingOptionsListEnvelope>('/grazings/options', {
    search: params.search || undefined,
  });

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

export {
  createGrazing,
  deleteGrazing,
  getGrazingByUuid,
  listGrazingOptions,
  listGrazings,
  updateGrazing,
};
