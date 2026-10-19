// src/@types/v2/FoodBeats/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Batida" (FoodBeat — Fábrica/apontamento de fabricação ou
// baixa de ração, TASK-FB-FE-01). Fundação de dados greenfield no front (nada
// existia em `src/@types/v2/` para `FoodBeat`). Mirror estrutural de
// `Foods/index.d.ts` (fachada CRUD + composição de itens) sobre o Model
// `FoodBeat`/`FoodBeatItem` (backend `FoodBeat-contrato.md`, APROVADO 100%,
// Ciclo 4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /food-beats                  → data: FoodBeatListItem[] (SEM items
//                                          — FoodBeat-contrato.md §4.4, só no
//                                          detalhe).
//   GET    /food-beats/{uuid}           → data: FoodBeatDetail (COM items[]).
//   POST   /food-beats                  → payload CreateFoodBeatPayload
//                                          (branch F/E server-side, `DA-FB-04`).
//   PUT    /food-beats/{uuid}           → payload UpdateFoodBeatPayload —
//                                          SOMENTE `date` (Decisão 1, `## 9`).
//   DELETE /food-beats/{uuid}           → soft delete + recálculo assíncrono.
//   GET    /food-beats/{uuid}/report    → PDF de 1 registro (blob).
//   GET    /food-beats/report           → PDF agregado por período+food_uuid
//                                          (blob) — sem tela consumidora nesta
//                                          esteira (ver `TASK-FB-FE-03`).
//
// Dois ramos internos (`type`): `F`=Formulação (consome a composição de uma
// `Food`/Ração via `feedstocks[]`) e `E`=Estoque (baixa direta de um
// `Product` via `items[]`). `food`/`product` são MUTUAMENTE EXCLUSIVOS por
// `type` (`FoodBeat-contrato.md §3.1`: `type=F→food_id preenchido/product_id
// nulo`, e vice-versa) — 0 violações confirmadas nas 682 linhas reais.
//
// `FoodBeatForm` (React Hook Form) mantém nomes de campo FIÉIS ao Blade
// legado (Doc Bruta `FoodBeat/01-foodbeat.md §12`) — `feedstock_product_id`,
// `stock_id[]`, `measurement_id`, etc. — DIFERENTES dos nomes de campo do
// payload de rede (`stock_uuid`, `warehouse_uuid`, `food_uuid`,
// `product_uuid`, sempre uuid-first). A extração/renomeio de RHF → payload
// acontece na tela do formulário (`TASK-FB-FE-06`), nunca neste arquivo.
//
// Reuso explícito, NÃO duplicado: o combo "Ração" do ramo Formulação usa
// `FoodListItem`/`FoodDetail` (`@/@types/v2/Foods`, módulo `Food` já
// existente) — `FoodBeatForm.food_id` resolve para um `Food.uuid`, consumido
// via `getFood(uuid)` (service já existente, `TASK-FB-FE-03` só importa, não
// recria). Este arquivo NÃO redeclara `FoodListItem`/`FoodDetail`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM `FoodBeatType` — união literal inline (mirror `FoodType` em
// `@/@types/v2/Foods`, decoupling: este arquivo não depende de import
// cruzado de `@/constants/food-beats/food-beat-type.ts`). `F`=Formulação,
// `E`=Estoque (FoodBeat-contrato.md §3.3, `FoodBeatTypeEnum`).
// ============================================

export type FoodBeatType = 'F' | 'E';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface FoodBeatWarehouseRef {
  uuid: string;
  description: string;
}

/** Mirror `StockProductRef` (`@/@types/v2/Stocks`) — só os 3 campos que o
 *  Resource de FoodBeat efetivamente devolve. */
export interface FoodBeatProductRef {
  uuid: string;
  code: string;
  description: string;
}

export interface FoodBeatUserRef {
  uuid: string;
  name: string;
}

/** O `Stock` de origem de cada item — mirror ENXUTO de `StockListItem`
 *  (`@/@types/v2/Stocks`), SEM `quantity`/`average_cost` no nó aninhado —
 *  esses vêm ACHATADOS no próprio item (`FoodBeatItemResource`, ver
 *  `FoodBeat-contrato.md §4.4`). */
