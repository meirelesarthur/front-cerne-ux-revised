// src/services/v2/FarmTransfers/farm-transfer-service.ts
// -----------------------------------------------------------------------------
// FarmTransfer Service — API v1 do backend Laravel GB.Cerne (Trans.
// Fazendas — Estoque, escrita, Tarefas 01/02/03). Mirror exato de
// `warehouse-transfer-service.ts` (adaptador de envelope paginado →
// `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /farm-transfers          → data: FarmTransferListItem[], meta
//                                      paginação REAL (filtros
//                                      product_uuid/warehouse_uuid[DESTINO]/
//                                      date_from/date_to)
//   GET    /farm-transfers/{uuid}   → data: FarmTransferListItem (MESMO
//                                      Resource do índice)
//   POST   /farm-transfers          → payload CreateFarmTransferPayload
//                                      (lote, items[] + financeiro
//                                      opcional) → data:
//                                      FarmTransferListItem[] (ARRAY das
//                                      linhas criadas — o Controller devolve
//                                      `FarmTransferResource::collection`,
//                                      NUNCA um objeto único)
//   DELETE /farm-transfers/{uuid}   → 204, sem body
//
// Nenhum service novo de apoio criado — os lookups do formulário reusam
// serviços JÁ EXISTENTES (`listStocks`, `listWarehouseOptions` com
// `farm_uuid` — extensão aditiva da Tarefa 02 —, `listCostCenterOptions`,
// `listFinancialCategoryOptions`, `useMyFarms()`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateFarmTransferPayload,
  FarmTransferListItem,
  FarmTransfersListEnvelope,
} from '@/@types/v2/FarmTransfers';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `FarmTransferFilterData.php`. ⚠️ `warehouse_uuid` filtra DESTINO, não
// origem (confirmado por leitura direta de
// `StockMovementRepository::listPaginatedBetweenFarms()`, ver
// `@/@types/v2/FarmTransfers`).
export interface ListFarmTransfersParams extends PaginationQueryParams {
  product_uuid?: string;
  warehouse_uuid?: string;
  date_from?: string;
  date_to?: string;
}

async function listFarmTransfers(
  params: ListFarmTransfersParams
): Promise<ResponsePagination<FarmTransferListItem[]>> {
  const { data } = await api.V2.get<FarmTransfersListEnvelope>('/farm-transfers', {
    page: params.page,
    per_page: params.per_page,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listWarehouseTransfers`/`listStocks`/`listWarehouses`.
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

// GET /farm-transfers/{uuid} — MESMO Resource do índice (granularidade por
// item, mirror `DA-WT-04`).
async function getFarmTransfer(farmTransferUuid: string) {
  const { data } = await api.V2.get<Response<FarmTransferListItem>>(
    `/farm-transfers/${farmTransferUuid}`
  );
  return data;
}

// POST /farm-transfers — lote (items[] + financeiro opcional). `data` da
// resposta é um ARRAY (`FarmTransferResource::collection`), NÃO um objeto
// único.
async function createFarmTransfer(payload: CreateFarmTransferPayload) {
  const { data } = await api.V2.post<Response<FarmTransferListItem[]>>('/farm-transfers', payload);
  return data;
}

// DELETE /farm-transfers/{uuid} — exclui UMA linha (reverte o ajuste de
// saldo origem/destino no servidor, `DestroyFarmTransferAction`).
async function deleteFarmTransfer(farmTransferUuid: string) {
  await api.V2.delete(`/farm-transfers/${farmTransferUuid}`);
}

// `GET /farm-transfers/next-code` foi REMOVIDO (97-Esteiras/002,
// `GAP-RS-10`): a prévia do próximo `code` agora é calculada no Front a
// partir da própria `listFarmTransfers({ page: 1, per_page: 1 })` — sem
// consumidor restante para o endpoint dedicado.

export { createFarmTransfer, deleteFarmTransfer, getFarmTransfer, listFarmTransfers };
