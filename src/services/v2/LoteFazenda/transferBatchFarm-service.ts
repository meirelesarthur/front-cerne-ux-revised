// src/services/v2/LoteFazenda/transferBatchFarm-service.ts
// -----------------------------------------------------------------------------
// TransferBatchFarm Service — API v1 do backend Laravel GB.Cerne
// (Transferência de Lote entre Fazendas — Operacional > Pecuária >
// Transferências, 97-Esteiras/041, TASK-FE-041-LF-01..04). Mirror do
// adaptador de envelope paginado → `ResponsePagination` já usado por
// `transferAbcBatch-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /transfer-batch-farms                    → data: TransferBatchFarmListItem[], meta paginação REAL
//   POST   /transfer-batch-farms                     → payload CreateTransferBatchFarmRequest → data: TransferBatchFarmDetail
//   DELETE /transfer-batch-farms/{uuid}               → 204, sem body (cancelamento lógico, R-04)
//   GET    /transfer-batch-farms/download             → Blob (.xlsx modelo)
//   POST   /transfer-batch-farms/import                → multipart, data: TransferBatchFarmImportResult
//   GET    /transfer-batch-farms/check-date            → data: TransferBatchFarmDateCheckResult
//   GET    /transfer-batch-farms/eligible-animals      → data: TransferBatchFarmEligibleAnimalsByCategory
//   GET    /transfer-batch-farms/eligible-batches      → data: BatchOptionResource[]
//   POST   /transfer-batch-farms/{uuid}/receive        → data: ProcessingResource (uuid do Processing criado)
//   GET    /transfer-batch-farms/{uuid}/financial      → data: TransferBatchFarmDetail
//   POST   /transfer-batch-farms/{uuid}/financial      → payload CreateTransferBatchFarmFinancialRequest → data: TransferBatchFarmDetail
//   GET    /transfer-batch-farms/module-area/last      → data: TransferBatchGrazingAreaLast | null
//   POST   /transfer-batch-farms/module-area           → payload ChangeBatchModuleAreaRequest → data: AnimalBatchResource (batch)
//   GET    /batches/{uuid}                             → data: BatchDetail (LKP-33, R-18)
//   POST   /batches                                    → payload CreateBatchRequest → data: BatchDetail (R-28)
//
// `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id` pelo interceptor genérico
// (`@/services/api.ts`) — nunca manipulado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchDetail,
  ChangeBatchModuleAreaRequest,
  CreateBatchRequest,
  CreateTransferBatchFarmFinancialRequest,
  CreateTransferBatchFarmRequest,
  TransferBatchFarmDateCheckResult,
  TransferBatchFarmDetail,
  TransferBatchFarmEligibleAnimalsByCategory,
  TransferBatchFarmImportResult,
  TransferBatchFarmListItem,
  TransferBatchFarmRefOption,
  TransferBatchFarmsListEnvelope,
  TransferBatchGrazingAreaLast,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

// ---- CRUD central (TASK-FE-041-LF-01) --------------------------------------

// Sem filtros de campo — `TransferBatchFarmIndexRequest::rules()` só aceita
// `status`/`per_page` (só `per_page` é usado pela grid, sem `FilterSide`,
// ver `plano-front-lote-fazenda.md §4 SCR-INDEX`).
export interface ListTransferBatchFarmsParams extends PaginationQueryParams {}

async function listTransferBatchFarms(
  params: ListTransferBatchFarmsParams
): Promise<ResponsePagination<TransferBatchFarmListItem[]>> {
  const { data } = await api.V2.get<TransferBatchFarmsListEnvelope>('/transfer-batch-farms', {
    page: params.page,
    per_page: params.per_page,
  });

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

async function createTransferBatchFarm(payload: CreateTransferBatchFarmRequest) {
  const { data } = await api.V2.post<Response<TransferBatchFarmDetail>>(
    '/transfer-batch-farms',
    payload
  );
  return data;
}

// DELETE /transfer-batch-farms/{uuid} — 204, sem body. Cancelamento lógico
// (R-04, `status=4`) restrito à fazenda de ORIGEM e `status=PENDING` no
// servidor — o front só dispara, a regra fica 100% no backend.
async function cancelTransferBatchFarm(transferBatchFarmUuid: string) {
  await api.V2.delete(`/transfer-batch-farms/${transferBatchFarmUuid}`);
}

async function downloadTransferBatchFarmTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/transfer-batch-farms/download',
    {},
    { responseType: 'blob' }
  );
  return data;
}

