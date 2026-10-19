// src/services/v2/WarehouseTransfers/warehouse-transfer-service.ts
// -----------------------------------------------------------------------------
// WarehouseTransfer Service — API v1 do backend Laravel GB.Cerne
// (Trans. Armazém — Estoque, escrita, TASK-WT-FE-01). Fachada CRUD completa
// sobre `StockMovement` (`WarehouseTransfer-contrato.md`, APROVADO 100%,
// Ciclo 3). Mirror exato de `food-beat-service.ts` (adaptador de envelope
// paginado → `ResponsePagination`, idêntico a `listWarehouses`/`listStocks`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /warehouse-transfers          → data: WarehouseTransferListItem[],
//                                           meta paginação REAL (filtros
//                                           product_uuid/warehouse_uuid[DESTINO]/
//                                           date_from/date_to)
//   GET    /warehouse-transfers/{uuid}   → data: WarehouseTransferListItem
//                                           (MESMO Resource do índice)
//   POST   /warehouse-transfers          → payload CreateWarehouseTransferPayload
//                                           (lote, items[]) → data:
//                                           WarehouseTransferListItem[]
//                                           (ARRAY das linhas criadas — o
//                                           Controller devolve
//                                           `WarehouseTransferResource::collection`,
//                                           NUNCA um objeto único)
//   PUT/PATCH /warehouse-transfers/{uuid} → payload UpdateWarehouseTransferPayload
//                                           (1 linha, full-resource)
//   DELETE /warehouse-transfers/{uuid}   → 204, sem body
//
// **Nenhum service novo de apoio criado** (`DA-WT-09`, zero endpoint novo) —
// os lookups do formulário são cobertos por serviços JÁ EXISTENTES, reusados
// aqui só na documentação, NÃO reimportados por este arquivo (o consumo real
// acontece nas telas de TASK-WT-FE-02/03/04):
//   - `listWarehouses`/`listWarehouseOptions`
//     (`@/services/v2/Warehouses/warehouse-service`) — Select "Armazém
//     (origem)" (filtro client-side, `DA-WT-12`) e "Armazém Destino".
//   - `listStocks` (`@/services/v2/Stocks/stock-service`) — Select
//     "Produto"/estoque de origem. **É ESTA função, NÃO
//     `listStockAvailability`**: `StockListItem` tem `uuid`/`average_cost`/
//     `quantity`/`info`, exatamente o que `items[].stock_uuid` precisa;
//     `listStockAvailability` (`GET /stocks/available`) serve outro
//     consumidor (Apontamento) e não expõe `uuid` nem `average_cost`
//     (confirmado por leitura do tipo `StockAvailabilityItem`).
//   - `listCostCenterOptions` (`@/services/v2/CostCenters/cost-center-service`)
//     — Select "Centro de Custo". **NÃO** `listGlobalCostCenterOptions`, que
//     serve o fluxo pré-tenant de criação de Fazenda; `/cost-centers/options`
//     já aplica `CostCenterTenantScope` por padrão (mesma réplica manual que
//     `WarehouseTransferRequest` faz para a validação server-side).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateWarehouseTransferPayload,
  UpdateWarehouseTransferPayload,
  WarehouseTransferListItem,
  WarehouseTransfersListEnvelope,
} from '@/@types/v2/WarehouseTransfers';

// Params aceitos pela listagem — paginação real + filtros confirmados em
// `WarehouseTransferFilterData.php`. ⚠️ `warehouse_uuid` filtra DESTINO, não
// origem (achado de leitura direta, ver `@/@types/v2/WarehouseTransfers`).
export interface ListWarehouseTransfersParams extends PaginationQueryParams {
  product_uuid?: string;
  warehouse_uuid?: string;
  date_from?: string;
  date_to?: string;
}

async function listWarehouseTransfers(
  params: ListWarehouseTransfersParams
): Promise<ResponsePagination<WarehouseTransferListItem[]>> {
  const { data } = await api.V2.get<WarehouseTransfersListEnvelope>('/warehouse-transfers', {
    page: params.page,
    per_page: params.per_page,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listFoodBeats`/`listStocks`/`listWarehouses` (meta REAL,
  // nunca fabricada).
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

// GET /warehouse-transfers/{uuid} — MESMO Resource do índice (granularidade
// por item, `DA-WT-04`).
async function getWarehouseTransfer(warehouseTransferUuid: string) {
  const { data } = await api.V2.get<Response<WarehouseTransferListItem>>(
    `/warehouse-transfers/${warehouseTransferUuid}`
  );
  return data;
}

// POST /warehouse-transfers — lote (items[], N produtos, 1
// destination_warehouse_uuid compartilhado). `data` da resposta é um ARRAY
// (WarehouseTransferResource::collection), NÃO um objeto único.
async function createWarehouseTransfer(payload: CreateWarehouseTransferPayload) {
  const { data } = await api.V2.post<Response<WarehouseTransferListItem[]>>(
    '/warehouse-transfers',
    payload
  );
  return data;
}

// PUT/PATCH /warehouse-transfers/{uuid} — 1 linha, full-resource (nunca
// delta parcial).
async function updateWarehouseTransfer(
  warehouseTransferUuid: string,
  payload: UpdateWarehouseTransferPayload
) {
  const { data } = await api.V2.put<Response<WarehouseTransferListItem>>(
    `/warehouse-transfers/${warehouseTransferUuid}`,
    payload
  );
  return data;
}

// DELETE /warehouse-transfers/{uuid} — exclui UMA linha (reverte o ajuste de
// saldo no servidor).
async function deleteWarehouseTransfer(warehouseTransferUuid: string) {
  await api.V2.delete(`/warehouse-transfers/${warehouseTransferUuid}`);
}

export {
  createWarehouseTransfer,
  deleteWarehouseTransfer,
  getWarehouseTransfer,
  listWarehouseTransfers,
  updateWarehouseTransfer,
};
