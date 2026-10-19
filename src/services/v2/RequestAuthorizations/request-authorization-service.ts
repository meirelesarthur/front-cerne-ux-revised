// src/services/v2/RequestAuthorizations/request-authorization-service.ts
// -----------------------------------------------------------------------------
// RequestAuthorization Service — API v1 do backend Laravel GB.Cerne
// (Suprimentos/Compras — "Autorização", esteira 97-Esteiras/038,
// TASK-AUTH-FE-01). Contrato: `97-Esteiras/038/ROTEIROS/02-roteiro-api-autorizacao.md`
// (`CONTRATO_AUTOAPROVADO`, camada `api` ✅ CONCLUÍDO) + `03-roteiro-frontend-autorizacao.md`.
//
// 11 funções, mirror do padrão real de `request-purchase-service.ts` (envelope
// `Response<T>`/`ResponsePagination<T[]>`, adaptação `data.data`/`meta` para a
// listagem). `per_page` default **10** (mirror
// `RequestAuthorizationFilterData::per_page = 10`, distinto do default 15 do
// resto do módulo `RequestPurchase`, CLM-02).
//
//   GET  /request-authorizations                          → listRequestAuthorizations
//   GET  /request-authorizations/{uuid}                    → getRequestAuthorization
//   POST /request-authorizations/{uuid}/approve            → approveRequestAuthorization
//   POST /request-authorizations/{uuid}/reject-partial     → rejectPartialRequestAuthorization
//   POST /request-authorizations/{uuid}/reject-final       → rejectFinalRequestAuthorization
//   POST /request-authorizations/{uuid}/acknowledge        → acknowledgeRequestAuthorization
//   POST /request-authorizations/{uuid}/return             → returnRequestAuthorization
//   POST /request-authorizations/{uuid}/reject             → rejectSecondLevelRequestAuthorization
//   POST /request-authorizations/{uuid}/reassign           → reassignRequestAuthorization
//   PUT  /request-authorizations/{uuid}/items/{itemUuid}   → updateRequestAuthorizationItem
//   POST /request-authorizations/{uuid}/comments           → commentOnRequestAuthorization
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  RequestAuthorizationAcknowledgePayload,
  RequestAuthorizationApprovePayload,
  RequestAuthorizationCommentPayload,
  RequestAuthorizationData,
  RequestAuthorizationFilterRequest,
  RequestAuthorizationItemUpdatePayload,
  RequestAuthorizationItemUpdateResult,
  RequestAuthorizationListItem,
  RequestAuthorizationReassignPayload,
  RequestAuthorizationRejectFinalPayload,
  RequestAuthorizationRejectPartialPayload,
  RequestAuthorizationRejectSecondLevelPayload,
  RequestAuthorizationReturnPayload,
} from '@/@types/v2/RequestAuthorizations';

export interface ListRequestAuthorizationsParams
  extends PaginationQueryParams, RequestAuthorizationFilterRequest {}

interface RequestAuthorizationsListEnvelope {
  success: boolean;
  message: string;
  data: RequestAuthorizationListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// `GET /request-authorizations` — listagem de pendências, filtro por
// search/status/type/start_date/end_date, subconjunto de status {3,4,11}
// (BR-01, ver `request-authorization-status-options.ts`). Adaptação envelope
// ApiResponse::paginated → ResponsePagination (grid), mesmo adaptador de
// `listRequestPurchases`/`listRejectedRequestPurchases` (meta REAL, nunca
// fallback fake). `per_page` default 10 quando o chamador não informar.
async function listRequestAuthorizations(
  params: ListRequestAuthorizationsParams
): Promise<ResponsePagination<RequestAuthorizationListItem[]>> {
  const { data } = await api.V2.get<RequestAuthorizationsListEnvelope>('/request-authorizations', {
    page: params.page,
    per_page: params.per_page ?? 10,
    search: params.search || undefined,
    status: params.status ?? undefined,
    type: params.type || undefined,
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
        per_page: data.meta?.per_page ?? params.per_page ?? 10,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `GET /request-authorizations/{uuid}` — payload de detalhe único
// (`authorization_context` SEMPRE presente, ver nota de tipos). Fonte única
// de verdade server-side para decidir qual ramo (1º/2º nível) renderizar.
async function getRequestAuthorization(uuid: string) {
  const { data } = await api.V2.get<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}`
  );
  return data;
}

// `POST /request-authorizations/{uuid}/approve` — BR-02/04. `final_justification`
// obrigatória (máx. 600), T-081-API-02.
async function approveRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationApprovePayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/approve`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/reject-partial` — BR-03.
async function rejectPartialRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationRejectPartialPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/reject-partial`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/reject-final` — `final_justification`
// sempre obrigatória, notificação AMPLA (CLM-16).
async function rejectFinalRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationRejectFinalPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/reject-final`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/acknowledge` — BR-05/06/08/09/10
// (2º nível/ciência/escalonamento). `{ auto_promote: true }` = promoção
// automática 4 para 3 ao abrir a Ciência (T-081-API-01; sem escrita em GET).
async function acknowledgeRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationAcknowledgePayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/acknowledge`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/return` — volta ao `lastStatus`.
async function returnRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationReturnPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/return`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/reject` — BR-07 (reprovação de 2º
// nível), `justify` sempre obrigatória (corrige CLM-60).
async function rejectSecondLevelRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationRejectSecondLevelPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/reject`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/reassign` — BR-11, titularidade
// ESTRITA, distinto de `POST /request-purchases/{uuid}/transfer`.
async function reassignRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationReassignPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/reassign`,
    payload
  );
  return data;
}

// `PUT /request-authorizations/{uuid}/items/{itemUuid}` — único campo
// editável (`quantity`). T-081-API-02: a resposta traz o item e as cotações da
// solicitação já recalculadas (`quotations[]`).
async function updateRequestAuthorizationItem(
  uuid: string,
  itemUuid: string,
  payload: RequestAuthorizationItemUpdatePayload
) {
  const { data } = await api.V2.put<Response<RequestAuthorizationItemUpdateResult>>(
    `/request-authorizations/${uuid}/items/${itemUuid}`,
    payload
  );
  return data;
}

// `POST /request-authorizations/{uuid}/comments` — campo `comment`, NÃO
// `justify` (justify é o nome da coluna física, comment é o payload público).
async function commentOnRequestAuthorization(
  uuid: string,
  payload: RequestAuthorizationCommentPayload
) {
  const { data } = await api.V2.post<Response<RequestAuthorizationData>>(
    `/request-authorizations/${uuid}/comments`,
    payload
  );
  return data;
}

export {
  acknowledgeRequestAuthorization,
  approveRequestAuthorization,
  commentOnRequestAuthorization,
  getRequestAuthorization,
  listRequestAuthorizations,
  reassignRequestAuthorization,
  rejectFinalRequestAuthorization,
  rejectPartialRequestAuthorization,
  rejectSecondLevelRequestAuthorization,
  returnRequestAuthorization,
  updateRequestAuthorizationItem,
};