async function importTransferBatchFarmSpreadsheet(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<TransferBatchFarmImportResult>>(
    '/transfer-batch-farms/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

// ---- Recebimento → Processing + Financeiro morph (TASK-FE-041-LF-02) -------

// `POST .../receive` devolve o `Processing` recém-criado (`ProcessingResource`)
// — o caller navega para `/operacional/processamentos/{uuid}` (rota JÁ
// existente, Exec 039, wizard origin-agnostic).
async function receiveTransferBatchFarm(transferBatchFarmUuid: string) {
  const { data } = await api.V2.post<Response<{ uuid: string }>>(
    `/transfer-batch-farms/${transferBatchFarmUuid}/receive`
  );
  return data;
}

async function getTransferBatchFarmFinancial(transferBatchFarmUuid: string) {
  const { data } = await api.V2.get<Response<TransferBatchFarmDetail>>(
    `/transfer-batch-farms/${transferBatchFarmUuid}/financial`
  );
  return data;
}

async function saveTransferBatchFarmFinancial(
  transferBatchFarmUuid: string,
  payload: CreateTransferBatchFarmFinancialRequest
) {
  const { data } = await api.V2.post<Response<TransferBatchFarmDetail>>(
    `/transfer-batch-farms/${transferBatchFarmUuid}/financial`,
    payload
  );
  return data;
}

// ---- Lookups de fechamento (TASK-FE-041-LF-03) ------------------------------

export interface CheckTransferBatchFarmDateParams {
  date: string;
  batch_uuid?: string | null;
  farm_uuid?: string | null;
}

async function checkTransferBatchFarmDate(params: CheckTransferBatchFarmDateParams) {
  const { data } = await api.V2.get<Response<TransferBatchFarmDateCheckResult>>(
    '/transfer-batch-farms/check-date',
    params
  );
  return data;
}

async function listEligibleAnimalsForTransferBatchFarm(batchUuid: string) {
  const { data } = await api.V2.get<Response<TransferBatchFarmEligibleAnimalsByCategory>>(
    '/transfer-batch-farms/eligible-animals',
    { batch_uuid: batchUuid }
  );
  return data;
}

// Adaptado para `ResponsePagination` (consumo por `SelectAsyncPaginate`) —
// mesmo truque estrutural de `listBatchOptions`/`listBatchOptionsForForm`
// (`batch-service.ts`): coleção flat, sem paginação real do servidor.
export interface ListEligibleBatchesForTransferBatchFarmParams extends PaginationQueryParams {
  category_uuid?: string | null;
}

async function listEligibleBatchesForTransferBatchFarm(
  params: ListEligibleBatchesForTransferBatchFarmParams
): Promise<ResponsePagination<TransferBatchFarmRefOption[]>> {
  const { data } = await api.V2.get<Response<TransferBatchFarmRefOption[]>>(
    '/transfer-batch-farms/eligible-batches',
    { category_uuid: params.category_uuid ?? undefined }
  );
  const items = data.data ?? [];
  return {
    success: data.success,
    message: data.message,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function getBatch(batchUuid: string) {
  const { data } = await api.V2.get<Response<BatchDetail>>(`/batches/${batchUuid}`);
  return data;
}

async function createBatch(payload: CreateBatchRequest) {
  const { data } = await api.V2.post<Response<BatchDetail>>('/batches', payload);
  return data;
}

async function getLastTransferBatchGrazingArea() {
  const { data } = await api.V2.get<Response<TransferBatchGrazingAreaLast | null>>(
    '/transfer-batch-farms/module-area/last'
  );
  return data;
}

async function changeBatchModuleArea(payload: ChangeBatchModuleAreaRequest) {
  const { data } = await api.V2.post<Response<BatchDetail>>(
    '/transfer-batch-farms/module-area',
    payload
  );
  return data;
}

export {
  cancelTransferBatchFarm,
  changeBatchModuleArea,
  checkTransferBatchFarmDate,
  createBatch,
  createTransferBatchFarm,
  downloadTransferBatchFarmTemplate,
  getBatch,
  getLastTransferBatchGrazingArea,
  getTransferBatchFarmFinancial,
  importTransferBatchFarmSpreadsheet,
  listEligibleAnimalsForTransferBatchFarm,
  listEligibleBatchesForTransferBatchFarm,
  listTransferBatchFarms,
  receiveTransferBatchFarm,
  saveTransferBatchFarmFinancial,
};
