// src/services/v2/Livestock/transferAbcBatch-service.ts
// -----------------------------------------------------------------------------
// TransferAbcBatch Service — API v1 do backend Laravel GB.Cerne
// (Transferência ABC de Animais entre Lotes — Operacional > Pecuária >
// Transferências, 97-Esteiras/039, TASK-FE-039-ABC-01). Mirror do adaptador
// de envelope paginado → `ResponsePagination` já usado por
// `farm-transfer-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /transfer-abc-batches          → data: TransferAbcBatchListItem[], meta paginação REAL
//   GET    /transfer-abc-batches/{uuid}   → data: TransferAbcBatchDetailData (eager completo)
//   POST   /transfer-abc-batches          → payload CreateTransferAbcBatchRequest → data: TransferAbcBatchDetailData
//   DELETE /transfer-abc-batches/{uuid}   → 204, sem body
//
// SEM `update` (D3, parity). `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id`
// pelo interceptor genérico (`@/services/api.ts`) — nunca manipulado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateTransferAbcBatchRequest,
  TransferAbcBatchDetailData,
  TransferAbcBatchesListEnvelope,
  TransferAbcBatchListItem,
} from '@/@types/v2/Livestock/transferAbcBatch';

// Sem filtros de campo — `TransferAbcBatchIndexRequest::rules()` só aceita
// `per_page` (achado confirmado por leitura direta, ver docblock dos tipos).
export interface ListTransferAbcBatchesParams extends PaginationQueryParams {}

async function listTransferAbcBatches(
  params: ListTransferAbcBatchesParams
): Promise<ResponsePagination<TransferAbcBatchListItem[]>> {
  const { data } = await api.V2.get<TransferAbcBatchesListEnvelope>('/transfer-abc-batches', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listFarmTransfers`/`listClients`.
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

// GET /transfer-abc-batches/{uuid} — detalhe eager completo (animals.animal,
// expenses, incomes).
async function getTransferAbcBatch(transferAbcBatchUuid: string) {
  const { data } = await api.V2.get<Response<TransferAbcBatchDetailData>>(
    `/transfer-abc-batches/${transferAbcBatchUuid}`
  );
  return data;
}

// POST /transfer-abc-batches — `data` da resposta é 1 objeto único
// (`ApiResponse::created(new TransferAbcBatchResource($batch))`), NÃO um
// array (diverge de `createFarmTransfer`, que devolve array).
async function createTransferAbcBatch(payload: CreateTransferAbcBatchRequest) {
  const { data } = await api.V2.post<Response<TransferAbcBatchDetailData>>(
    '/transfer-abc-batches',
    payload
  );
  return data;
}

// DELETE /transfer-abc-batches/{uuid} — 204, sem body. Não reverte o lote
// nem histórico (D1, non-reversal, parity) — a UI não promete reversão (FD4).
async function deleteTransferAbcBatch(transferAbcBatchUuid: string) {
  await api.V2.delete(`/transfer-abc-batches/${transferAbcBatchUuid}`);
}

export {
  createTransferAbcBatch,
  deleteTransferAbcBatch,
  getTransferAbcBatch,
  listTransferAbcBatches,
};
