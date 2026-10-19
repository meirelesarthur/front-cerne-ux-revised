// src/@types/v2/Requisitions/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Requisição/Saída" (Requisition — Estoque, escrita,
// 97-Esteiras/002, Tarefas 04/05). Mirror estrutural DIRETO de
// `@/@types/v2/FarmTransfers`/`@/@types/v2/WarehouseTransfers` (mesmo
// domínio `StockMovement`), cruzado com leitura DIRETA de
// `RequisitionController.php`/`RequisitionRequest.php`/
// `RequisitionResource.php`/`RequisitionListResource.php`/
// `RequisitionFilterData.php`/`StoreRequisitionData.php`/
// `StoreRequisitionItemData.php` (`GB.Cerne.Api`, código real já ✅
// CONCLUÍDO e testado pelo Tester de API).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /requisitions          → data: RequisitionListItem[] (granularidade
//                                    FLAT por item — 1 `StockMovement` = 1
//                                    linha; um lote de criação com N itens
//                                    gera N linhas com o MESMO `code`).
//   GET    /requisitions/{uuid}   → data: RequisitionDetail — Resource
//                                    DISTINTO do índice (`GAP-RS-03`, decisão
//                                    vinculante do dono já ✅ CONCLUÍDA na
//                                    API): NÃO reexibe `cost_center`/
//                                    `amount`/`status`/`signature*`. A tela
//                                    de detalhe reflete essa omissão
//                                    fielmente (`GAP-REQUISICAO-FE-02`).
//   POST   /requisitions          → payload CreateRequisitionPayload (lote,
//                                    `items[]`, 1 `code` gerado só no
//                                    servidor, por fazenda+tipo — decisão
//                                    FINAL de `GAP-RS-06`/`GAP-RS-10`) →
//                                    data: RequisitionDetail[] (Controller
//                                    devolve `RequisitionResource::
//                                    collection`, NÃO
//                                    `RequisitionListResource`).
//   DELETE /requisitions/{uuid}   → 204, sem body.
//
// `status` em `RequisitionListItem` — `{ value, label }` (mirror
// `TenantResource::signature`, extensão aditiva `GAP-REQUISICAO-FE-03` Ponto
// A, já aplicada no código lido nesta sessão). Não gateia nenhuma ação nas
// Tarefas 04/05 (isso é só da Tarefa 06, assinatura) — aqui é somente coluna
// de exibição.
//
// `RequisitionCreateForm`/`CreateRequisitionPayload` ficam neste arquivo
// desde a Tarefa 04 (fundação) e são CONSUMIDOS pela Tarefa 05 (formulário).
// `warehouse_uuid` é UI-only NO SENTIDO DE NUNCA SER PERSISTIDO em nenhuma
// coluna (`GAP-RS-02`), mas É obrigatório e validado pelo `RequisitionRequest`
// — por isso aparece em `RequisitionItemPayload`, diferente de
// `origin_warehouse_id` do irmão `WarehouseTransfer` (que nem chega ao
// Request).
//
// `GAP-RS-11` (achado pós-entrega, correção de fidelidade): `warehouse_uuid`/
// `cost_center_uuid` deixaram de ser campo único do CABEÇALHO e passaram a
// ser POR ITEM (`RequisitionItemForm`/`RequisitionItemPayload`) — cada linha
// tem seu próprio armazém (cascata Armazém→Estoque própria da linha) e seu
// próprio centro de custo (`only_analytic: true`, `GAP-RS-08` preservado).
// `area_uuid`/`requester`/`classification` permanecem no cabeçalho.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (shape 1:1 com RequisitionResource.php/
// RequisitionListResource.php, lidos no código real)
// ============================================

export interface RequisitionProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface RequisitionWarehouseRef {
  uuid: string;
  description: string;
}

export interface RequisitionCostCenterRef {
  uuid: string;
  description: string;
}

export interface RequisitionUserRef {
  uuid: string;
  name: string;
}

export interface RequisitionAreaRef {
  uuid: string;
  description: string;
}

/**
 * Mirror `App\Enums\StockMovementStatus` (backend, backed `int`) — `value`
 * NUMÉRICO estável (gate das 3 ações de assinatura, Tarefa 06), `label`
 * traduzido (só exibição, NUNCA usado para gating — `GAP-REQUISICAO-FE-03`
 * Ponto A). Corrige o tipo `value: string` herdado da Tarefa 04 (o Resource
 * real expõe `$this->resource->status->value`, que é `int`, não `string`).
 */
export type RequisitionStatusValue = 1 | 2;

/** Mirror `TenantResource::signature` — `value` estável (gate), `label` traduzido. */
export interface RequisitionStatusRef {
  value: RequisitionStatusValue;
  label: string;
}

