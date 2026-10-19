// src/@types/v2/Foods/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Formulação" (Food — Fábrica/Ração, TASK-FOOD-FE-01).
// Fundação de dados greenfield no front (nada existia em `src/@types/v2/`
// para `Food`). Mirror estrutural de `Movements/index.d.ts` (mesmo racional
// de fachada CRUD + composição de itens), sobre o Model `Food` (backend
// `Food-contrato.md`, APROVADO 100%, ciclo 3.2).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /foods                    → data: FoodListItem[] (SEM feedstocks —
//                                      Food-contrato.md §4.4 só no detalhe).
//   GET    /foods/{uuid}             → data: FoodDetail (COM feedstocks[],
//                                      cada um com stocks[] de saldo já
//                                      convertido por fator do Product).
//   POST   /foods                    → payload FoodPayload.
//   PUT    /foods/{uuid}             → payload FoodPayload — sync da
//                                      composição (DA-FOOD-06), payload
//                                      SEMPRE completo (não parcial).
//   DELETE /foods/{uuid}             → soft delete.
//   POST   /foods/{uuid}/duplicate   → clona Food + composição.
//   GET    /foods/{uuid}/report      → PDF síncrono (blob).
//
// ⚠️ ACHADO uuid-first NO PAYLOAD DE ESCRITA — RECONCILIADO (não silenciado):
// `Food-contrato.md §4.1`, na sua versão ORIGINAL (ciclo 3, antes desta
// Tarefa fechar), especificava `product_id`/`measurement_id`/
// `feedstocks.*.product_id` validados via `Rule::exists(tabela, 'id')` —
// coluna interna sequencial, NÃO `uuid`. Essa era uma violação real da
// invariante uuid-first do projeto ("UUID exposto, nunca `id` sequencial",
// `GB.Cerne.Api/CLAUDE.md`): o front nunca tem acesso ao `id` interno de
// `Product`/`Measurement` — só `uuid` (via `/products/options`,
// `/measurements`, e qualquer listagem). Esta Tarefa (`TASK-FOOD-FE-01`)
// registrou o achado como "a confirmar antes de `TASK-FOOD-FE-03` fechar" —
// CONFIRMADO E CORRIGIDO no backend na MESMA janela de execução:
// `GAP-22` (`[AVALIADO]`, sem gate do dono — conformidade a invariante já
// aprovada e em produção em `OpeningBalanceRequest`/`RequestPurchaseRequest`)
// + `TASK-FOOD-05` (`✅ [CONCLUÍDO]`, validado por `gb-cerne-api-tester-v2`,
// 2026-08-11) trocaram `FoodRequest`/`FoodData`/`FoodFeedstockData`/4 Actions
// de escrita para aceitar `product_uuid`/`measurement_uuid`/
// `feedstocks.*.product_uuid`/`feedstocks.*.measurement_uuid` — NUNCA `*_id`.
// `Food-contrato.md §4.1` já está RECONCILIADO com este desenho (Ciclo 3.2).
// `FoodPayload`/`FoodFeedstockPayload` abaixo JÁ usam os nomes de campo
// CORRETOS e validados (`product_uuid`/`measurement_uuid`) — não os nomes
// originais/stale que a redação inicial desta própria Tarefa citava. Nenhum
// Gap novo aberto por este Executor — achado já resolvido e testado no
// backend antes deste arquivo ser escrito.
//
// `FoodForm`/`FoodFeedstockItemForm` (React Hook Form) mantêm os nomes de
// campo EXATOS ao legado (`product_id`, `measurement_id`,
// `feedstock_product_id`, `measurements`, `percentage` — Food-contrato.md
// §6, fidelidade de nome/ordem/regra ao Blade legado) — nomes de campo RHF
// são internos ao formulário, DIFERENTES do nome de campo no payload de
// rede (`product_uuid`/`measurement_uuid`); a extração/renomeio acontece na
// tela do formulário (`TASK-FOOD-FE-06`), nunca neste arquivo de tipos.
//
// `percentage` (campo de composição) representa um PERCENTUAL (quando
// `type='P'`) OU uma QUANTIDADE FIXA (quando `type='U'`) — Decisão 1 do
// contrato (`## 9`, fiel ao legado, nome mantido). Tipado `number | string`
// sem renomear; o rótulo de UI muda conforme `type` (regra de tela,
// `TASK-FOOD-FE-06`), o campo não.
//
// `cultivation` tipado literal `null` em `FoodFeedstockItem` (Decisão 5 do
// contrato, `## 9`: campo dormente no schema, nenhuma tela o preenche — NÃO
// é `Option`/Select, não criar seletor de cultivo).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM `FoodType` — união literal inline (mirror `MovementTypeCode` em
// `@/@types/v2/Movements`, decoupling: este arquivo não depende de import
// cruzado de `@/constants/foods/food-type.ts`). `P`=Porcentagem, `U`=Unidade
// (Food-contrato.md §3.3, `FoodTypeEnum`).
// ============================================

export type FoodType = 'P' | 'U';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

/** Mirror `ProductOptionItem` enxuto (`product-service.ts`) — só os 3 campos
 *  que o Resource de Food efetivamente devolve. */
export interface FoodProductRef {
  uuid: string;
  code: string;
  description: string;
}

