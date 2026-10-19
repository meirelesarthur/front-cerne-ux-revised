// src/@types/v2/DietBeats/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Batida" (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-04). Fundação de dados greenfield no front. Molde 1:1 de
// `FoodBeats/index.d.ts` — em particular o ramo "Formulação" (`type='F'`,
// itens DERIVADOS de uma Ração/Dieta selecionada), já que a Batida de Dieta
// SEMPRE deriva seus itens da Dieta escolhida (sem ramo "Estoque" — molde
// exato `FoodBeatFormulationItemsEditor`). Shape real confirmado por leitura
// direta de `DietBeatResource`/`ItemDietBeatResource`/`DietBeatData`/
// `ItemDietBeatData`/`DietBeatFilterData` no worktree `diet-api`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /diet-beats                → data: DietBeatListItem[]. `total_cost`
//                                        (Σ item.total) só é populado quando o
//                                        Resource enxerga a relação `items`
//                                        CARREGADA — o índice usa `withSum`
//                                        (agregado SQL), que NÃO conta como
//                                        relação carregada para o Resource
//                                        (confirmado por leitura direta) —
//                                        na prática `total_cost`/
//                                        `total_planned`/`total_realized`
//                                        chegam `null` no índice; a tela
//                                        (TASK-FE-DIET-05) trata como estado
//                                        de UI honesto ('—'), SEM MOCK.
//   GET    /diet-beats/{uuid}         → data: DietBeatDetail (COM items[] e
//                                        os 3 totais populados).
//   POST   /diet-beats                → payload DietBeatPayload.
//   PUT    /diet-beats/{uuid}         → payload DietBeatPayload — itens
//                                        reconciliados por IDENTIDADE
//                                        (AD-04: `uuid` quando existente,
//                                        fallback `stock_uuid`), NUNCA por
//                                        posição.
//   DELETE /diet-beats/{uuid}         → soft delete + devolução de estoque
//                                        server-side (AD-03).
//
// Baixa/devolução de estoque é SEMPRE server-side (AD-02/03/05) — este
// arquivo não tipa nenhum efeito de estoque, só o que a API troca com o
// front. `type`/`density`/`total` de cada item NUNCA são campos do payload
// de escrita (GAP-DIET-02/AD-06) — sempre calculados/gravados pela Action.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { IngredientType } from '@/@types/v2/Diets';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface DietBeatEquipmentRef {
  uuid: string;
  description: string;
}

export interface DietBeatMeasurementRef {
  uuid: string;
  name: string;
}

export interface DietBeatUserRef {
  uuid: string;
  name: string;
}

/** `diet` aninhada no `DietBeatResource` — SÓ `uuid`/`code`/`product`
 *  (não o Resource completo de Diet). */
export interface DietBeatDietRef {
  uuid: string;
  code: string;
  product: { uuid: string; description: string } | null;
}

export interface DietBeatStockProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface DietBeatStockWarehouseRef {
  uuid: string;
  description: string;
}

/** `stock` aninhado em cada item (`ItemDietBeatResource::toArray()`), mirror
 *  `FoodBeatStockRef` — SEM `quantity`/`average_cost` aqui (o saldo
 *  disponível para exibição vem de `ingredients[].stocks[]` da Dieta
 *  selecionada, TASK-FE-DIET-06, não deste nó). */
export interface DietBeatItemStockRef {
  uuid: string;
  product: DietBeatStockProductRef | null;
  warehouse: DietBeatStockWarehouseRef | null;
}

/** Linha de item (`ItemDietBeatResource`) — só em `DietBeatDetail`. */
export interface DietBeatItemResource {
  uuid: string;
  stock: DietBeatItemStockRef | null;
  measurement: DietBeatMeasurementRef | null;
  /** SEMPRE `'NU'` na prática (GAP-DIET-02) — mirror `DietIngredientItem.type`. */
  type: IngredientType;
  type_label: string;
  dry_matter: number;
  cost_value: number;
  /** Quantidade PLANEJADA (previsto), CV-06 — preview no cliente, autoridade
   *  no servidor. */
  quantity: number;
  /** Quantidade REALIZADA — o que o operador de fato baixou/usou. */
  quantity_realized: number;
  percentage: number;
  difference: number;
  /** `quantity_realized * cost_value` — SEMPRE recalculado server-side
   *  (AD-06 CV-07). */
  total: number;
  /** `quantity_realized*100/quantity` (accessor `Model::variation`, CV-08),
   *  já arredondado a 2 casas pelo Resource. */
  variation: number;
}

