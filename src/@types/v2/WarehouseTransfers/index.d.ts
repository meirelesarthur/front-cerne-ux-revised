// src/@types/v2/WarehouseTransfers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Trans. Armazém" (WarehouseTransfer — Estoque, escrita,
// TASK-WT-FE-01). Fundação de dados greenfield no front. Mirror estrutural de
// `FoodBeats/index.d.ts` (fachada CRUD + granularidade por item), sobre o
// Model `StockMovement` (backend `WarehouseTransfer-contrato.md`, APROVADO
// 100%, Ciclo 3), cruzado com leitura DIRETA de
// `WarehouseTransferController.php`/`WarehouseTransferRequest.php`/
// `WarehouseTransferResource.php`/`WarehouseTransferFilterData.php` (código
// real já em produção, não só o contrato).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /warehouse-transfers          → data: WarehouseTransferListItem[]
//                                           (granularidade por ITEM, `DA-WT-04`
//                                           — SEM cabeçalho, mesmo shape
//                                           achatado do detalhe).
//   GET    /warehouse-transfers/{uuid}   → data: WarehouseTransferListItem
//                                           (MESMO Resource do índice).
//   POST   /warehouse-transfers          → payload CreateWarehouseTransferPayload
//                                           (lote, `items[]`, N produtos, 1
//                                           `destination_warehouse_uuid`
//                                           compartilhado) → data:
//                                           WarehouseTransferListItem[] (array
//                                           das linhas criadas, NÃO singular —
//                                           `WarehouseTransferResource::collection`).
//   PUT/PATCH /warehouse-transfers/{uuid} → payload UpdateWarehouseTransferPayload
//                                           (1 linha só, full-resource).
//   DELETE /warehouse-transfers/{uuid}   → 204, sem body.
//
// ⚠️ Achado de leitura direta (`WarehouseTransferFilterData.php` +
// `StockMovementRepository::listPaginated()`, `whereHas('destinationWarehouse',
// ...)`): o filtro `warehouse_uuid` de `GET /warehouse-transfers` filtra pelo
// armazém de DESTINO, NÃO pela origem — diverge de uma leitura ingênua do
// Blade legado (`index.blade.php`, campo `warehouse` ambíguo). Ver
// `WarehouseTransferFilterForm`/`WarehouseTransferFilterRequest` abaixo e
// `ListWarehouseTransfersParams` no service.
//
// `WarehouseTransferCreateForm` (cabeçalho + array `items[]`) ×
// `WarehouseTransferUpdateForm` (flat, uma linha) são tipos DISTINTOS
// (NÃO um union type trocando shape) — RHF não tolera bem isso (mesmo
// racional já documentado em `FoodBeatForm`/`useFoodBeatForm.ts`).
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (shape 1:1 com WarehouseTransferResource.php, lido no
// código real)
// ============================================

export interface WarehouseTransferStockRef {
  uuid: string;
  lot: string | null;
}

export interface WarehouseTransferProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface WarehouseTransferWarehouseRef {
  uuid: string;
  description: string;
}

export interface WarehouseTransferCostCenterRef {
  uuid: string;
  description: string;
}

export interface WarehouseTransferUserRef {
  uuid: string;
  name: string;
}

// ============================================
// WAREHOUSE TRANSFER (resposta da API) — GET /warehouse-transfers (index) E
// GET /warehouse-transfers/{uuid} (show) — MESMO shape achatado
// (granularidade por item, `DA-WT-04`). Sem `items[]` wrapper.
// `origin`/`destination_warehouse` podem vir `null` se a relação não
// carregar (Resource lido no código real) — optional chaining obrigatório
// em todo consumo.
// ============================================

export interface WarehouseTransferListItem {
  uuid: string;
  code: string;
  date: string;
  origin: {
    stock: WarehouseTransferStockRef;
    product: WarehouseTransferProductRef | null;
    warehouse: WarehouseTransferWarehouseRef | null;
  } | null;
  destination_warehouse: WarehouseTransferWarehouseRef | null;
  quantity: number;
  amount: number;
  cost_center: WarehouseTransferCostCenterRef | null;
  user: WarehouseTransferUserRef | null;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /warehouse-transfers)
// ============================================

export interface WarehouseTransfersApiPaginationMeta {
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

export interface WarehouseTransfersListEnvelope {
  success: boolean;
  message: string;
  data: WarehouseTransferListItem[];
  errors: Record<string, string[]> | null;
  meta: WarehouseTransfersApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-WT-FE-02 — Contrato B).
// ⚠️ `warehouse_uuid` = ARMAZÉM DESTINO (achado de leitura direta, ver
// cabeçalho do arquivo) — o rótulo exibido na tela deve refletir isso
// ("Armazém Destino"), nunca copiar cegamente o `warehouse_id` ambíguo do
// legado.
// ============================================

export interface WarehouseTransferFilterForm {
  product_uuid?: Option | null;
  warehouse_uuid?: Option | null;
  date_from?: string;
  date_to?: string;
}

/** Querystring real de `GET /warehouse-transfers`. */
export interface WarehouseTransferFilterRequest {
  product_uuid?: string;
  warehouse_uuid?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// REACT HOOK FORM — 2 formulários DISTINTOS (create em lote × update de 1
// linha)
// ============================================

/**
 * Linha do array `items[]` em modo CRIAÇÃO (TASK-WT-FE-03). Nomes de campo
 * FIÉIS ao Blade legado (`_forms.blade.php`): `stock_id` (produto),
 * `stock_quantity` (estoque, readonly, mirror `qnt_stock`),
 * `measurement` (unidade, readonly, mirror `um`), `quantity`, `value`
 * (valor unitário — SEMPRE readonly em criação, autofill de
 * `average_cost`, NUNCA enviado ao backend), `amount` (valor total,
 * calculado = quantity × value, SEMPRE readonly e OBRIGATÓRIO no
 * formulário — decisão de UX, embora `sometimes` na API), `cost_center_id`.
 */
export interface WarehouseTransferItemForm {
  stock_id: Option | null;
  measurement: string;
  stock_quantity: number;
  value: number;
  quantity: number | string;
  amount: number;
  cost_center_id: Option | null;
}

/**
 * Formulário de CRIAÇÃO (TASK-WT-FE-03) — cabeçalho + array `items[]`.
 * `origin_warehouse_id` é o "Armazém (origem)" do Blade — filtro
 * CLIENT-SIDE ÚNICO e COMPARTILHADO por todas as linhas da tabela dinâmica
 * (`DA-WT-12`, `_forms.blade.php:19`+`create.blade.php:61-63`) — NUNCA vai
 * ao payload (não existe coluna própria de origem em `stock_movements`; o
 * armazém de origem é sempre derivado de `stock.warehouse_id`).
 */
export interface WarehouseTransferCreateForm {
  date: string;
  origin_warehouse_id: Option | null;
  destination_warehouse_id: Option | null;
  items: WarehouseTransferItemForm[];
}

/**
 * Formulário de EDIÇÃO (TASK-WT-FE-04) — 1 linha só, FLAT (sem array).
 * Nomes FIÉIS a `_forms-edit.blade.php`. DIFERENÇA DE FIDELIDADE
 * intencional vs. criação: aqui `value` (valor unitário) é EDITÁVEL
 * (`_forms-edit.blade.php:51`, sem `readonly`) — o usuário pode ajustar o
 * custo unitário da linha já existente; `amount` continua SEMPRE
 * readonly/calculado (`amount-edit`, recalcula no `blur` de
 * quantity/value).
 */
export interface WarehouseTransferUpdateForm {
  date: string;
  origin_warehouse_id: Option | null; // exibição/filtro client-side, NUNCA no payload (DA-WT-12)
  stock_id: Option | null;
  measurement: string;
  stock_quantity: number;
  quantity: number | string;
  value: number;
  amount: number;
  destination_warehouse_id: Option | null;
  cost_center_id: Option | null;
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de WarehouseTransferRequest::rules()
// lido no código real — nenhum campo inventado). `value`/`origin_warehouse_id`
// NUNCA aparecem aqui (client-only).
// ============================================

export interface WarehouseTransferItemPayload {
  stock_uuid: string;
  quantity: number;
  amount: number;
  cost_center_uuid?: string;
}

/**
 * `POST /warehouse-transfers`. `date` sempre enviado pelo front (default
 * hoje) embora a API aceite omissão (`sometimes`) — fidelidade de UX ao
 * Blade, não ao mínimo aceito pela API.
 */
export interface CreateWarehouseTransferPayload {
  date: string;
  destination_warehouse_uuid: string;
  items: WarehouseTransferItemPayload[];
}

/**
 * `PUT/PATCH /warehouse-transfers/{uuid}` — 1 linha, TODOS os campos
 * aceitos pelo Request (full-resource, NUNCA delta parcial — o Request
 * exige os campos; mandar só `dirtyFields` causaria 422 em
 * `stock_uuid`/`destination_warehouse_uuid`/`quantity` quando não sujos).
 */
export interface UpdateWarehouseTransferPayload {
  date: string;
  stock_uuid: string;
  destination_warehouse_uuid: string;
  quantity: number;
  amount: number;
  cost_center_uuid?: string;
}
