// src/services/v2/Nutritions/nutrition-lookup-service.ts
// -----------------------------------------------------------------------------
// Nutrition Lookup Service — 6 endpoints de apoio ao formulário de Nutrição
// (`DA-NT-05`, `Nutrition-contrato.md §1/§3.2`), TASK-NT-FE-01. Mirror
// estrutural dos 6 lookups de `bull-seed-season-service.ts` — Collection
// PLANA no Repository (SEM paginação/`meta`): `Select` + `useQuery`, NUNCA
// `SelectAsyncPaginate`.
//
// Sub-rotas de `/api/v1/nutritions/lookups/*` — Sanctum + permissão
// (`nutrition_create|nutrition_edit`) + `farm.context`, **SEM `farmId` na
// URL** (o header `X-Farm-Id` já propaga via interceptor
// `get_spa_api_client_pattern`, farm sempre de `$request->currentFarm`).
// Fail-safe do backend: farm válida mas sem dado → `data: []` (nunca erro).
//
// Nutrição mantém lookups PRÓPRIOS (`DA-NT-05`, decisão do Arquiteto de API)
// — NÃO reusar `product-service`/`warehouse-service` genéricos para estes 6
// endpoints (eles não expõem o filtro `category=NUTRITION`/
// `group_id in [8,18]`/estoque `quantity>0` por armazém+produto que estas
// rotas replicam). Serviços de `Trough`/`CostCenter`/`Area`/`Grazing`/
// `Employee`/`Function`/`Provider` já migrados podem ser reusados pelas
// Tarefas de UI seguintes para os campos COMUNS do formulário (cabeçalho/
// cost_center/area/grazing/executor) — nenhum deles é um dos 6 lookups
// próprios desta Tarefa.
//
//   GET /nutritions/lookups/warehouses                              → WarehouseLookupItem[]
//   GET /nutritions/lookups/products                                → ProductLookupItem[]
//   GET /nutritions/lookups/products-by-warehouse/{warehouse:uuid}  → ProductLookupItem[]
//   GET /nutritions/lookups/warehouses-by-product/{product:uuid}    → WarehouseLookupItem[]
//   GET /nutritions/lookups/warehouse-stock/{warehouse:uuid}/{product:uuid} → WarehouseStockLookup (objeto único)
//   GET /nutritions/lookups/troughs                                 → TroughLookupItem[] (area_uuid/grazing_uuid opcionais)
//   GET /nutritions/lookups/batches?search=                         → BatchLookupItem[] (só lotes ativos da fazenda ativa)
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  BatchLookupItem,
  ProductLookupItem,
  TroughLookupItem,
  WarehouseLookupItem,
  WarehouseStockLookup,
} from '@/@types/v2/Nutritions';

// `LK-01` — farm_id=currentFarm, is_active=true.
async function getWarehouses(): Promise<WarehouseLookupItem[]> {
  const { data } = await api.V2.get<Response<WarehouseLookupItem[]>>(
    '/nutritions/lookups/warehouses'
  );
  return data.data ?? [];
}

// `LK-02` — category=NUTRITION, join measurements, tenant_id real (legado já
// usava tenant aqui, preservado).
async function getProducts(): Promise<ProductLookupItem[]> {
  const { data } = await api.V2.get<Response<ProductLookupItem[]>>('/nutritions/lookups/products');
  return data.data ?? [];
}

// `LK-03` — category NUTRITION OR group_id in [8,18], stocks.warehouse_id,
// quantity>0, + farm. Usado quando a linha do item TEM armazém selecionado.
async function getProductsByWarehouse(warehouseUuid: string): Promise<ProductLookupItem[]> {
  const { data } = await api.V2.get<Response<ProductLookupItem[]>>(
    `/nutritions/lookups/products-by-warehouse/${warehouseUuid}`
  );
  return data.data ?? [];
}

// `LK-04` — stocks.farm/product, warehouses.is_active, farm de
// `currentFarm` (não mais 2 params de URL como no legado).
async function getWarehousesByProduct(productUuid: string): Promise<WarehouseLookupItem[]> {
  const { data } = await api.V2.get<Response<WarehouseLookupItem[]>>(
    `/nutritions/lookups/warehouses-by-product/${productUuid}`
  );
  return data.data ?? [];
}

// `LK-05` — autofill do "Estoque"/unidade do item (`FLD-07`/`FLD-08`,
// `DA-NT-04`: qnt_stock é DISPLAY-ONLY, nunca persistido). Objeto ÚNICO
// (não array) — dispara ao trocar armazém OU produto.
async function getWarehouseStock(
  warehouseUuid: string,
  productUuid: string
): Promise<WarehouseStockLookup | null> {
  const { data } = await api.V2.get<Response<WarehouseStockLookup>>(
    `/nutritions/lookups/warehouse-stock/${warehouseUuid}/${productUuid}`
  );
  return data.data ?? null;
}

// `LK-06` — farm_id obrigatório (currentFarm), area_id/grazing_id opcionais
// (cascata do card de item — `FLD-10`/`FLD-11`).
export interface GetTroughsParams {
  area_uuid?: string;
  grazing_uuid?: string;
}

async function getTroughs(params: GetTroughsParams = {}): Promise<TroughLookupItem[]> {
  const { data } = await api.V2.get<Response<TroughLookupItem[]>>('/nutritions/lookups/troughs', {
    area_uuid: params.area_uuid || undefined,
    grazing_uuid: params.grazing_uuid || undefined,
  });
  return data.data ?? [];
}

// Lotes ATIVOS da fazenda ativa (farm via `X-Farm-Id` do client) — substitui
// `/batches/options`, que listava lotes de outras fazendas para perfis de
// plataforma e gerava 422 no servidor. `search` opcional (server-side).
async function getBatches(search?: string): Promise<BatchLookupItem[]> {
  const { data } = await api.V2.get<Response<BatchLookupItem[]>>('/nutritions/lookups/batches', {
    search: search || undefined,
  });
  return data.data ?? [];
}

export {
  getBatches,
  getProducts,
  getProductsByWarehouse,
  getTroughs,
  getWarehouses,
  getWarehousesByProduct,
  getWarehouseStock,
};
