// src/@types/v2/Sanitary/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do bloco "Item Sanitário" (Sanitary — Onda 2, 97-Esteiras/039,
// TASK-FE-039-PROCFID-03). Só o que NÃO existe em Products/Warehouses/
// Measurements — os 3 catálogos de opção (`ProductOption`/`WarehouseOption`/
// `MeasurementOption`) são REUTILIZADOS como estão: os 4 endpoints AJAX de
// `SanitaryController` (`db-api-plan-proc-fidelidade-sanitaria-rework.md
// §3.6`) reusam os MESMOS Resources já publicados por esses 3 módulos
// (confirmado pelo Arquiteto de API: "reusar WarehouseOptionResource
// existente") — não duplicar tipo de opção só porque o endpoint é novo.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /sanitary/products-by-warehouse/{warehouseUuid}         → data: ProductOption[]
//   GET /sanitary/warehouses-by-product/{productUuid}           → data: WarehouseOption[]
//   GET /sanitary/warehouse-stock/{warehouseUuid}/{productUuid} → data: SanitaryStockBalance
//   GET /sanitary/measurements/{productUuid}                    → data: MeasurementOption[]
// Gate `processing_create` + `farm.context` — `X-Farm-Id` injetado pelo
// interceptor global, NUNCA composto no path/query (correção P0 já aplicada
// no backend, o legado `RT-014..017` aceitava `farmId` cru na URL).
// -----------------------------------------------------------------------------

export interface SanitaryStockBalance {
  /** Saldo bruto do produto no armazém, unidade principal (`StockRepositoryInterface::findByProductAndWarehouse`). */
  quantity: number;
}
