// src/@types/v2/FarmTransfers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Trans. Fazendas" (FarmTransfer — Estoque, escrita,
// Tarefas 01/02/03). Mirror estrutural DIRETO de
// `@/@types/v2/WarehouseTransfers` (mesmo domínio `StockMovement`,
// `between_farms=true`), cruzado com leitura DIRETA de
// `FarmTransferController.php`/`FarmTransferRequest.php`/
// `FarmTransferResource.php`/`FarmTransferFilterData.php`/
// `StoreFarmTransferData.php`/`FarmTransferItemData.php` (código real já
// ✅ CONCLUÍDO e travado pelo Tester de API, `GB.Cerne.Api`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /farm-transfers          → data: FarmTransferListItem[]
//                                      (granularidade FLAT por item, mirror
//                                      `DA-WT-04` — SEM cabeçalho).
//   GET    /farm-transfers/{uuid}   → data: FarmTransferListItem (MESMO
//                                      Resource do índice).
//   POST   /farm-transfers          → payload CreateFarmTransferPayload
//                                      (lote, `items[]`, 1
//                                      `destination_warehouse_uuid`
//                                      compartilhado + campos financeiros
//                                      opcionais) → data:
//                                      FarmTransferListItem[] (array das
//                                      linhas criadas, `FarmTransferResource::
//                                      collection`, NUNCA um objeto único).
//   DELETE /farm-transfers/{uuid}   → 204, sem body.
//
// ⚠️ Achado confirmado por leitura DIRETA de
// `StockMovementRepository::listPaginatedBetweenFarms()`
// (`GB.Cerne.Api`, linha `whereHas('destinationWarehouse', ...)`): o filtro
// `warehouse_uuid` de `GET /farm-transfers` filtra pelo ARMAZÉM DE DESTINO —
// MESMA convenção do irmão `WarehouseTransferFilterForm` (rótulo "Armazém
// Destino"), item de DoD da Tarefa 01 confirmado.
//
// `FarmTransferCreateForm` (cabeçalho + `items[]` + subfluxo financeiro
// opcional) × leitura (`FarmTransferListItem`, shape flat de 1 registro) são
// tipos ESTRUTURALMENTE DISTINTOS — não há modo editar nesta feature
// (`RT-06 NAO_APLICAVEL`), então não existe um 3º shape de update.
//
// Subfluxo financeiro (`has_financial`, Tarefa 03) — granularidade real
// confirmada pelo Tester da API = POR PARCELA (Income/Expense vinculados
// SÓ ao último `StockMovement` do lote), NUNCA por item — a UI só precisa
// coletar 1 rateio Income (origem) + 1 rateio Expense (destino) + N
// parcelas, mirror `GAP-FARMTRANSFER-FE-03`.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (shape 1:1 com FarmTransferResource.php, lido no código
// real)
// ============================================

export interface FarmTransferStockRef {
  uuid: string;
  lot: string | null;
}

export interface FarmTransferProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface FarmTransferWarehouseRef {
  uuid: string;
  description: string;
}

export interface FarmTransferFarmRef {
  uuid: string;
  description: string;
}

export interface FarmTransferCostCenterRef {
  uuid: string;
  description: string;
}

export interface FarmTransferUserRef {
  uuid: string;
  name: string;
}

// ============================================
// FARM TRANSFER (resposta da API) — GET /farm-transfers (index) E
// GET /farm-transfers/{uuid} (show) — MESMO shape achatado (granularidade
// por item, mirror `DA-WT-04`). Sem `items[]` wrapper. Sem dados
// financeiros (Income/Expense NÃO são carregados por este Resource, ver
// `GAP-FARMTRANSFER-FE-04`) — a tela de detalhe não pode/deve tentar
// exibi-los. `origin`/`destination_warehouse` podem vir `null` se a relação
// não carregar (`whenLoaded`) — optional chaining obrigatório em todo
// consumo.
// ============================================

export interface FarmTransferListItem {
  uuid: string;
  code: string;
  date: string;
  origin: {
    stock: FarmTransferStockRef;
    product: FarmTransferProductRef | null;
    warehouse: FarmTransferWarehouseRef | null;
    farm: FarmTransferFarmRef | null;
  } | null;
  destination_warehouse: {
    uuid: string;
    description: string;
    farm: FarmTransferFarmRef | null;
  } | null;
  quantity: number;
  amount: number;
  between_farms: boolean;
  cost_center: FarmTransferCostCenterRef | null;
  user: FarmTransferUserRef | null;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /farm-transfers)
// ============================================

