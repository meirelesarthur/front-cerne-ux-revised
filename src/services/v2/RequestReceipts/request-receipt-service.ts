// src/services/v2/RequestReceipts/request-receipt-service.ts
// -----------------------------------------------------------------------------
// RequestReceipt Service — API v1 do backend Laravel GB.Cerne (Administrativo
// / Suprimentos — "Recebimentos"). Contrato:
// `CORE_WORKSPACE/97-Esteiras/040/CONTRATOS/arquitetura-api-recebimentos.md`
// §4 (endpoints net-new) + `arquitetura-frontend-recebimentos.md` §3.1
// (overlay SPA — envelope/uuid/X-Farm-Id).
//
//   GET  /request-receipts                       → data: RequestReceiptListItem[],
//                                                    meta paginação REAL
//   GET  /request-receipts/{uuid}                → data: RequestReceiptData
//   PUT  /request-receipts/{uuid}                 → confirma o recebimento (só
//                                                    acrescenta anexos; EXEC-API-05)
//   GET  /request-receipts/{uuid}/financial       → data: RequestReceiptFinancialContext
//                                                    (`vl_total_suggested`,
//                                                    `freeze_active_current_month`)
//   POST /request-receipts/{uuid}/financial       → gera o financeiro (payload do
//                                                    contrato: `number`, `type_uuid`,
//                                                    `provider_uuid`, `categories`...)
//   GET  /request-receipts/{uuid}/inform-payment  → data: RequestReceiptInformPaymentContext
//   PUT  /request-receipts/{uuid}/inform-payment  → finaliza o pedido
//
// Este service usa `api.V2` (envelope `ApiResponse`, Sanctum cookie,
// `X-Farm-Id` anexado pelo interceptor de `@/services/api.ts`) — NÃO
// manipula o header de fazenda manualmente (get_spa_api_client_pattern).
//
// `listRequestReceipts` ADAPTA o envelope `{ data: [], meta: {} }` para o
// shape `ResponsePagination` que `useCustomGridQuery`/`TableProvider`
// consomem — mesmo adaptador de `listRequestPurchases`/`listInPurchase`
// (meta REAL, nunca fallback fake).
//
// `PUT /request-receipts/{uuid}` (Confirmar Recebimento) é multipart por
// causa de `attachments[].file` — method spoofing (`POST` + `_method=PUT`
// dentro do próprio `FormData`), mirror `updateRequestPurchase` (PUT nativo
// + multipart não é parseado de forma confiável pelo Laravel).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ConfirmReceiptAttachmentPayload,
  ConfirmReceiptItemPayload,
  ConfirmReceiptRequest,
  FinalizeReceiptRequest,
  GenerateFinancialRequest,
  RequestReceiptData,
  RequestReceiptFilterRequest,
  RequestReceiptFinancialContext,
  RequestReceiptInformPaymentContext,
  RequestReceiptListItem,
  RequestReceiptsListEnvelope,
} from '@/@types/v2/RequestReceipts';

export interface ListRequestReceiptsParams
  extends PaginationQueryParams, RequestReceiptFilterRequest {}

async function listRequestReceipts(
  params: ListRequestReceiptsParams
): Promise<ResponsePagination<RequestReceiptListItem[]>> {
  const { data } = await api.V2.get<RequestReceiptsListEnvelope>('/request-receipts', {
    page: params.page,
    per_page: params.per_page,
    // Ordenação do servidor (`code`, `request_date`, `duration`, `updated_on`);
    // sem `sort` vale a ordem do legado (urgente, status, prioridade, código).
    sort: params.orderBy?.name || undefined,
    direction: params.orderBy?.name ? params.orderBy.ascOrDesc : undefined,
    search: params.search || undefined,
    status: params.status ?? undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    user_uuid: params.user_uuid || undefined,
    farm_uuid: params.farm_uuid || undefined,
    type: params.type || undefined,
    responsible_uuid: params.responsible_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listRequestPurchases`/`listInPurchase` (meta REAL, não
  // fallback fake).
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

async function getRequestReceipt(uuid: string) {
  const { data } = await api.V2.get<Response<RequestReceiptData>>(`/request-receipts/${uuid}`);
  return data;
}

// Multipart — mirror `buildRequestPurchaseFormData` (arrays via notação de
// índice `campo[i][chave]`), método PUT nativo + multipart não confiável no
// Laravel → method spoofing.
function buildConfirmReceiptFormData(payload: ConfirmReceiptRequest): FormData {
  const fd = new FormData();

  fd.append('nfe', payload.nfe);
  fd.append('purchase_status', String(payload.purchase_status));
  fd.append('receipt_date', payload.receipt_date);
  if (payload.receipt_note) fd.append('receipt_note', payload.receipt_note);

  payload.items.forEach((item: ConfirmReceiptItemPayload, index: number) => {
    fd.append(`items[${index}][uuid]`, item.uuid);
    fd.append(`items[${index}][status]`, item.status);
    fd.append(`items[${index}][delivery_date]`, item.delivery_date);
  });

  (payload.attachments ?? []).forEach((row: ConfirmReceiptAttachmentPayload, index: number) => {
    fd.append(`attachments[${index}][name]`, row.name);
    fd.append(`attachments[${index}][file]`, row.file);
  });

  return fd;
}

async function confirmRequestReceipt(uuid: string, payload: ConfirmReceiptRequest) {
  const fd = buildConfirmReceiptFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<RequestReceiptData>>(`/request-receipts/${uuid}`, fd);
  return data;
}

async function getRequestReceiptFinancialContext(uuid: string) {
  const { data } = await api.V2.get<Response<RequestReceiptFinancialContext>>(
    `/request-receipts/${uuid}/financial`
  );
  return data;
}

async function generateRequestReceiptFinancial(uuid: string, payload: GenerateFinancialRequest) {
  const { data } = await api.V2.post<Response<RequestReceiptData>>(
    `/request-receipts/${uuid}/financial`,
    payload
  );
  return data;
}

async function getRequestReceiptInformPayment(uuid: string) {
  const { data } = await api.V2.get<Response<RequestReceiptInformPaymentContext>>(
    `/request-receipts/${uuid}/inform-payment`
  );
  return data;
}

async function finalizeRequestReceipt(uuid: string, payload: FinalizeReceiptRequest) {
  const { data } = await api.V2.put<Response<RequestReceiptData>>(
    `/request-receipts/${uuid}/inform-payment`,
    payload
  );
  return data;
}

export {
  confirmRequestReceipt,
  finalizeRequestReceipt,
  generateRequestReceiptFinancial,
  getRequestReceipt,
  getRequestReceiptFinancialContext,
  getRequestReceiptInformPayment,
  listRequestReceipts,
};
