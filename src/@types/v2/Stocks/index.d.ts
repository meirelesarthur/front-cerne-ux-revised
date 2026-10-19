// src/@types/v2/Stocks/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de SALDO DE ESTOQUE (Stock) — API v1 do backend Laravel
// GB.Cerne. Fundação de dados (TASK-STK-FE-01), consumida também por
// TASK-STK-FE-02 (Detalhe) e TASK-STK-FE-03 (Relatório/Export).
//
// Contrato: Stock-contrato.md (APROVADO, v1.0, Ciclo 3) — módulo 100%
// LEITURA, sem CRUD (nunca existiu no legado). "Agrupar" é o domínio
// StockConsolidation (`GroupProduct-contrato.md §4`, `✅ CONCLUÍDO`), fora
// deste tipo/módulo.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /stocks         → data: StockListItem[] + meta (paginação, per_page
//                          default 15, teto 100 — `StockIndexRequest`)
//   GET /stocks/detail   → data: StockDetailResource (agrupado por
//                          product_uuid+warehouse_uuid) — tipos em
//                          TASK-STK-FE-02
//   GET /stocks/report   → PDF (blob) — TASK-STK-FE-03
//   GET /stocks/export   → XLSX (blob) — TASK-STK-FE-03
//
// `StockBalanceResource` (backend) — Resource renomeado (`GAP-STK-02`) para
// não colidir com `App\Http\Resources\V1\StockResource` já em produção
// (StockConsolidation). Shape idêntico ao especificado originalmente.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

// ============================================
// REFS ANINHADAS (mirror shape enxuto de outros módulos — uuid+poucos campos)
// ============================================

export interface StockProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface StockWarehouseRef {
  uuid: string;
  initials: string;
  description: string;
}

// ============================================
// STOCK (resposta da API — StockBalanceResource, Stock-contrato.md §4.6)
// ============================================

