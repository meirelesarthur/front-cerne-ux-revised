// src/services/v2/AdditionalInfo/additional-info-service.ts
// -----------------------------------------------------------------------------
// Additional Info Service — API v1 do backend Laravel GB.Cerne (Informações
// Complementares).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /additional-info            → data: AdditionalInfoListItem[] + meta
//                                         REAL de paginação (ApiResponse::
//                                         paginated() — current_page/last_page/
//                                         per_page/total).
//   DELETE /additional-info/{uuid}     → 204; 422 estruturado se em uso em
//                                         nature_operations — a `message` real
//                                         do envelope já é exibida pelo
//                                         `onError` genérico do `useRequest`.
//
// `listAdditionalInfos` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mirror ESTRUTURAL de `listLowReasons` (paginação REAL).
//
// Nota X-Farm-Id: `AdditionalInfo` é farm-scoped (`tenant_id`+`farm_id`,
// DA-AI-02) — diferente de `LowReason`/`TypeTitle` (catálogos globais). O
// header é anexado automaticamente pelo interceptor axios global e É
// RESPEITADO pelo backend aqui (não ignorado). Nenhuma ação especial neste
// service — o interceptor já cobre.
//
// Criado em TASK-AI-03 (listAdditionalInfos/deleteAdditionalInfo). Completado
// em TASK-AI-04 (getAdditionalInfo/createAdditionalInfo/updateAdditionalInfo).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AdditionalInfoData,
  AdditionalInfoFilterForm,
  AdditionalInfoListItem,
  AdditionalInfoPayload,
  AdditionalInfosListEnvelope,
} from '@/@types/v2/AdditionalInfo';

// Params aceitos pela listagem — paginação padrão + busca + filtro real do
// backend (`is_active`).
export interface ListAdditionalInfosParams extends PaginationQueryParams {
  search?: string;
  is_active?: AdditionalInfoFilterForm['is_active'];
}

async function listAdditionalInfos(
  params: ListAdditionalInfosParams
): Promise<ResponsePagination<AdditionalInfoListItem[]>> {
  const { data } = await api.V2.get<AdditionalInfosListEnvelope>('/additional-info', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_active: params.is_active || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo mecanismo de listLowReasons/listTypeTitles (paginação REAL).
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

async function deleteAdditionalInfo(additionalInfoUuid: string) {
  const { data } = await api.V2.delete(`/additional-info/${additionalInfoUuid}`);
  return data;
}

// TASK-AI-04 — detalhe (form de edição).
async function getAdditionalInfo(additionalInfoUuid: string) {
  const { data } = await api.V2.get<Response<AdditionalInfoData>>(
    `/additional-info/${additionalInfoUuid}`
  );
  return data;
}

async function createAdditionalInfo(payload: AdditionalInfoPayload) {
  const { data } = await api.V2.post<Response<AdditionalInfoData>>('/additional-info', payload);
  return data;
}

// Update envia o payload COMPLETO (description+info+is_active SEMPRE
// presentes) — NÃO delta. `AdditionalInfoRequest::rules()` exige os 3 campos
// também no PUT (sem suporte a atualização parcial), mesma convenção de
// `updateLowReason`/`updateTypeTitle`.
async function updateAdditionalInfo(additionalInfoUuid: string, payload: AdditionalInfoPayload) {
  const { data } = await api.V2.put<Response<AdditionalInfoData>>(
    `/additional-info/${additionalInfoUuid}`,
    payload
  );
  return data;
}

export {
  createAdditionalInfo,
  deleteAdditionalInfo,
  getAdditionalInfo,
  listAdditionalInfos,
  updateAdditionalInfo,
};
