// src/services/v2/Requisitions/requisition-service.ts
// -----------------------------------------------------------------------------
// Requisition Service — API v1 do backend Laravel GB.Cerne (Requisição/Saída
// — Estoque, escrita, 97-Esteiras/002, Tarefas 04/05). Mirror exato de
// `farm-transfer-service.ts`/`warehouse-transfer-service.ts` (adaptador de
// envelope paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /requisitions          → data: RequisitionListItem[], meta
//                                    paginação REAL (filtros
//                                    product_uuid/warehouse_uuid/
//                                    cost_center_uuid/date_from/date_to)
//   GET    /requisitions/{uuid}   → data: RequisitionDetail (Resource
//                                    DISTINTO do índice, `GAP-RS-03`)
//   POST   /requisitions          → payload CreateRequisitionPayload (lote)
//                                    → data: RequisitionDetail[] (ARRAY —
//                                    `RequisitionResource::collection`,
//                                    NUNCA um objeto único)
//   DELETE /requisitions/{uuid}   → 204, sem body
//
// Nenhum service novo de apoio criado — os lookups do formulário de criação
// (Tarefa 05) reusam serviços JÁ EXISTENTES (`listStocks`, `listWarehouses`,
// `listCostCenterOptions`, `listAreas`).
//
// ---- Tarefa 06 (fluxo de assinatura, GAP-REQUISICAO-FE-03 Pontos A/B) -----
// 3 endpoints ADITIVOS, todos EXCECAO ao envelope ApiResponse (resposta
// binaria), `responseType: 'blob'`, mirror `getFoodBeatItemReport`/
// `downloadInvoiceXml`:
//   GET  /requisitions/{uuid}/document        -> SEMPRE regenera o PDF de
//                                                MODELO para assinatura
//                                                (`GenerateRequisitionDocumentAction`)
//                                                - NUNCA o arquivo assinado
//                                                real.
//   POST /requisitions/{uuid}/document        -> multipart `file`, importa o
//                                                documento assinado
//                                                (`ImportRequisitionDocumentAction`),
//                                                transiciona `status` de
//                                                `pending`(1) para `signed`(2).
//   GET  /requisitions/{uuid}/document/signed -> stream do arquivo REAL
//                                                armazenado por
//                                                `ImportRequisitionDocumentAction`,
//                                                404 se `status !== signed`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateRequisitionPayload,
  RequisitionDetail,
  RequisitionListItem,
  RequisitionsListEnvelope,
} from '@/@types/v2/Requisitions';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `RequisitionFilterData.php`.
export interface ListRequisitionsParams extends PaginationQueryParams {
  product_uuid?: string;
  warehouse_uuid?: string;
  cost_center_uuid?: string;
  date_from?: string;
  date_to?: string;
}

async function listRequisitions(
  params: ListRequisitionsParams
): Promise<ResponsePagination<RequisitionListItem[]>> {
  const { data } = await api.V2.get<RequisitionsListEnvelope>('/requisitions', {
    page: params.page,
    per_page: params.per_page,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
    cost_center_uuid: params.cost_center_uuid || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFarmTransfers`/`listWarehouseTransfers`.
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

// GET /requisitions/{uuid} — Resource DISTINTO do índice (`GAP-RS-03`):
// NÃO reexibe `cost_center`/`amount`/`status`/`signature*`.
async function getRequisition(requisitionUuid: string) {
  const { data } = await api.V2.get<Response<RequisitionDetail>>(
    `/requisitions/${requisitionUuid}`
  );
  return data;
}

// POST /requisitions — lote (items[]). `data` da resposta é um ARRAY
// (`RequisitionResource::collection`), NÃO um objeto único.
async function createRequisition(payload: CreateRequisitionPayload) {
  const { data } = await api.V2.post<Response<RequisitionDetail[]>>('/requisitions', payload);
  return data;
}

// DELETE /requisitions/{uuid} — exclui UMA linha (reverte o saldo de
// origem no servidor, `DestroyRequisitionAction`).
async function deleteRequisition(requisitionUuid: string) {
  await api.V2.delete(`/requisitions/${requisitionUuid}`);
}

// `GET /requisitions/next-code` foi REMOVIDO (97-Esteiras/002, `GAP-RS-10`):
// a prévia do próximo `code` agora é calculada no Front a partir da própria
// `listRequisitions({ page: 1, per_page: 1 })` — sem consumidor restante
// para o endpoint dedicado.

// ---- Tarefa 06 — fluxo de assinatura ---------------------------------------

// GET /requisitions/{uuid}/document — SEMPRE regenera o PDF de MODELO para
// assinatura (nunca o arquivo assinado real) — mirror `getFoodBeatItemReport`.
async function getRequisitionDocument(requisitionUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/requisitions/${requisitionUuid}/document`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// POST /requisitions/{uuid}/document — multipart `file`, importa o documento
// assinado (transiciona `status` de `pending` para `signed` no servidor).
// Mirror `importStockCorrections` (FormData direto, sem envelope de upload
// dedicado). 422 de domínio se a Requisição já estiver `signed`
// (`ImportRequisitionDocumentAction`) — tratado pelo caller via
// `extractApiFieldErrorMessage`.
async function importRequisitionDocument(requisitionUuid: string, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post(`/requisitions/${requisitionUuid}/document`, fd);
  return data;
}

// GET /requisitions/{uuid}/document/signed — stream do arquivo REALMENTE
// armazenado por `ImportRequisitionDocumentAction` (extensão aditiva,
// GAP-REQUISICAO-FE-03 Ponto B) — 404 de domínio se `status !== signed`.
async function getSignedRequisitionDocument(requisitionUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/requisitions/${requisitionUuid}/document/signed`,
    undefined,
    { responseType: 'blob' }
  );
  return data;
}

export {
  createRequisition,
  deleteRequisition,
  getRequisition,
  getRequisitionDocument,
  getSignedRequisitionDocument,
  importRequisitionDocument,
  listRequisitions,
};
