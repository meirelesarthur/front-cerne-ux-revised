// src/services/v2/Sanitary/sanitary-service.ts
// -----------------------------------------------------------------------------
// Sanitary Service — API v1 do backend Laravel GB.Cerne (bloco "Item
// Sanitário", Onda 2, 97-Esteiras/039, TASK-FE-039-PROCFID-03). 4 lookups
// AJAX dedicados (`SanitaryController`, `db-api-plan-proc-fidelidade-
// sanitaria-rework.md §3.6`) que alimentam a cascata BIDIRECIONAL
// produto↔armazém do bloco "Item Sanitário"
// (`ProcessingSanitarySection.tsx`/`ProcessingSanitaryItemRow.tsx`,
// PROCFID-04) — mirror estrutural de `product-service.ts`/
// `warehouse-service.ts`/`measurement-service.ts`, reaproveitando os MESMOS
// tipos de opção (`ProductOption`/`WarehouseOption`/`MeasurementOption`),
// sem duplicar Resource.
//
// `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id` pelo interceptor
// genérico (`@/services/api.ts`) — nunca manipulado aqui; `farm_id` NUNCA vai
// no path/query (correção P0 já aplicada no backend, o legado
// `RT-014..017` aceitava `farmId` cru na URL).
//
// `listSanitaryProductsByWarehouse`/`listSanitaryWarehousesByProduct` adaptam
// o envelope FLAT (`ApiResponse::success`, sem paginação real — mesmo
// racional de `listWarehouseOptions`/`listMeasurementOptions`) para
// `ResponsePagination` (1 página só, `total=data.length`) — contrato exigido
// por `SelectAsyncPaginate.service`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { ProductOption } from '@/@types/v2/Products';
import type { SanitaryStockBalance } from '@/@types/v2/Sanitary';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

// GET /sanitary/products-by-warehouse/{warehouseUuid} — produtos com saldo
// > 0 no armazém informado (tenant-scoped). Consumido pelo Select de Produto
// da linha do item sanitário quando o Armazém já está selecionado (cascata
// armazém→produto).
async function listSanitaryProductsByWarehouse(
  warehouseUuid: string
): Promise<ResponsePagination<ProductOption[]>> {
  const { data } = await api.V2.get<Response<ProductOption[]>>(
    `/sanitary/products-by-warehouse/${warehouseUuid}`
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// GET /sanitary/warehouses-by-product/{productUuid} — cascata invertida
// (produto→armazém), mesmo racional acima.
async function listSanitaryWarehousesByProduct(
  productUuid: string
): Promise<ResponsePagination<WarehouseOption[]>> {
  const { data } = await api.V2.get<Response<WarehouseOption[]>>(
    `/sanitary/warehouses-by-product/${productUuid}`
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// GET /sanitary/warehouse-stock/{warehouseUuid}/{productUuid} — saldo bruto
// (`InputReadOnly(Estoque)`), disparado quando Armazém E Produto já estão
// selecionados na linha.
async function getSanitaryWarehouseStock(
  warehouseUuid: string,
  productUuid: string
): Promise<Response<SanitaryStockBalance>> {
  const { data } = await api.V2.get<Response<SanitaryStockBalance>>(
    `/sanitary/warehouse-stock/${warehouseUuid}/${productUuid}`
  );
  return data;
}

// GET /sanitary/measurements/{productUuid} — unidade principal + secundária
// do produto (`Product.measurement`/`Product.secondMeasurement`), popula o
// Select "Un.Medida" da linha ao trocar o Produto.
async function listSanitaryMeasurements(
  productUuid: string
): Promise<Response<MeasurementOption[]>> {
  const { data } = await api.V2.get<Response<MeasurementOption[]>>(
    `/sanitary/measurements/${productUuid}`
  );
  return data;
}

export {
  getSanitaryWarehouseStock,
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
  listSanitaryWarehousesByProduct,
};