export interface FoodBeatStockRef {
  uuid: string;
  product: FoodBeatProductRef;
  warehouse: FoodBeatWarehouseRef;
}

/** Linha de item (`FoodBeat-contrato.md §4.4`, array `items[]` do
 *  `FoodBeatResource`) — shape 1:1 para os DOIS ramos (F/E); a UI decide
 *  quais colunas exibir conforme o `type` do cabeçalho (`TASK-FB-FE-04`). */
export interface FoodBeatItemResource {
  uuid: string;
  stock: FoodBeatStockRef;
  percentage: number;
  quantity: number;
  quantity_realized: number;
  difference: number;
  amount: number;
  total: number;
}

// ============================================
// FOODBEAT (resposta da API)
// ============================================

/** `GET /food-beats` — FoodBeat-contrato.md §4.4 (índice, SEM items). `food`/
 *  `product` mutuamente exclusivos conforme `type` (§3.1). */
export interface FoodBeatListItem {
  uuid: string;
  code: string;
  date: string;
  type: FoodBeatType;
  quantity: number;
  product_quantity: number;
  warehouse: FoodBeatWarehouseRef;
  food: { uuid: string; description: string } | null;
  product: FoodBeatProductRef | null;
  user: FoodBeatUserRef | null;
  provider_lot: string | null;
  shelf_life: string | null;
}

/** `GET /food-beats/{uuid}` — mesmo Resource do índice ACRESCIDO de
 *  `items[]` (FoodBeat-contrato.md §4.4). */