// ============================================
// REQUISITION LIST ITEM (resposta de `GET /requisitions`, RequisitionListResource)
// — granularidade FLAT por item (1 `StockMovement` = 1 linha). Todos os
// relacionamentos podem vir `null` se a relação não carregar (`whenLoaded`)
// — optional chaining obrigatório em todo consumo.
// ============================================

export interface RequisitionListItem {
  uuid: string;
  status: RequisitionStatusRef;
  code: string;
  product: RequisitionProductRef | null;
  quantity: number;
  unit: string | null;
  warehouse: RequisitionWarehouseRef | null;
  cost_center: RequisitionCostCenterRef | null;
  user: RequisitionUserRef | null;
  created_at: string;
}

// ============================================
// REQUISITION DETAIL (resposta de `GET /requisitions/{uuid}`, RequisitionResource)
// — shape DISTINTO do índice (`GAP-RS-03`): SEM `cost_center`/`amount`/
// `status`/`signature*`. Campos extras que só o `show()` expõe:
// `type`/`requester`/`classification`/`area`.
// ============================================

export interface RequisitionDetail {
  uuid: string;
  code: string;
  type: string;
  requester: string;
  classification: string;
  area: RequisitionAreaRef | null;
  product: RequisitionProductRef | null;
  warehouse: RequisitionWarehouseRef | null;
  quantity: number;
  unit: string | null;
  user: RequisitionUserRef | null;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /requisitions)
// ============================================

export interface RequisitionsApiPaginationMeta {
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

export interface RequisitionsListEnvelope {
  success: boolean;
  message: string;
  data: RequisitionListItem[];
  errors: Record<string, string[]> | null;
  meta: RequisitionsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 04 — Contrato B). Mirror
// `RequisitionFilterData` (produto/armazém/centro de custo/período,
// `FLT-01..05`).
// ============================================

export interface RequisitionFilterForm {
  product_uuid?: Option | null;
  warehouse_uuid?: Option | null;
  cost_center_uuid?: Option | null;
  date_from?: string;
  date_to?: string;
}

/** Querystring real de `GET /requisitions`. */
export interface RequisitionFilterRequest {
  product_uuid?: string;
  warehouse_uuid?: string;
  cost_center_uuid?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO (Tarefa 05)
// ============================================

/**
 * Linha do array `items[]` em modo CRIAÇÃO (Tarefa 05, POR ITEM desde
 * `GAP-RS-11`). Mirror `WarehouseTransferItemForm` + `cost_center_id` por
 * item (mirror direto), MENOS `addressing` (`NAO_APLICAVEL`, `FLD-16`, sem
 * campo persistido equivalente). `warehouse_id` é o filtro CLIENT-ONLY da
 * cascata de estoque DESTA linha (`GAP-RS-02`, preservado — nunca é gravado
 * em nenhuma coluna própria); `cost_center_id` exige `class=Analítico`
 * (`GAP-RS-08`, preservado).
 */
export interface RequisitionItemForm {
  stock_id: Option | null;
  measurement: string;
  stock_quantity: number;
  value: number;
  quantity: number | string;
  amount: number;
  warehouse_id: Option | null;
  cost_center_id: Option | null;
}

/**
 * Formulário de CRIAÇÃO (Tarefa 05) — cabeçalho (requisitante,
 * classificação, área opcional) + array `items[]`. Desde `GAP-RS-11`,
 * Armazém e Centro de Custo migraram do cabeçalho para dentro de cada linha
 * de `items[]` (`RequisitionItemForm`) — não existem mais no nível raiz.
 */
export interface RequisitionCreateForm {
  /** `Input` de texto livre simples (`GAP-REQUISICAO-FE-04`, decisão do dono). */
  requester: string;
  classification: Option<string> | null;
  area_id: Option | null;
  items: RequisitionItemForm[];
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de RequisitionRequest::rules()/
// StoreRequisitionData/StoreRequisitionItemData lidos no código real —
// nenhum campo inventado). `value`/`stock_quantity`/`measurement` NUNCA
// aparecem aqui (client-only).
// ============================================

export interface RequisitionItemPayload {
  stock_uuid: string;
  quantity: number;
  amount: number;
  /** UI-only (`GAP-RS-02`, preservado) — validado, nunca persistido em coluna própria. */
  warehouse_uuid: string;
  /** Exige `class=Analítico` (`GAP-RS-08`, preservado). */
  cost_center_uuid: string;
}

/**
 * `POST /requisitions`. `area_uuid` OMITIDO quando vazio (mirror
 * `Optional` do `StoreRequisitionData`, campo opcional real). `code` NUNCA
 * aparece aqui — gerado 100% no servidor (`GAP-RS-06`). Desde `GAP-RS-11`,
 * `cost_center_uuid`/`warehouse_uuid` NÃO existem mais no nível raiz — cada
 * item de `items[]` carrega os seus próprios (`RequisitionItemPayload`).
 */
export interface CreateRequisitionPayload {
  requester: string;
  classification: string;
  area_uuid?: string;
  items: RequisitionItemPayload[];
}
