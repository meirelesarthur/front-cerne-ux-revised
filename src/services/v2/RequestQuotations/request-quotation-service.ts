// src/services/v2/RequestQuotations/request-quotation-service.ts
// -----------------------------------------------------------------------------
// RequestQuotation Service — API v1 do backend Laravel GB.Cerne (Suprimentos/
// Compras — "Cotações"). Contrato: `97-Esteiras/035/ROTEIROS/02-roteiro-api-cotacoes.md`
// (Seções 5/6, APROVADO PARCIAL — Núcleo+Dimensão B) +
// `97-Esteiras/035/ROTEIROS/03-roteiro-frontend-cotacoes.md` (Seção 3).
//
// ✅ CONFIRMADO CONTRA O CÓDIGO REAL (TASK-CQ-FE-01) — backend fechado
// (`RequestQuotationController`/`Resources`/`Requests`/rotas em
// `routes/api.php`, lidos diretamente no `api_root`). Escopo desta Tarefa
// (fundação) é só o NÚCLEO: CRUD + `quotes` + `saving` — payments (nested,
// `GET/POST .../payments`) e e-mail em lote (`POST .../email-batch`) ficam
// para as Tarefas que os consomem (TASK-CQ-FE-05/08), mirror da disciplina
// incremental já usada em `request-purchase-service.ts`.
//
//   GET  /request-purchases/{uuid}/quotations   → data: RequestQuotationData[]
//                                                  (SEM paginação — grade
//                                                  comparativa de UMA
//                                                  solicitação, tipicamente
//                                                  curta; filtros opcionais
//                                                  `provider_uuid`/`status`,
//                                                  `RequestQuotationFilterData`)
//   GET  /request-quotations/{uuid}             → data: RequestQuotationData
//                                                  (resposta mais completa —
//                                                  ver nota de eager-loading
//                                                  em `@/@types/v2/RequestQuotations`)
//   POST /request-quotations                    → JSON puro (SEM multipart —
//                                                  nenhum campo de arquivo no
//                                                  núcleo desta Tarefa)
//   PUT  /request-quotations/{uuid}              → JSON puro, PUT nativo
//                                                  (mirror `updateSupplyStatusSla`
//                                                  — sem method spoofing,
//                                                  diferente de `RequestPurchase`,
//                                                  que precisa de multipart
//                                                  por causa de anexos)
//   DELETE /request-quotations/{uuid}            → CONFIRMADO nas rotas reais
//                                                  (`Route::apiResource(...)
//                                                  ->except(['index'])`)
//   PUT  /request-quotations/{uuid}/saving        → "Aplicar Saving" (CV-04,
//                                                  TASK-CQ-FE-06) — registrado
//                                                  já na fundação (função
//                                                  simples, sem tela própria
//                                                  ainda; a Tarefa do Dialog
//                                                  só constrói a UI em cima
//                                                  desta função já existente).
//
// `request_purchase_uuid` é exigido pelo Form Request real em AMBOS os
// verbos (store/update), mas é IMUTÁVEL no update — a
// `UpdateRequestQuotationAction` real IGNORA esse campo de propósito.
// `updateRequestQuotation` aqui SEMPRE envia o payload completo recebido
// (mesma disciplina de `buildRequestPurchaseFormData`: quem garante que o
// valor de `request_purchase_uuid` é o ORIGINAL é o chamador, nunca um campo
// editável pelo usuário no Dialog de edição, TASK-CQ-FE-04).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';
import type {
  QuotationSeparatePayload,
  QuotationStageItemsPayload,
  RequestQuotationData,
  RequestQuotationEmailBatchPayload,
  RequestQuotationFilterRequest,
  RequestQuotationPayload,
  RequestQuotationSavingPayload,
} from '@/@types/v2/RequestQuotations';

export interface ListRequestQuotationsByPurchaseParams extends RequestQuotationFilterRequest {}

// `quotes` (RT-10) — grade comparativa de UMA `RequestPurchase`. SEM
// paginação (`ApiResponse::success` com uma `Collection`, não
// `ApiResponse::paginated`) — mirror `listSupplyStatusSlas` quanto à ausência
// de envelope de paginação, mas com `data` sempre um array.
async function listRequestQuotationsByPurchase(
  requestPurchaseUuid: string,
  params: ListRequestQuotationsByPurchaseParams = {}
): Promise<Response<RequestQuotationData[]>> {
  const { data } = await api.V2.get<Response<RequestQuotationData[]>>(
    `/request-purchases/${requestPurchaseUuid}/quotations`,
    {
      provider_uuid: params.provider_uuid || undefined,
      status: params.status ?? undefined,
    }
  );
  return data;
}

async function getRequestQuotation(uuid: string): Promise<Response<RequestQuotationData>> {
  const { data } = await api.V2.get<Response<RequestQuotationData>>(`/request-quotations/${uuid}`);
  return data;
}

async function createRequestQuotation(
  payload: RequestQuotationPayload
): Promise<Response<RequestQuotationData>> {
  const { data } = await api.V2.post<Response<RequestQuotationData>>(
    '/request-quotations',
    payload
  );
  return data;
}

