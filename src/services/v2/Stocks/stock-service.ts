// src/services/v2/Stocks/stock-service.ts
// -----------------------------------------------------------------------------
// Stock Service — API v1 do backend Laravel GB.Cerne. Reúne duas frentes na
// mesma tabela `stocks`:
//
//   • Saldo de Estoque (Stock-contrato.md, 100% LEITURA — index/detail/report/
//     export) + Consolidação/"Agrupar" (StockConsolidation).
//       GET /stocks (paginado), /stocks/detail, /stocks/report, /stocks/export,
//       GET|POST /stock-consolidations.
//
//   • Disponibilidade por armazém (GAP-BE-600/TASK-BE-1000, aba Insumos/Produção
//     do Apontamento) — lista FLAT adaptada para o `SelectAsyncPaginate`.
//       GET /stocks/available?warehouse_uuid=&search=&product_uuid=&allow_pointing=
//
// NOTA DE MERGE (execução 034 × Saldo Estoque): a disponibilidade era
// `GET /stocks` e colidia com o `GET /stocks` do Saldo Estoque. Por decisão do
// dono, o Saldo Estoque manteve `GET /stocks`; a disponibilidade passou a
// `GET /stocks/available` (backend: `StockController::available`). A Insumos
// envia `allow_pointing=1` explicitamente; a Produção nunca envia (mirror do
// legado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  StockAvailabilityItem,
  StockAvailabilityListEnvelope,
  StockConsolidationPreviewItem,
  StockConsolidationResult,
  StockDetail,
  StockListItem,
  StocksListEnvelope,
} from '@/@types/v2/Stocks';

// ============================================
// DISPONIBILIDADE POR ARMAZÉM — GET /stocks/available (Apontamento)
// ============================================

// `extends PaginationQueryParams` mirror `ListWarehouseOptionsParams` — o
// `SelectAsyncPaginate` injeta `page`/`per_page` em toda chamada de `service`,
// mesmo quando o endpoint (FLAT/sem paginação) os ignora.
export interface ListStockAvailabilityParams extends PaginationQueryParams {
  warehouse_uuid?: string;
  search?: string;
  /** TASK-FE-645 (GAP-BE-632) — filtro exato ADITIVO, opcional. Só a aba
   *  Produção envia; Insumos filtra por `search`. SEM `allow_pointing`. */
  product_uuid?: string;
  /** GAP-BE-632 (opção b) — three-state (ausente = SEM filtro no servidor). A
   *  Insumos ENVIA `true` (mirror `_product.blade.php`); a Produção NUNCA
   *  envia (mirror `_production.blade.php`) — omitir a prop para não filtrar. */
  allow_pointing?: boolean;
  /** TASK-BE-1076/TASK-FE-2778 (FID-057-04/05) — filtro semântico
   *  OPCIONAL/ADITIVO, mirror `?protocol=true` do legado (`Api\
   *  StockController::index()`, trio group 15/cat 28/kinds). Só o
   *  subcadastro de itens do Protocolo/Estação envia; demais consumidores
   *  deste endpoint (Insumos/Produção do Apontamento) NÃO enviam — omitir a
   *  prop para não filtrar. */
  protocol?: boolean;
}

