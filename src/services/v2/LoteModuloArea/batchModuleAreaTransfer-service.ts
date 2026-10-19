// src/services/v2/LoteModuloArea/batchModuleAreaTransfer-service.ts
// -----------------------------------------------------------------------------
// BatchModuleAreaTransfer Service — API v1 do backend Laravel GB.Cerne
// (Lote/Módulo/Área — Operacional > Pecuária > Transferências, 97-Esteiras/070,
// TASK-LMA-FE-01). Mirror de cabeçalho/estrutura de
// `@/services/v2/LoteFazenda/transferBatchFarm-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /batch-module-area-transfers                          → data: BatchModuleAreaTransferListItem[], meta paginação REAL (per_page=10 no backend)
//   GET  /batch-module-area-transfers/create-options?batch_uuid= → data: BatchModuleAreaTransferOptions
//   POST /batch-module-area-transfers                            → payload CreateBatchModuleAreaTransferRequest → data: BatchDetail
//   GET  /batch-module-area-transfers/last                       → data: TransferBatchGrazingAreaLast | null (reuso SEM alteração, LF-03)
//   GET  /batch-module-area-transfers/check-date                 → data: CheckBatchModuleAreaTransferDateResult
//
// `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id` pelo interceptor genérico
// (`@/services/api.ts`) — nunca manipulado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchModuleAreaTransferListEnvelope,
  BatchModuleAreaTransferListItem,
  BatchModuleAreaTransferOptions,
  CheckBatchModuleAreaTransferDateParams,
  CheckBatchModuleAreaTransferDateResult,
  CreateBatchModuleAreaTransferRequest,
} from '@/@types/v2/LoteModuloArea/batchModuleAreaTransfer';
import type {
  BatchDetail,
  TransferBatchGrazingAreaLast,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

// `batch_uuid` opcional — filtro único da listagem (`## 4.1` do contrato de
// tela, S-FORM-FILTER).
export interface ListBatchModuleAreaTransfersParams extends PaginationQueryParams {
  batch_uuid?: string;
}

// Adapta o envelope paginado REAL do backend (`ApiResponse::paginated`, `meta`
// populado) para `ResponsePagination` — mirror `listTransferBatchFarms`
// (paginação de verdade), NÃO o adapter de página-única (`listBatchOptions`).
async function listBatchModuleAreaTransfers(
  params: ListBatchModuleAreaTransfersParams
): Promise<ResponsePagination<BatchModuleAreaTransferListItem[]>> {
  const { data } = await api.V2.get<BatchModuleAreaTransferListEnvelope>(
    '/batch-module-area-transfers',
    {
      page: params.page,
      per_page: params.per_page,
      batch_uuid: params.batch_uuid || undefined,
    }
  );

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

// GET create-options?batch_uuid= — contexto para uma nova transferência
// (mirror `edit()` do legado). `batchUuid` vem da rota (`:batchUuid`).
async function getBatchModuleAreaTransferOptions(
  batchUuid: string
): Promise<Response<BatchModuleAreaTransferOptions>> {
  const { data } = await api.V2.get<Response<BatchModuleAreaTransferOptions>>(
    '/batch-module-area-transfers/create-options',
    { batch_uuid: batchUuid }
  );
  return data;
}

// POST batch-module-area-transfers — payload NUNCA inclui code/batch/qtd/area/
// employee_uuid/tenant_id/farm_id/user_id (contrato de API §4.3/§4.4).
async function createBatchModuleAreaTransfer(
  payload: CreateBatchModuleAreaTransferRequest
): Promise<Response<BatchDetail>> {
  const { data } = await api.V2.post<Response<BatchDetail>>(
    '/batch-module-area-transfers',
    payload
  );
  return data;
}

// GET /batch-module-area-transfers/last — reusa `TransferBatchGrazingAreaLast`
// de `LoteFazenda` SEM alteração (contrato de API §4.5b, "reuso direto"). Função
// exposta para paridade de contrato — SEM UI consumidora nesta feature (ver
// `F-023-lote-modulo-area-frontend-contract.md ## 2`, linha S-ENDPOINT-API-LAST).
async function getLastBatchModuleAreaTransfer(): Promise<
  Response<TransferBatchGrazingAreaLast | null>
> {
  const { data } = await api.V2.get<Response<TransferBatchGrazingAreaLast | null>>(
    '/batch-module-area-transfers/last'
  );
  return data;
}

// GET check-date — auxiliar de cascata (mirror `CheckDatesController` do
// domínio), consumido por `TASK-LMA-FE-04`.
async function checkBatchModuleAreaTransferDate(
  params: CheckBatchModuleAreaTransferDateParams
): Promise<Response<CheckBatchModuleAreaTransferDateResult>> {
  const { data } = await api.V2.get<Response<CheckBatchModuleAreaTransferDateResult>>(
    '/batch-module-area-transfers/check-date',
    params
  );
  return data;
}

export {
  checkBatchModuleAreaTransferDate,
  createBatchModuleAreaTransfer,
  getBatchModuleAreaTransferOptions,
  getLastBatchModuleAreaTransfer,
  listBatchModuleAreaTransfers,
};