async function updateRequestQuotation(
  uuid: string,
  payload: RequestQuotationPayload
): Promise<Response<RequestQuotationData>> {
  const { data } = await api.V2.put<Response<RequestQuotationData>>(
    `/request-quotations/${uuid}`,
    payload
  );
  return data;
}

async function deleteRequestQuotation(uuid: string) {
  const { data } = await api.V2.delete(`/request-quotations/${uuid}`);
  return data;
}

// "Aplicar Saving" (RT-16/RT-19, CV-04) — `discount` é o "valor líquido" do
// form legado (rótulo confuso preservado, CL-045, ver comentário do tipo
// `RequestQuotationSavingPayload`). Registrado já na fundação — a UI (Dialog
// Aplicar Saving) é TASK-CQ-FE-06.
async function applyRequestQuotationSaving(
  uuid: string,
  payload: RequestQuotationSavingPayload
): Promise<Response<RequestQuotationData>> {
  const { data } = await api.V2.put<Response<RequestQuotationData>>(
    `/request-quotations/${uuid}/saving`,
    payload
  );
  return data;
}

// "Enviar E-mail em Lote" (RT-13 + antigo RT-21, CL-050, TASK-CQ-FE-08) — o
// servidor resolve os destinatários (fornecedor/vendedores) por cotação e
// ABORTA O LOTE INTEIRO se algum e-mail resolvido for inválido (422,
// `errors.invalid_emails[]`, `SendRequestQuotationEmailBatchAction` real). O
// front NUNCA decide client-side quem é válido — só monta o array de itens
// (`RequestQuotationEmailBatchPayload`) e trata o 422 devolvido
// (`RequestQuotationEmailBatchModal.tsx`). Sem corpo de dado no retorno de
// sucesso (a Action só orquestra efeitos colaterais — promoção de status +
// despacho de Job), mirror `sendForAuthorization`.
async function sendRequestQuotationEmailBatch(
  payload: RequestQuotationEmailBatchPayload
): Promise<Response<null>> {
  const { data } = await api.V2.post<Response<null>>('/request-quotations/email-batch', payload);
  return data;
}

// -----------------------------------------------------------------------------
// "Escolher Forma de Pagamento" da Aprovação (execução 081, T-081-FE-06,
// DEP-API-06). Contrato do plano da API (T-081-API-07): `PUT
// request-quotations/{uuid}/selected-payment { request_quotation_payment_uuid }`
// grava a condição escolhida (422 se não for da própria cotação) e o Resource da
// cotação devolve `selected_payment_uuid`. As condições vêm em `payments[]` da
// própria cotação (sem GET extra). O `POST .../payments` existente é o SYNC de
// condições (não seleciona) e não é usado aqui.
// -----------------------------------------------------------------------------

/** Payload de seleção — uuid da condição de pagamento da PRÓPRIA cotação. */
export interface SelectRequestQuotationPaymentPayload {
  request_quotation_payment_uuid: string;
}

// `PUT /request-quotations/{uuid}/selected-payment` — retorna a `RequestQuotationData`
// atualizada (mirror `applyRequestQuotationSaving`).
async function selectRequestQuotationPayment(
  uuid: string,
  payload: SelectRequestQuotationPaymentPayload
): Promise<Response<RequestQuotationData>> {
  const { data } = await api.V2.put<Response<RequestQuotationData>>(
    `/request-quotations/${uuid}/selected-payment`,
    payload
  );
  return data;
}

// -----------------------------------------------------------------------------
// Estágio de cotação (execução 081, T-081-FE-08; EXEC-API-07).
//   - `PUT request-purchases/{uuid}/quotation-items` (update-item, permissão
//     `request-quotation_edit`, status 1 ou 2): define produto, quantidade e
//     descrição; item sem `uuid` é criado, nunca remove. Devolve a solicitação.
//   - `POST request-purchases/{uuid}/quotation-separate` (Criar Sub Solicitação
//     na cotação, status 1 ou 2, só o responsável): devolve a sub NOVA (201).
// Os dois ficam aqui (dono da onda: request-quotation-service) e não em
// `request-purchase-service` (dono da onda: executor A).
// -----------------------------------------------------------------------------

async function updateQuotationStageItems(
  requestPurchaseUuid: string,
  payload: QuotationStageItemsPayload
): Promise<Response<RequestPurchaseData>> {
  const { data } = await api.V2.put<Response<RequestPurchaseData>>(
    `/request-purchases/${requestPurchaseUuid}/quotation-items`,
    payload
  );
  return data;
}

async function separateRequestPurchaseAtQuotation(
  requestPurchaseUuid: string,
  payload: QuotationSeparatePayload
): Promise<Response<RequestPurchaseData>> {
  const { data } = await api.V2.post<Response<RequestPurchaseData>>(
    `/request-purchases/${requestPurchaseUuid}/quotation-separate`,
    payload
  );
  return data;
}

export {
  separateRequestPurchaseAtQuotation,
  updateQuotationStageItems,
  applyRequestQuotationSaving,
  createRequestQuotation,
  deleteRequestQuotation,
  getRequestQuotation,
  listRequestQuotationsByPurchase,
  selectRequestQuotationPayment,
  sendRequestQuotationEmailBatch,
  updateRequestQuotation,
};
