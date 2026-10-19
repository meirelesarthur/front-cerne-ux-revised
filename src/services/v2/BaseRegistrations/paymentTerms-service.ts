// src/services/v2/BaseRegistrations/paymentTerms-service.ts
// -----------------------------------------------------------------------------
// Payment Term Service — API v1 do backend Laravel GB.Cerne (Condição de
// Pagamento). Mirror de services/v2/TypeTitles/type-title-service.ts.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /payment-terms          → data: PaymentTermListItem[] + meta REAL
//                                     de paginação (ApiResponse::paginated()).
//   GET    /payment-terms/{uuid}   → data: PaymentTermDetail
//   POST   /payment-terms          → payload PaymentTermPayload (create)
//   PUT    /payment-terms/{uuid}   → payload PaymentTermPayload — SEMPRE os 5
//                                     campos (description/condition/type/
//                                     is_enabled/out_day), NUNCA delta
//                                     (PaymentTermRequest::rules() não
//                                     distingue verbo — full-resource-replace).
//   DELETE /payment-terms/{uuid}   → 204; 422 estruturado (BusinessRuleException)
//                                     com a mensagem real "Condição de
//                                     Pagamento está em uso e não pode ser
//                                     excluída." — o `onError` GENÉRICO do
//                                     `useRequest` já exibe essa `message`,
//                                     sem tratamento especial de código.
//
// `listPaymentTerms` ADAPTA o envelope PAGINADO REAL do backend
// (`ApiResponse::paginated()`) para o shape `ResponsePagination` que a infra
// de grid do projeto (useCustomGridQuery/TableProvider) consome — mesmo
// adaptador de `listTypeTitles`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PaymentTermDetail,
  PaymentTermListItem,
  PaymentTermPayload,
  PaymentTermsListEnvelope,
  PaymentTermTypeSlug,
} from '@/@types/v2/BaseRegistrations/paymentTerms';

// Params aceitos pela listagem — paginação real + busca + filtros reais do
// backend (`type`/`is_enabled`).
export interface ListPaymentTermsParams extends PaginationQueryParams {
  search?: string;
  type?: PaymentTermTypeSlug;
  is_enabled?: 'true' | 'false';
}

async function listPaymentTerms(
  params: ListPaymentTermsParams
): Promise<ResponsePagination<PaymentTermListItem[]>> {
  const { data } = await api.V2.get<PaymentTermsListEnvelope>('/payment-terms', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    is_enabled: params.is_enabled || undefined,
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

async function deletePaymentTerm(paymentTermUuid: string) {
  const { data } = await api.V2.delete(`/payment-terms/${paymentTermUuid}`);
  return data;
}

async function getPaymentTermByUuid(paymentTermUuid: string) {
  const { data } = await api.V2.get<Response<PaymentTermDetail>>(
    `/payment-terms/${paymentTermUuid}`
  );
  return data;
}

async function createPaymentTerm(payload: PaymentTermPayload) {
  const { data } = await api.V2.post<Response<PaymentTermDetail>>('/payment-terms', payload);
  return data;
}

// UPDATE recebe o payload COMPLETO — PaymentTermRequest::rules() não
// distingue verbo (os 5 campos são `required` em ambos), full-resource-
// replace. NUNCA gatear estes campos por dirtyFields no PUT.
async function updatePaymentTerm(paymentTermUuid: string, payload: PaymentTermPayload) {
  const { data } = await api.V2.put<Response<PaymentTermDetail>>(
    `/payment-terms/${paymentTermUuid}`,
    payload
  );
  return data;
}

export {
  createPaymentTerm,
  deletePaymentTerm,
  getPaymentTermByUuid,
  listPaymentTerms,
  updatePaymentTerm,
};