// Adaptador FLAT → `ResponsePagination` (1 única "página") compartilhado por
// `/stocks/available` e `/stocks/available-options` (mesmo Resource/params).
async function fetchStockAvailability(
  endpoint: '/stocks/available' | '/stocks/available-options',
  params: ListStockAvailabilityParams
): Promise<ResponsePagination<StockAvailabilityItem[]>> {
  const { data } = await api.V2.get<StockAvailabilityListEnvelope>(endpoint, {
    warehouse_uuid: params.warehouse_uuid,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    allow_pointing: params.allow_pointing ?? undefined,
    protocol: params.protocol ?? undefined,
  });

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

async function listStockAvailability(
  params: ListStockAvailabilityParams
): Promise<ResponsePagination<StockAvailabilityItem[]>> {
  return fetchStockAvailability('/stocks/available', params);
}

// GET /stocks/available-options (execução 086, API-04) — MESMOS params e
// Resource de `/stocks/available` (`warehouse_uuid` obrigatório), mas gateado
// pelo CONSUMIDOR (`service-orders_create|service-orders_edit`), não por
// `stocks_view`: o solicitante da OS não precisa enxergar o Saldo de Estoque.
// Consumido pelas abas Insumos/Produção do form de Ordem de Serviço.
async function listStockAvailableOptions(
  params: ListStockAvailabilityParams
): Promise<ResponsePagination<StockAvailabilityItem[]>> {
  return fetchStockAvailability('/stocks/available-options', params);
}

// ============================================
// SALDO DE ESTOQUE (leitura) — GET /stocks
// ============================================

export interface ListStocksParams extends PaginationQueryParams {
  search?: string;
  product_uuid?: string;
  warehouse_uuid?: string;
}

async function listStocks(params: ListStocksParams): Promise<ResponsePagination<StockListItem[]>> {
  const { data } = await api.V2.get<StocksListEnvelope>('/stocks', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    product_uuid: params.product_uuid || undefined,
    warehouse_uuid: params.warehouse_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listWarehouses`/`listProducts` (meta REAL, não fallback fake).
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

// ============================================
// DETALHE AGRUPADO (TASK-STK-FE-02) — GET /stocks/detail
// ============================================

export interface GetStockDetailParams {
  product_uuid: string;
  warehouse_uuid: string;
}

async function getStockDetail(params: GetStockDetailParams): Promise<Response<StockDetail>> {
  const { data } = await api.V2.get<Response<StockDetail>>('/stocks/detail', params);
  return data;
}

// ============================================
// RELATÓRIO/EXPORT (TASK-STK-FE-03) — GET /stocks/report (PDF) e
// GET /stocks/export (XLSX). Mesmos filtros de `index`/`listStocks`, SEM
// paginação (`Stock-contrato.md ## 4.5`).
// ============================================

export interface ExportStocksParams {
  search?: string;
  product_uuid?: string;
  warehouse_uuid?: string;
}

async function exportStocksReport(params: ExportStocksParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stocks/report',
    {
      search: params.search || undefined,
      product_uuid: params.product_uuid || undefined,
      warehouse_uuid: params.warehouse_uuid || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function exportStocks(params: ExportStocksParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stocks/export',
    {
      search: params.search || undefined,
      product_uuid: params.product_uuid || undefined,
      warehouse_uuid: params.warehouse_uuid || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

// ============================================
// CONSOLIDAÇÃO / "AGRUPAR" (TASK-STK-FE-04) — GET/POST /stock-consolidations
// (domínio StockConsolidation, `GroupProduct-contrato.md §4`). Permissão real
// `groupproducts_view`(GET)/`groupproducts_create`(POST). A prévia envia
// `correct_stock_uuid = stock_uuids[0]` como PLACEHOLDER (valor real só no POST).
// ============================================

export interface PreviewStockConsolidationParams {
  stock_uuids: string[];
  correct_stock_uuid: string; // placeholder = stock_uuids[0] na prévia; valor real só no POST
}

async function previewStockConsolidation(
  params: PreviewStockConsolidationParams
): Promise<Response<StockConsolidationPreviewItem[]>> {
  const { data } = await api.V2.get<Response<StockConsolidationPreviewItem[]>>(
    '/stock-consolidations',
    params
  );
  return data;
}

export interface ConsolidateStocksPayload {
  stock_uuids: string[];
  correct_stock_uuid: string;
}

async function consolidateStocks(
  payload: ConsolidateStocksPayload
): Promise<Response<StockConsolidationResult>> {
  const { data } = await api.V2.post<Response<StockConsolidationResult>>(
    '/stock-consolidations',
    payload
  );
  return data;
}

export {
  consolidateStocks,
  exportStocks,
  exportStocksReport,
  getStockDetail,
  listStockAvailability,
  listStockAvailableOptions,
  listStocks,
  previewStockConsolidation,
};