/** Mirror `ProductMeasurementRef` (`@/@types/v2/Products`) — `description`,
 *  não `name`. */
export interface FoodMeasurementRef {
  uuid: string;
  description: string;
}

export interface FoodUserRef {
  uuid: string;
  name: string;
}

/** Saldo de estoque de 1 matéria-prima em 1 armazém, já convertido por fator
 *  do Product (`ResolveFeedstockStockBalancesAction`, regra 13 da Doc
 *  Bruta) — só presente em `FoodDetail` (via `feedstocks[].stocks[]`). */
export interface FoodFeedstockStockRef {
  warehouse: {
    uuid: string;
    description: string;
  };
  quantity: number;
  average_cost: number;
}

/** Linha de composição (matéria-prima), só em `FoodDetail` — o `index()` não
 *  eager-carrega a composição (mirror `MovementAllocationRow`/
 *  `OpenMovementItemDetail`). */
export interface FoodFeedstockItem {
  uuid: string;
  product: FoodProductRef;
  measurement: FoodMeasurementRef | null;
  /** Percentual OU quantidade fixa, conforme `Food.type` — ver cabeçalho do
   *  arquivo (Decisão 1 do contrato, nome mantido fiel ao legado). */
  percentage: number | string;
  /** Literal `null` — Decisão 5 do contrato (campo dormente, nenhuma tela o
   *  preenche). NÃO tipar como `Option`/Select. */
  cultivation: null;
  stocks: FoodFeedstockStockRef[];
}

// ============================================
// FOOD (resposta da API)
// ============================================

/** `GET /foods` — Food-contrato.md §4.4 (índice, SEM feedstocks). */
export interface FoodListItem {
  uuid: string;
  code: string;
  date: string;
  is_enabled: boolean;
  type: FoodType;
  /** decimal — cautela de tipo mirror `MovementListItem.value` (decimal cast
   *  pode chegar como STRING quando o Resource não força `(float)`). */
  quantity: number | string;
  product: FoodProductRef;
  measurement: FoodMeasurementRef | null;
  user: FoodUserRef | null;
}

/** `GET /foods/{uuid}` — mesmo Resource do índice ACRESCIDO de
 *  `feedstocks[]` (composição + saldo de estoque, Food-contrato.md §4.4). */
export interface FoodDetail extends FoodListItem {
  feedstocks: FoodFeedstockItem[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /foods)
// ============================================

export interface FoodsApiPaginationMeta {
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

export interface FoodsListEnvelope {
  success: boolean;
  message: string;
  data: FoodListItem[];
  errors: Record<string, string[]> | null;
  meta: FoodsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FOOD-FE-05)
// ============================================

export interface FoodFilterForm {
  search?: string;
  product_uuid?: string;
  is_enabled?: '1' | '0';
  type?: FoodType;
}

// ============================================
// REQUEST TYPES (create/update — Food-contrato.md §4.1, RECONCILIADO —
// ver "achado uuid-first" no cabeçalho do arquivo)
// ============================================

/** `feedstocks[]` do payload de escrita — SEM `cultivation_id` (Decisão 5,
 *  campo dormente, nunca enviado pela UI). */
export interface FoodFeedstockPayload {
  product_uuid: string;
  measurement_uuid: string | null;
  percentage: number;
}

/** `POST /foods` / `PUT /foods/{uuid}` — nomes de campo CONFIRMADOS contra
 *  `Food-contrato.md §4.1` RECONCILIADO (`GAP-22`/`TASK-FOOD-05`, ✅). SEM
 *  `code` (gerado server-side, DA-FOOD-05) e SEM `user_id` (nunca enviado,
 *  sempre `$request->user()->id` no backend). */
export interface FoodPayload {
  product_uuid: string;
  date: string;
  is_enabled: boolean;
  type: FoodType;
  measurement_uuid: string | null;
  quantity: number;
  feedstocks: FoodFeedstockPayload[];
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit, TASK-FOOD-FE-06)
// ============================================

/**
 * Linha de composição no RHF — nomes de campo EXATOS ao legado
 * (`feedstock_product_id`, `measurements`, `percentage` — Food-contrato.md
 * §6). `feedstock_product_id` guarda o `Option{label,value}` INTEIRO (uuid
 * no `value`); `measurements` idem, opcional (nullable no contrato).
 */
export interface FoodFeedstockItemForm {
  feedstock_product_id: Option<string> | null;
  measurements: Option<string> | null;
  percentage: number | string;
}

/**
 * Formulário completo (create/edit) — nomes de campo EXATOS ao legado
 * (`product_id`, `measurement_id` — Food-contrato.md §6). SEM `code`
 * (readonly, não é campo RHF) e SEM `user_id` (nunca enviado). A extração do
 * uuid cru de `product_id.value`/`measurement_id.value` para
 * `FoodPayload.product_uuid`/`measurement_uuid` acontece na tela do
 * formulário (`TASK-FOOD-FE-06`), nunca aqui.
 */
export interface FoodForm {
  product_id: Option<string> | null;
  date: string;
  is_enabled: boolean;
  quantity: number | string;
  measurement_id: Option<string> | null;
  type: FoodType;
  feedstocks: FoodFeedstockItemForm[];
}