export interface FoodBeatDetail extends FoodBeatListItem {
  items: FoodBeatItemResource[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /food-beats)
// ============================================

export interface FoodBeatsApiPaginationMeta {
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

export interface FoodBeatsListEnvelope {
  success: boolean;
  message: string;
  data: FoodBeatListItem[];
  errors: Record<string, string[]> | null;
  meta: FoodBeatsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FB-FE-05 — Contrato B)
// ============================================

export interface FoodBeatFilterForm {
  product_uuid?: Option | null;
  user_uuid?: Option | null;
  start_date?: string;
  end_date?: string;
}

/** Querystring real de `GET /food-beats` (FoodBeat-contrato.md §4). */
export interface FoodBeatFilterRequest {
  product_uuid?: string;
  user_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit, TASK-FB-FE-06)
// ============================================

/**
 * Linha de composição no RHF, ramo FORMULAÇÃO — nomes de campo FIÉIS ao
 * legado (Doc Bruta `§12.2`, `_forms.blade.php:266-271`/
 * `FoodFeedstocksEditor`). `feedstock_product_id` guarda o RÓTULO da
 * matéria-prima (fixo, 1 opção — vem de `Food.feedstocks[i].product.description`),
 * NÃO um Select — linha fixa, sem escolha do usuário.
 */
export interface FoodBeatFormulationItemForm {
  stock_id: Option | null;
  feedstock_product_id: string;
  feedstock_measurement_id: string | null;
  stock_quantity: number;
  percentage: number;
  feedstock_quantity: number;
  feedstock_quantity_realized: number | string;
  feedstock_difference: number;
  feedstock_amount: number;
  feedstock_total: number;
}

/**
 * Linha de composição no RHF, ramo ESTOQUE — nomes de campo FIÉIS ao legado
 * (Doc Bruta `§12.3`). `measurement_id` aqui é STRING de exibição (unidade
 * resolvida do `Stock` selecionado), **NÃO** um Select de conversão —
 * divergência documentada da Doc Bruta `§12.3` (que tinha um `<select>` de
 * 1-2 unidades via `/api/v1/appropriationStock`, endpoint sem equivalente no
 * contrato novo — ver `## Leitura do dev` de `TASK-FB-FE-04`).
 */
export interface FoodBeatStockItemForm {
  warehouse_id: Option | null;
  stock_id: Option | null;
  measurement_id: string | null;
  stock_quantity: number;
  quantity: number | string;
  amount: number;
  total: number;
}

/**
 * Formulário completo (create/edit) — os DOIS arrays de item (`formulationItems`/
 * `stockItems`) sempre presentes na forma (RHF não tolera bem union types
 * trocando shape); só o array do `type` ativo é validado/enviado
 * (`TASK-FB-FE-02`/`TASK-FB-FE-06`). SEM `code` (readonly, gerado
 * server-side, `DA-FB-12`) e SEM `user_id` (nunca enviado, sempre
 * `$request->user()`).
 */
export interface FoodBeatForm {
  type: FoodBeatType;
  warehouse_id: Option | null;
  food_id: Option | null;
  product_id: Option | null;
  date: string;
  quantity: number | string;
  product_quantity: number;
  measurement: string;
  provider_lot: string;
  shelf_life: string;
  formulationItems: FoodBeatFormulationItemForm[];
  stockItems: FoodBeatStockItemForm[];
}

// ============================================
// REQUEST TYPES (create/update — uuid-first, FoodBeat-contrato.md §4.1)
// ============================================

export interface FoodBeatFormulationItemPayload {
  stock_uuid: string;
  quantity_realized: number;
  /** Quantidade PREVISTA, calculada no client — `FoodBeatRequest::rules()`
   *  exige `feedstocks.*.quantity` (`required`, correção mecânica
   *  `TASK-FB-03`; `DA-FB-08`, sem recompute server-side). */
  quantity: number;
  percentage: number;
  /** Diferença % (realizado × previsto), calculada no client —
   *  `FoodBeatRequest::rules()` exige `feedstocks.*.difference` (`required`,
   *  mesma correção mecânica). */
  difference: number;
  amount: number;
  total: number;
}

export interface FoodBeatStockItemPayload {
  stock_uuid: string;
  quantity: number;
  amount: number;
  total: number;
}

/** `POST /food-beats` — nomes de campo conforme `FoodBeat-contrato.md §4.1`
 *  (uuid-first: `warehouse_uuid`/`food_uuid`/`product_uuid`, NUNCA `*_id`).
 *  SEM `code` (gerado server-side, `DA-FB-12`) e SEM `user_id` (nunca
 *  enviado, sempre `$request->user()->id` no backend). */
export interface CreateFoodBeatPayload {
  type: FoodBeatType;
  warehouse_uuid: string;
  food_uuid?: string;
  product_uuid?: string;
  date: string;
  quantity: number;
  provider_lot?: string;
  shelf_life?: string;
  feedstocks?: FoodBeatFormulationItemPayload[];
  items?: FoodBeatStockItemPayload[];
}

/**
 * `PUT /food-beats/{uuid}` — SOMENTE `date`.
 *
 * ⚠️ `## 9` Decisão 1 do `FoodBeat-contrato.md` (dono, 2026-08-11): `update()`
 * é fiel ao legado — só a data é persistida. A tela (`TASK-FB-FE-06`)
 * renderiza os demais campos em modo edição, mas **desabilitados de verdade**
 * (não apenas visual) — qualquer alteração neles nunca chega a este payload.
 * Se o dono decidir migrar para edição completa (Opção b, rejeitada em
 * `## 9`), este tipo precisa ser reaberto como Tarefa nova com Roteiro
 * Cirúrgico próprio (o próprio contrato já sinaliza isso).
 */
export interface UpdateFoodBeatPayload {
  date: string;
}

// ⚠️ `DA-FB-08` (`## 1`/`## 9` do contrato, decisão do dono): `amount`/
// `total`/`percentage`/`quantity`/`difference` dos itens
// (`FoodBeatFormulationItemPayload`/`FoodBeatStockItemPayload` acima) são
// gravados EXATAMENTE como o client envia — nenhum recompute server-side. Um
// client malicioso ou um bug de cálculo no front grava custo arbitrário.
// Aceito conscientemente pelo dono; este arquivo de tipos não tenta mitigar
// (não é decisão desta camada).
//
// TASK-FB-FE-08 (fix P0, homologação): `quantity`/`difference` faltavam no
// payload de Formulação — `FoodBeatRequest::rules()` os exige (`required`,
// correção mecânica `TASK-FB-03`) e o front não os enviava, causando 422 ao
// criar Batida do ramo Formulação. Corrigido nesta Tarefa.