// ============================================
// DIETBEAT (resposta da API)
// ============================================

/** `GET /diet-beats` — `items` NÃO carregado no índice (só `withSum`) — ver
 *  nota de topo do arquivo sobre `total_cost`/`total_planned`/
 *  `total_realized` chegarem `null` na prática. */
export interface DietBeatListItem {
  uuid: string;
  code: string;
  date: string;
  quantity: number;
  diet: DietBeatDietRef | null;
  equipment: DietBeatEquipmentRef | null;
  measurement: DietBeatMeasurementRef | null;
  user: DietBeatUserRef | null;
  total_cost: number | null;
  total_planned: number | null;
  total_realized: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** `GET /diet-beats/{uuid}` — mesmo Resource ACRESCIDO de `items[]`
 *  (relação carregada — os 3 totais chegam populados, ver `findByUuidOrFail`
 *  do `DietBeatRepository`). */
export interface DietBeatDetail extends DietBeatListItem {
  items: DietBeatItemResource[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /diet-beats)
// ============================================

export interface DietBeatsApiPaginationMeta {
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

export interface DietBeatsListEnvelope {
  success: boolean;
  message: string;
  data: DietBeatListItem[];
  errors: Record<string, string[]> | null;
  meta: DietBeatsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FE-DIET-05)
// ============================================

/** Querystring real de `GET /diet-beats` (`DietBeatFilterData.php`, fiel ao
 *  legado `?equipment_id/?date/?diet_id`, agora por uuid). */
export interface DietBeatFilterForm {
  equipment_uuid?: string;
  date?: string;
  diet_uuid?: string;
}

// ============================================
// REQUEST TYPES (create/update — DietBeatData/ItemDietBeatData, uuid-first)
// ============================================

/** `items[]` do payload de escrita — `uuid` OPCIONAL (identidade da linha
 *  EXISTENTE, AD-04; ausente = linha NOVA), `measurement_uuid`/`difference`
 *  OPCIONAIS (`Optional` no DTO — confirmado por leitura direta de
 *  `ItemDietBeatData.php`). SEM `type`/`density`/`total` (GAP-DIET-02/AD-06,
 *  sempre server-side). */
export interface DietBeatItemPayload {
  uuid?: string;
  stock_uuid: string;
  measurement_uuid?: string;
  dry_matter: number;
  cost_value: number;
  quantity: number;
  quantity_realized: number;
  percentage: number;
  difference?: number;
}

/** `POST /diet-beats` / `PUT /diet-beats/{uuid}` — nomes de campo
 *  CONFIRMADOS contra `DietBeatData.php`/`DietBeatRequest.php`. SEM
 *  `code`/`farm_id`/`user_id` (sempre resolvidos server-side). */
export interface DietBeatPayload {
  diet_uuid: string;
  equipment_uuid: string;
  measurement_uuid: string;
  quantity: number;
  date: string;
  items: DietBeatItemPayload[];
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit, TASK-FE-DIET-06)
// ============================================

/**
 * Linha de item no RHF — DERIVADA da Dieta selecionada (uma por
 * `ingredients[]` da Dieta, mirror `FoodBeatFormulationItemForm`: linha
 * FIXA, sem Select de produto — só `stock_id` é escolhido pelo usuário).
 * `uuid` preserva a identidade da linha existente em modo edição (AD-04);
 * ausente/`undefined` numa linha recém-derivada da Dieta = linha NOVA.
 * `product_label`/`measurement_label` são exibição, não payload.
 */
export interface DietBeatItemForm {
  uuid?: string;
  product_label: string;
  measurement_label: string;
  stock_id: Option<string> | null;
  dry_matter: number | string;
  cost_value: number | string;
  /** Quantidade PLANEJADA (previsto, CV-06) — preview de UX, readonly na tela. */
  quantity: number | string;
  quantity_realized: number | string;
  percentage: number | string;
  difference: number | string;
}

/**
 * Formulário completo (create/edit) — `equipment_id`/`diet_id`/
 * `measurement_id` guardam `Option{label,value}` INTEIRO. SEM `code`
 * (readonly, gerado server-side) e SEM `user_id` (nunca enviado).
 */
export interface DietBeatForm {
  equipment_id: Option<string> | null;
  diet_id: Option<string> | null;
  measurement_id: Option<string> | null;
  quantity: number | string;
  date: string;
  items: DietBeatItemForm[];
}