export interface FarmTransfersApiPaginationMeta {
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

export interface FarmTransfersListEnvelope {
  success: boolean;
  message: string;
  data: FarmTransferListItem[];
  errors: Record<string, string[]> | null;
  meta: FarmTransfersApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 01 — Contrato B).
// ⚠️ `warehouse_uuid` = ARMAZÉM DESTINO (confirmado por leitura direta de
// `StockMovementRepository::listPaginatedBetweenFarms()`, ver cabeçalho do
// arquivo) — o rótulo exibido na tela é "Armazém Destino", mesma convenção
// do irmão `WarehouseTransferFilterForm`.
// ============================================

export interface FarmTransferFilterForm {
  product_uuid?: Option | null;
  warehouse_uuid?: Option | null;
  date_from?: string;
  date_to?: string;
}

/** Querystring real de `GET /farm-transfers`. */
export interface FarmTransferFilterRequest {
  product_uuid?: string;
  warehouse_uuid?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO (Tarefas 02/03)
// ============================================

/**
 * Linha do array `items[]` em modo CRIAÇÃO (Tarefa 02). Mirror
 * `WarehouseTransferItemForm` — MESMOS nomes de campo (`stock_id`,
 * `measurement`, `stock_quantity`, `quantity`, `value`, `amount`), única
 * divergência: `cost_center_id` é OPCIONAL aqui (mirror
 * `FarmTransferRequest.items.*.cost_center_uuid: sometimes`, ao contrário do
 * irmão que o exige — `FarmTransferItemsEditor.tsx` reflete essa diferença).
 */
export interface FarmTransferItemForm {
  stock_id: Option | null;
  measurement: string;
  stock_quantity: number;
  value: number;
  quantity: number | string;
  amount: number;
  cost_center_id: Option | null;
}

/** 1 linha do rateio financeiro (Income origem OU Expense destino, Tarefa 03) — mirror do idioma `MovementAllocationEditor`, SEM `plan_account_uuid`/`harvest_uuid` (campos inexistentes em `StoreFarmTransferData`, ver `GAP-FARMTRANSFER-FE-03`). */
export interface FarmTransferAllocationRowForm {
  category_uuid: Option | null;
  center_uuid: Option | null;
  value: number | null;
}

/** 1 parcela do rateio (Tarefa 03) — mirror mecânico de `InstallmentForm` de `InvoiceInstallmentsTab.tsx`, campo `date` (não `month`). */
export interface FarmTransferInstallmentForm {
  date: string | null;
  value: number | null;
}

/**
 * Formulário de CRIAÇÃO (Tarefas 02/03) — cabeçalho + array `items[]` +
 * subfluxo financeiro opcional. `origin_warehouse_id`/`destination_farm_id`
 * são CLIENT-ONLY (mirror `DA-WT-12`/`GAP-FARMTRANSFER-FE-02`) — NUNCA vão
 * ao payload: o armazém de origem é sempre derivado de `stock.warehouse_id`
 * e a fazenda de destino é sempre derivada de
 * `destination_warehouse_uuid → farm_id`.
 */
export interface FarmTransferCreateForm {
  date: string;
  /** Client-only (`DA-WT-12`) — filtro compartilhado por todas as linhas de `items`. */
  origin_warehouse_id: Option | null;
  /** Client-only (`GAP-FARMTRANSFER-FE-02`) — cascata para popular `destination_warehouse_id`; fonte = `useMyFarms()` filtrado da fazenda atual. */
  destination_farm_id: Option | null;
  destination_warehouse_id: Option | null;
  items: FarmTransferItemForm[];
  /** Tarefa 03 — toggle do subfluxo financeiro opcional. */
  has_financial: boolean;
  vl_total: number | null;
  income_allocations: FarmTransferAllocationRowForm[];
  expense_allocations: FarmTransferAllocationRowForm[];
  installments: FarmTransferInstallmentForm[];
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de FarmTransferRequest::rules()
// lido no código real — nenhum campo inventado). `value`/`origin_warehouse_id`/
// `destination_farm_id` NUNCA aparecem aqui (client-only).
// ============================================

export interface FarmTransferItemPayload {
  stock_uuid: string;
  quantity: number;
  amount?: number;
  cost_center_uuid?: string;
}

/**
 * `POST /farm-transfers`. `date` sempre enviado pelo front (default hoje)
 * embora a API aceite omissão (`sometimes`) — fidelidade de UX, mirror
 * `CreateWarehouseTransferPayload`. Campos financeiros OMITIDOS por
 * completo quando `has_financial` é falso (regressão zero da Tarefa 02,
 * `GAP-FARMTRANSFER-FE-03` DoD).
 */
export interface CreateFarmTransferPayload {
  date: string;
  destination_warehouse_uuid: string;
  items: FarmTransferItemPayload[];
  has_financial?: boolean;
  vl_total?: number;
  income_categories?: string[];
  income_centers?: string[];
  income_category_percent?: number[];
  income_category_values?: number[];
  expense_categories?: string[];
  expense_centers?: string[];
  expense_category_percent?: number[];
  expense_category_values?: number[];
  date_installments?: string[];
  value_installments?: number[];
}
