// src/@types/v2/Devolutions/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Devolução/Entrada" (Devolution — Estoque, escrita,
// 97-Esteiras/037). Mirror estrutural DIRETO de `@/@types/v2/Requisitions`
// (mesmo domínio `StockMovement`, `DevolutionController` comenta "Mirror
// RequisitionController" em cada método), cruzado com leitura DIRETA de
// `DevolutionController.php`/`DevolutionRequest.php`/`DevolutionResource.php`/
// `DevolutionListResource.php`/`DevolutionFilterData.php`/
// `StoreDevolutionData.php`/`StoreDevolutionItemData.php`/
// `UpdateDevolutionData.php`/`DevolutionImportResultResource.php`
// (`GB.Cerne.Api`, código real já migrado e commitado).
//
// Divergências vs. o mirror `Requisition` (Leitura do dev do roteiro):
//   1. Devolução TEM `update` (`FID-11`) — `UpdateDevolutionPayload` existe,
//      diferente de Requisição (`RT-06 NAO_APLICAVEL`).
//   2. GAP DE CONTRATO: `DevolutionResource::show()` NÃO expõe `stock.uuid`
//      (só `product`/`warehouse`/`quantity`/`unit`) — não é possível
//      pré-popular um "estoque atual" com uuid. Ver `UpdateDevolucao.tsx`
//      (Tarefa 09), campo "Trocar Estoque" nasce SEMPRE vazio.
//   3. `date` é campo EDITÁVEL real em AMBOS os verbos (`StoreDevolutionData::
//      date` required, `UpdateDevolutionData::date` sometimes) — NÃO é
//      decorativo/readonly como em `Requisition`.
//   4. Itens NÃO têm armazém persistido (`StoreDevolutionItemData` sem
//      `warehouse_uuid`) — `warehouse_id` em `DevolutionItemForm` é
//      CLIENT-ONLY (filtro de busca), NUNCA entra em `DevolutionItemPayload`.
//   5. `DevolutionDetail` expõe `amount`/`status`/`cost_center` (o `show()`
//      real não omite nada, diferente de `RequisitionDetail`/`GAP-RS-03`).
//   6. `DevolutionListItem` expõe `date` E `created_at` — as DUAS colunas.
//   7. Import: `DevolutionImportResult::codes` é ARRAY (agrupamento por
//      `date|requester`, `FID-14`), diferente do `code` singular do irmão
//      `StockCorrection`.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (shape 1:1 com DevolutionResource.php/
// DevolutionListResource.php, lidos no código real)
// ============================================

export interface DevolutionProductRef {
  uuid: string;
  code: string;
  description: string;
}

// `whenLoaded` — o índice NÃO expõe `uuid` do armazém, só `description`; no
// `show()` também não é garantido — tratar como opcional em ambos por
// segurança (Leitura do dev do roteiro).
export interface DevolutionWarehouseRef {
  uuid?: string;
  description: string;
}

export interface DevolutionCostCenterRef {
  uuid: string;
  description: string;
}

export interface DevolutionUserRef {
  uuid: string;
  name: string;
}

export interface DevolutionAreaRef {
  uuid: string;
  description: string;
}

/** Mirror `App\Enums\StockMovementStatus` (backend, backed `int`, reusado de Requisition). */
export type DevolutionStatusValue = 1 | 2;

/** Mirror `TenantResource::signature` — `value` estável (gate), `label` traduzido. */
export interface DevolutionStatusRef {
  value: DevolutionStatusValue;
  label: string;
}

// ============================================
// DEVOLUTION LIST ITEM (resposta de `GET /devolutions`, DevolutionListResource)
// — granularidade FLAT por item. Todos os relacionamentos podem vir `null`
// (`whenLoaded`) — optional chaining obrigatório em todo consumo.
// ============================================

export interface DevolutionListItem {
  uuid: string;
  status: DevolutionStatusRef;
  code: string;
  product: DevolutionProductRef | null;
  quantity: number;
  unit: string | null;
  warehouse: DevolutionWarehouseRef | null;
  cost_center: DevolutionCostCenterRef | null;
  user: DevolutionUserRef | null;
  /** `date` do payload (divergência #3) — distinta de `created_at`, AMBAS na grid. */
  date: string;
  created_at: string;
}

// ============================================
// DEVOLUTION DETAIL (resposta de `GET /devolutions/{uuid}`, DevolutionResource)
// — diferente de `RequisitionDetail`, o `show()` real NÃO omite `amount`/
// `status`/`cost_center` (divergência #5).
// ============================================

export interface DevolutionDetail {
  uuid: string;
  status: DevolutionStatusRef;
  code: string;
  type: string;
  requester: string;
  classification: string;
  area: DevolutionAreaRef | null;
  product: DevolutionProductRef | null;
  warehouse: DevolutionWarehouseRef | null;
  quantity: number;
  unit: string | null;
  amount: number;
  cost_center: DevolutionCostCenterRef | null;
  user: DevolutionUserRef | null;
  date: string;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /devolutions)
