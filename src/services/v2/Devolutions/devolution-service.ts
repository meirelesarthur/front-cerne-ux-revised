// src/services/v2/Devolutions/devolution-service.ts
// -----------------------------------------------------------------------------
// Devolution Service — API v1 do backend Laravel GB.Cerne (Devolução/Entrada
// — Estoque, escrita, 97-Esteiras/037). Mirror `requisition-service.ts`
// (CRUD+documento) fundido com `stock-correction-service.ts` (import+template),
// endpoint base `/devolutions`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /devolutions                    → data: DevolutionListItem[], meta
//                                             paginação REAL
//   GET    /devolutions/{uuid}             → data: DevolutionDetail
//   POST   /devolutions                    → payload CreateDevolutionPayload
//                                             (lote) → data: DevolutionDetail[]
//                                             (ARRAY — DevolutionResource::collection)
//   PUT|PATCH /devolutions/{uuid}          → payload UpdateDevolutionPayload
//                                             (linha única, PATCH parcial)
//                                             → data: DevolutionDetail (objeto único)
//   DELETE /devolutions/{uuid}             → 204, sem body
//   GET    /devolutions/import/template    → binário .xlsx
//   POST   /devolutions/import             → multipart `file`
//   GET    /devolutions/{uuid}/document        → SEMPRE regenera PDF de MODELO
//   POST   /devolutions/{uuid}/document        → multipart `file`, importa assinado
//   GET    /devolutions/{uuid}/document/signed → stream do arquivo REAL assinado
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateDevolutionPayload,
  DevolutionDetail,
  DevolutionImportResult,
  DevolutionListItem,
  DevolutionsListEnvelope,
  UpdateDevolutionPayload,
} from '@/@types/v2/Devolutions';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `DevolutionFilterData.php`.
export interface ListDevolutionsParams extends PaginationQueryParams {
  product_uuid?: string;
  warehouse_uuid?: string;
  cost_center_uuid?: string;
  date_from?: string;
  date_to?: string;
}

async function listDevolutions(
  params: ListDevolutionsParams
): Promise<ResponsePagination<DevolutionListItem[]>> {
  const { data } = await api.V2.get<DevolutionsListEnvelope>('/devolutions', {
    page: params.page,
    per_page: params.per_page,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
    cost_center_uuid: params.cost_center_uuid || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listRequisitions`.
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

// GET /devolutions/{uuid} — `show()` expõe tudo (sem omissão equivalente a
// `GAP-RS-03` de `Requisition`).
async function getDevolution(devolutionUuid: string) {
  const { data } = await api.V2.get<Response<DevolutionDetail>>(`/devolutions/${devolutionUuid}`);
  return data;
}

// POST /devolutions — lote (items[]). `data` da resposta é um ARRAY
// (`DevolutionResource::collection`), NÃO um objeto único.
async function createDevolution(payload: CreateDevolutionPayload) {
  const { data } = await api.V2.post<Response<DevolutionDetail[]>>('/devolutions', payload);
  return data;
}

// PATCH /devolutions/{uuid} — linha única, `sometimes` (PATCH parcial,
// `FID-11`). `data` da resposta é um OBJETO ÚNICO.
async function updateDevolution(devolutionUuid: string, payload: UpdateDevolutionPayload) {
  const { data } = await api.V2.patch<Response<DevolutionDetail>>(
    `/devolutions/${devolutionUuid}`,
    payload
  );
  return data;
}

// DELETE /devolutions/{uuid} — exclui UMA linha (reverte o saldo no servidor).
async function deleteDevolution(devolutionUuid: string) {
  await api.V2.delete(`/devolutions/${devolutionUuid}`);
}

// ---- Import de planilha (.xlsx) -------------------------------------------
// Exceção ao envelope ApiResponse (resposta binária) — `responseType: 'blob'`,
// mirror `downloadStockCorrectionImportTemplate`.

async function downloadDevolutionImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/devolutions/import/template', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /devolutions/import` — multipart, campo `file`. Sucesso: envelope
// `Response<DevolutionImportResult>` (`codes[]` ARRAY, `groups_processed`,
// `rows_processed` — agrupamento por `date|requester`, `FID-14`). Erro 422:
// `errors.rows: string[]` OU `message` única — tratamento diferenciado fica
// na mutation do `DevolucaoImportModal.tsx` (mirror `StockCorrectionImportModal`).
async function importDevolutions(file: File): Promise<Response<DevolutionImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<DevolutionImportResult>>('/devolutions/import', fd);
  return data;
}

// ---- Fluxo de documento assinado -------------------------------------------

// GET /devolutions/{uuid}/document — SEMPRE regenera o PDF de MODELO para
// assinatura (nunca o arquivo assinado real) — mirror `getRequisitionDocument`.
async function getDevolutionDocument(devolutionUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/devolutions/${devolutionUuid}/document`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// POST /devolutions/{uuid}/document — multipart `file`, importa o documento
// assinado (transiciona `status` de `pending` para `signed` no servidor).
async function importDevolutionDocument(devolutionUuid: string, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post(`/devolutions/${devolutionUuid}/document`, fd);
  return data;
}

// GET /devolutions/{uuid}/document/signed — stream do arquivo REALMENTE
// armazenado — 404 de domínio se `status !== signed`.
async function getSignedDevolutionDocument(devolutionUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/devolutions/${devolutionUuid}/document/signed`,
    undefined,
    { responseType: 'blob' }
  );
  return data;
}

export {
  createDevolution,
  deleteDevolution,
  downloadDevolutionImportTemplate,
  getDevolution,
  getDevolutionDocument,
  getSignedDevolutionDocument,
  importDevolutionDocument,
  importDevolutions,
  listDevolutions,
  updateDevolution,
};
