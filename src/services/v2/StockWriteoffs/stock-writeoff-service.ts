// src/services/v2/StockWriteoffs/stock-writeoff-service.ts
// -----------------------------------------------------------------------------
// Stock Writeoff Service — API v1 do backend Laravel GB.Cerne (Baixa de
// Estoque, Administrativo). Esteira 038.
//
// FATIA READ (TASK-FE-3001/3002/3003):
//   GET    /stock-writeoffs         → paginado; listagem (`StockWriteoffResource`)
//   GET    /stock-writeoffs/{uuid}  → detalhe (mesmo Resource, `whenLoaded` completo)
//   DELETE /stock-writeoffs/{uuid}  → 204 (restaura estoque no backend, D2)
//
// FATIA WRITE (TASK-FE-3004/3005/3006):
//   POST   /stock-writeoffs                → criação (cabeçalho + items[] +
//                                              attachments[] inline, uuid) —
//                                              multipart SÓ quando há arquivo
//                                              novo em `attachments`, JSON puro
//                                              no resto (mirror `service-order-
//                                              service.ts`/`request-receipt-
//                                              service.ts`, escolha por payload)
//   GET    /stock-writeoffs/report         → PDF cru (`application/pdf`,
//                                              `blob`, NÃO envelope)
//   GET    /stock-writeoffs/{uuid}/nfe-draft → envelope (draft de pré-preenchimento)
//   POST   /stock-writeoffs/{uuid}/nfe       → vincula (`{ nfe_uuid }`), 200 `StockWriteoffResource`
//
// `getAllStockWriteoffs` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination
// } }) que a infra de grid do projeto (`useCustomGridQuery`/`TableProvider`)
// consome — mirror `listStockCorrections`/`listWarehouses`.
//
// Rota dentro de `farm.context` — `X-Farm-Id` (uuid) anexado automaticamente
// pelo interceptor genérico de `@/services/api.ts` (overlay SPA, envelope
// ApiResponse + Sanctum cookie + X-Farm-Id).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  GetStockWriteoffReportParams,
  LinkNfeToStockWriteoffPayload,
  StockWriteoffAttachmentPayload,
  StockWriteoffCreatePayload,
  StockWriteoffData,
  StockWriteoffNfeDraft,
  StockWriteoffsListEnvelope,
} from '@/@types/v2/StockWriteoffs';

// Params aceitos pela listagem — filtro sobre `created_at` (D7, contrato de
// tela §2.3). `warehouse_uuid`/`product_uuid` do contrato de índice existem
// no backend mas NÃO são expostos por nenhum campo de UI nesta fatia READ
// (a Tarefa 3002 só expõe `start_date`/`end_date` no FilterSide) — omitidos
// aqui para não fabricar uma capacidade sem consumidor.
export interface ListStockWriteoffsParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
}