// ============================================

export interface DevolutionsApiPaginationMeta {
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

export interface DevolutionsListEnvelope {
  success: boolean;
  message: string;
  data: DevolutionListItem[];
  errors: Record<string, string[]> | null;
  meta: DevolutionsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Contrato B). Mirror `DevolutionFilterData`
// (produto/armazém/centro de custo/período) — shape idêntico a `Requisition`.
// ============================================

export interface DevolutionFilterForm {
  product_uuid?: Option | null;
  warehouse_uuid?: Option | null;
  cost_center_uuid?: Option | null;
  date_from?: string;
  date_to?: string;
}

/** Querystring real de `GET /devolutions`. */
export interface DevolutionFilterRequest {
  product_uuid?: string;
  warehouse_uuid?: string;
  cost_center_uuid?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO (lote, Tarefa 08)
// ============================================

/**
 * Linha do array `items[]` em modo CRIAÇÃO. Mirror `RequisitionItemForm`,
 * MENOS persistência de armazém: `warehouse_id` é filtro CLIENT-ONLY da
 * cascata de estoque desta linha (`listStocks({ warehouse_uuid })`), NUNCA
 * entra em `DevolutionItemPayload` (divergência #4 — `StoreDevolutionItemData`
 * não tem `warehouse_uuid`).
 */
export interface DevolutionItemForm {
  stock_id: Option | null;
  measurement: string;
  stock_quantity: number;
  value: number;
  quantity: number | string;
  amount: number;
  /** CLIENT-ONLY — filtra a busca de estoque desta linha, NUNCA no payload. */
  warehouse_id: Option | null;
  cost_center_id: Option | null;
}

/**
 * Formulário de CRIAÇÃO (Tarefa 08, corrigido CORRECAO-R1/D1) — cabeçalho
 * (data EDITÁVEL, responsável — select de Employee, `payload.requester`
 * continua string com o `name`) + array `items[]`. `classification`/
 * `area_id` REMOVIDOS do form (CORRECAO-R1/D1 — API deixou de exigir).
 */
export interface DevolutionCreateForm {
  /** EDITÁVEL real (divergência #3) — `type="date"`, `StoreDevolutionData::date` required. */
  date: string;
  /** `SelectAsyncPaginate` de Employee — `label=value=name` (mirror `listEmployees`). */
  requester: Option<string> | null;
  items: DevolutionItemForm[];
}

// ============================================
// REACT HOOK FORM — formulário de VISUALIZAÇÃO/EDIÇÃO (linha única,
// `FID-11`, Tarefa 09). Sem mirror literal (nenhum irmão do domínio
// `StockMovement` tem `update`) — só os campos EDITÁVEIS reais entram aqui;
// os campos readonly (código/status/tipo/classificação/área/produto
// atual/armazém atual) vêm direto de `DevolutionDetail`, fora do RHF.
// ============================================

export interface DevolutionUpdateForm {
  date: string;
  /** `SelectAsyncPaginate` de Employee (CORRECAO-R1/D1) — `label=value=name`, mirror `DevolutionCreateForm.requester`. */
  requester: Option<string> | null;
  cost_center_id: Option | null;
  quantity: number | string;
  amount: number | string;
  /**
   * "Trocar Estoque" — nasce SEMPRE `null` (GAP de contrato #2: o Resource
   * não expõe `stock.uuid`, nunca é pré-populado). Só entra no PATCH quando
   * `dirtyFields.stock_id` é `true` (usuário selecionou algo).
   */
  stock_id: Option | null;
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de DevolutionRequest::rules()/
// StoreDevolutionData/StoreDevolutionItemData lidos no código real).
// ============================================

/** Mirror `StoreDevolutionItemData` — SEM `warehouse_uuid` (divergência #4). */
export interface DevolutionItemPayload {
  stock_uuid: string;
  quantity: number;
  amount: number;
  cost_center_uuid: string;
}

/**
 * `POST /devolutions` (CORRECAO-R1/D1 — `classification`/`area_uuid`
 * REMOVIDOS, API deixou de exigir). `code` NUNCA aparece aqui — gerado no
 * servidor.
 */
export interface CreateDevolutionPayload {
  date: string;
  requester: string;
  items: DevolutionItemPayload[];
}

/**
 * `PUT|PATCH /devolutions/{uuid}` — linha única, TODOS opcionais
 * (`UpdateDevolutionData`, `sometimes`, PATCH parcial, Tarefa 09).
 */
export interface UpdateDevolutionPayload {
  date?: string;
  stock_uuid?: string;
  cost_center_uuid?: string;
  requester?: string;
  quantity?: number;
  amount?: number;
}

// ============================================
// IMPORT XLSX (Tarefa 07) — `DevolutionImportResultResource`. `codes` é
// ARRAY (divergência #7, agrupamento por `date|requester`, `FID-14`).
// ============================================

export interface DevolutionImportResult {
  codes: string[];
  groups_processed: number;
  rows_processed: number;
}