export interface StockListItem {
  uuid: string;
  product: StockProductRef;
  warehouse: StockWarehouseRef;
  quantity: number;
  unit: string;
  provider_lot: string | null;
  lot: string | null;
  expiration_date: string | null;
  average_cost: number;
  total: number;
  /** Campo PRONTO do Resource (`Stock::getInfoAttribute()`, regra de negócio
   *  3 do legado) — exibir direto na grid, NUNCA recalcular no front. */
  info: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror
// WarehousesApiPaginationMeta/OpeningBalancesApiPaginationMeta
// ============================================

export interface StocksApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface StocksListEnvelope {
  success: boolean;
  message: string;
  data: StockListItem[];
  errors: Record<string, string[]> | null;
  meta: StocksApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Stock-contrato.md §6.A — ordem search → product
// → warehouse; par uuid+label, mirror OpeningBalanceFilterForm)
// ============================================

export interface StockFilterForm {
  search?: string;
  product_uuid?: string;
  /** Display-only — re-hidrata o drawer, NUNCA enviado à API. */
  product_label?: string;
  warehouse_uuid?: string;
  /** Display-only — re-hidrata o drawer, NUNCA enviado à API. */
  warehouse_label?: string;
}

// ============================================
// DETALHE AGRUPADO (TASK-STK-FE-02) — GET /stocks/detail?product_uuid=&
// warehouse_uuid= (`StockDetailResource`, `Stock-contrato.md ## 4.6`,
// `DA-STK-04`). Agrupa por (product_uuid, warehouse_uuid): soma
// quantity/total + lista de lotes + endereçamento do produto.
// ============================================

export interface StockLot {
  uuid: string;
  provider_lot: string | null;
  lot: string | null;
  expiration_date: string | null;
  quantity: number;
  average_cost: number;
  total: number;
}

// Shape REAL do backend (`AddressingResource`, confirmado por leitura direta
// de `app/Http/Resources/V1/StockDetailResource.php`/`AddressingResource.php`
// no fork `GB.Cerne.Api`) — diverge do exemplo `{ uuid, path: [...] }` citado
// em `Stock-contrato.md ## 4.6` (documentação desatualizada em relação ao
// código já `✅ CONCLUÍDO`/testado; não é decisão desta Tarefa alterar a API).
// `AddressingResource` só expõe `parent`/`children` quando a relação foi
// eager-loaded — `StockRepository::getGroupedDetail()` carrega apenas
// `product.addressing` (1 nível, sem `parent` em cadeia), então nenhuma
// hierarquia chega à SPA nesta tela. Exibição: `description`/`type_label`
// direto (mesmo padrão já usado por `ProdutoDetalhe.tsx`), sem breadcrumb.
export interface StockAddressingSummary {
  uuid: string;
  description: string;
  type: string;
  type_label: string;
}

export interface StockDetail {
  product: StockProductRef;
  warehouse: StockWarehouseRef;
  quantity: number;
  total: number;
  lots: StockLot[];
  addressing: StockAddressingSummary | null;
}

// ============================================
// CONSOLIDAÇÃO / "AGRUPAR" (TASK-STK-FE-04) — GET/POST
// /stock-consolidations (domínio StockConsolidation, backend já
// `✅ CONCLUÍDO`, `GroupProduct-contrato.md §4`). Permissão real
// `groupproducts_view`(GET)/`groupproducts_create`(POST) — NÃO
// `stocks_view` nem `stock_consolidations_*` (ver ficha TASK-STK-FE-04).
//
// A prévia (`GET`) e a execução (`POST`) compartilham o mesmo
// `StockConsolidationRequest` no backend, que valida `correct_stock_uuid`
// ∈ `stock_uuids` mesmo na prévia — por isso a prévia envia
// `correct_stock_uuid = stock_uuids[0]` como placeholder (o valor REAL só
// importa no `POST`, escolhido no modal). Ver ficha, Leitura do dev #2.
// ============================================

// StockResource (StockConsolidation) — shape PRÓPRIO, DIFERENTE de
// StockListItem: sem `unit`, `product`/`warehouse` são STRINGS (description),
// não objetos com uuid (`app/Http/Resources/V1/StockResource.php`,
// `GroupProduct-contrato.md §4.2`). Ver ficha, Leitura do dev #7.
export interface StockConsolidationPreviewItem {
  uuid: string;
  product: string;
  warehouse: string;
  quantity: number;
  lot: string | null;
  provider_lot: string | null;
  expiration_date: string | null;
}

// Mesma linha, mesclada com o `unit` já conhecido do `StockListItem` da grid
// (a API de consolidação NÃO devolve `unit`) — tipo usado só dentro do modal.
export interface StockConsolidationPreviewRow extends StockConsolidationPreviewItem {
  unit: string;
}

export interface StockConsolidationHistoryItem {
  uuid: string;
  origin_stock_uuid: string;
  correct_stock_uuid: string;
  quantity_moved: number;
  moved_by: { uuid: string; name: string } | null;
  created_at: string;
}

export interface StockConsolidationResult {
  stock: StockConsolidationPreviewItem;
  history: StockConsolidationHistoryItem[];
}

// -----------------------------------------------------------------------------
// Disponibilidade por armazém (GAP-BE-600, TASK-BE-1000) — lookup FLAT da aba
// Insumos/Produção de Apontamento (`StockController::available`,
// `StockAvailabilityResource`). Não é o módulo Stock completo (CRUD).
// Endpoint: GET /api/v1/stocks/available (renomeado de /stocks na reconciliação
// de merge com o Saldo Estoque; `meta` sempre null, FLAT sem paginação).
// -----------------------------------------------------------------------------

export interface StockAvailabilityItem {
  /** exec-038 HOMOLOG R2, aditivo — identificador do PRÓPRIO registro de
   *  `Stock` (a linha física produto+armazém+lote, nunca `id` — Lei 10).
   *  Mirror `StockListItem.uuid`; permite o bloco Insumos da OS
   *  (`ServiceOrderProductTab.tsx`) usar este endpoint como catálogo
   *  ÚNICO da linha (option value = `stock_uuid`, sem round-trip extra por
   *  `listStocks`). */
  uuid: string;
  product: {
    uuid: string;
    description: string;
  };
  quantity: number;
  /** exec-038 HOMOLOG R2, aditivo — `product.min_stock` (coluna física
   *  `products.min_stock`), usado no aviso "estoque abaixo do mínimo" do
   *  bloco Insumos da OS (mirror legado `_product.blade.php:84-88`). */
  min_stock: number | null;
  /** exec-038 HOMOLOG R2, aditivo — `stocks.lot` (mirror `StockListItem.lot`,
   *  discriminante real de "tem lote"). */
  lot: string | null;
  /** TASK-BE-1076/TASK-FE-2778 (FID-057-04) — `stocks.provider_lot` (varchar
   *  nullable). Discriminante de "tem lote" continua sendo `lot`; este campo
   *  é só o TEXTO exibido no LABEL (`"<produto> - Lote: <provider_lot>"`),
   *  mirror `_forms.blade.php:159-163`/`:258-263` do legado — a montagem do
   *  label é responsabilidade do Front (`ProtocolSeasonItemsFieldArray.tsx`). */
  provider_lot: string | null;
  warehouse_uuid: string;
  measurement: {
    uuid: string;
    name: string;
    description: string;
  } | null;
  // GAP-BE-642 — unidade SECUNDÁRIA do Produto + fator de conversão entre as 2
  // unidades (`factor_type` = string crua do Enum, 'M'/'D').
  measurement_second: {
    uuid: string;
    name: string;
    description: string;
  } | null;
  factor: number | null;
  factor_type: 'M' | 'D' | null;
}

export interface StockAvailabilityListEnvelope {
  success: boolean;
  message: string;
  data: StockAvailabilityItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