async function getAllStockWriteoffs(
  params: ListStockWriteoffsParams
): Promise<ResponsePagination<StockWriteoffData[]>> {
  const { data } = await api.V2.get<StockWriteoffsListEnvelope>('/stock-writeoffs', {
    page: params.page,
    per_page: params.per_page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listStockCorrections`/`listWarehouses` (meta REAL, não fallback fake).
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

async function getStockWriteoff(uuid: string): Promise<Response<StockWriteoffData>> {
  const { data } = await api.V2.get<Response<StockWriteoffData>>(`/stock-writeoffs/${uuid}`);
  return data;
}

// `GET /stock-writeoffs/next-code` — sugestão de próximo código, SÓ chamada
// em modo CRIAÇÃO (BAIXA-11, execução 038, homolog R1 — mirror EXATO
// `getServiceOrderNextCode`, `service-order-service.ts`). Resposta simples
// `{ code: string }`. Esta fatia NUNCA teve edição (`only([index,store,show,
// destroy])`), então `code` é sempre uma prévia de exibição — NUNCA entra
// no `StockWriteoffCreatePayload` (o backend gera o código real na Action
// de criação, `StockWriteoffRequest` não tem regra para `code`).
async function getStockWriteoffNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/stock-writeoffs/next-code');
  return data;
}

async function deleteStockWriteoff(uuid: string) {
  const { data } = await api.V2.delete(`/stock-writeoffs/${uuid}`);
  return data;
}

// ============================================
// ESCRITA (TASK-FE-3004) — `POST /stock-writeoffs`. Multipart SÓ quando há
// pelo menos 1 anexo com `file` (mirror `confirmRequestReceipt`/
// `buildConfirmReceiptFormData` — arrays via notação de índice
// `campo[i][chave]`); sem anexo, JSON puro (mais simples, sem overhead de
// FormData para o caso comum). `center` (D3/D-FE-BE-04) só entra quando
// preenchido — a API aceita e descarta, nunca gera 422.
// ============================================

function buildStockWriteoffFormData(payload: StockWriteoffCreatePayload): FormData {
  const fd = new FormData();

  fd.append('date', payload.date);
  fd.append('warehouse_uuid', payload.warehouse_uuid);
  fd.append('type', String(payload.type));
  if (payload.type_note) fd.append('type_note', payload.type_note);
  fd.append('justification', payload.justification);
  if (payload.center) fd.append('center', payload.center);

  payload.items.forEach((item, index) => {
    fd.append(`items[${index}][product_uuid]`, item.product_uuid);
    fd.append(`items[${index}][quantity]`, String(item.quantity));
    fd.append(`items[${index}][value]`, String(item.value));
    if (item.lot) fd.append(`items[${index}][lot]`, item.lot);
  });

  (payload.attachments ?? []).forEach((row: StockWriteoffAttachmentPayload, index: number) => {
    fd.append(`attachments[${index}][name]`, row.name);
    fd.append(`attachments[${index}][file]`, row.file);
  });

  return fd;
}

async function createStockWriteoff(payload: StockWriteoffCreatePayload) {
  const hasAttachmentFile = (payload.attachments ?? []).some((row) => !!row.file);

  const body = hasAttachmentFile
    ? buildStockWriteoffFormData(payload)
    : {
        date: payload.date,
        warehouse_uuid: payload.warehouse_uuid,
        type: payload.type,
        type_note: payload.type_note || undefined,
        justification: payload.justification,
        items: payload.items,
        center: payload.center || undefined,
      };

  const { data } = await api.V2.post<Response<StockWriteoffData>>('/stock-writeoffs', body);
  return data;
}

// ============================================
// RELATÓRIO (TASK-FE-3005) — `GET /stock-writeoffs/report`, PDF cru
// (`application/pdf`, `Content-Disposition: inline`) — `responseType: 'blob'`
// (o interceptor de envelope NÃO se aplica; nunca desempacotar `data.data`).
// ============================================

async function getStockWriteoffReport(params: GetStockWriteoffReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stock-writeoffs/report',
    {
      warehouse_uuid: params.warehouse_uuid,
      product_uuid: params.product_uuid || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

// ============================================
// HANDOFF "EMITIR NFE" (TASK-FE-3006, D-FE-BE-05) — draft de pré-preenchimento
// + vínculo isolado. A criação/emissão da Nfe em si é da feature Nfe
// (`/nfes`, NAO_APLICAVEL a esta raiz) — aqui só o draft e o `POST .../nfe`.
// ============================================

async function getStockWriteoffNfeDraft(uuid: string) {
  const { data } = await api.V2.get<Response<StockWriteoffNfeDraft>>(
    `/stock-writeoffs/${uuid}/nfe-draft`
  );
  return data;
}

async function linkNfeToStockWriteoff(uuid: string, payload: LinkNfeToStockWriteoffPayload) {
  const { data } = await api.V2.post<Response<StockWriteoffData>>(
    `/stock-writeoffs/${uuid}/nfe`,
    payload
  );
  return data;
}

export {
  createStockWriteoff,
  deleteStockWriteoff,
  getAllStockWriteoffs,
  getStockWriteoff,
  getStockWriteoffNextCode,
  getStockWriteoffNfeDraft,
  getStockWriteoffReport,
  linkNfeToStockWriteoff,
};
