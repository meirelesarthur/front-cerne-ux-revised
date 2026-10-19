// src/@types/v2/Diets/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Dieta" (Diet — Operacional/Pecuária, TASK-FE-DIET-01).
// Fundação de dados greenfield no front (nada existia em `src/@types/v2/`
// para `Diet`). Molde 1:1 de `Foods/index.d.ts` (mesmo racional de fachada
// CRUD + composição de itens), sobre o Model `Diet`/`Ingredient` (backend
// `arquitetura-api-dieta.md` TASK-DIET-API-01, `DietResource`/
// `IngredientResource`/`DietRequest`/`DietData`/`IngredientData` — lidos
// diretamente no worktree `diet-api` para fixar o shape real, não inferido).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /diets                    → data: DietListItem[] (mesmo Resource
//                                      do detalhe — `ingredients` só vem
//                                      preenchido quando a relação é
//                                      carregada, o índice não carrega).
//   GET    /diets/{uuid}             → data: DietDetail (COM ingredients[],
//                                      cada um com stocks[] de saldo já
//                                      convertido por fator do Product quando
//                                      a unidade da linha difere da unidade
//                                      primária — GAP-DIET-01).
//   GET    /diets/diet-options       → data: Option[] (`{value:uuid,
//                                      label:"{code} - {description}"}`,
//                                      SEM paginação — consumido pelo Select
//                                      `diet_id` de Batida).
//   POST   /diets                    → payload DietPayload.
//   PUT    /diets/{uuid}             → payload DietPayload — a composição
//                                      inteira substitui a anterior (mirror
//                                      DA-FOOD-06, sem identidade por uuid —
//                                      `IngredientData` NÃO transporta
//                                      `uuid`, confirmado por leitura direta
//                                      de `ResolveIngredientLinesAction.php`).
//   DELETE /diets/{uuid}             → soft delete (cascade ingredients).
//
// `dry_matter`/`cost_per_kg`/`estimated_cost` (cabeçalho) e `total` de cada
// `Ingredient` são SEMPRE recalculados server-side (AD-06) — o front nunca
// os envia no payload de escrita (`DietPayload`/`DietIngredientPayload` não
// os transportam) e só os exibe como PREVIEW de UX quando calculados
// localmente (TASK-FE-DIET-03).
//
// `type` (Ingredient) é SEMPRE `IngredientType.CORE` ('NU') — GAP-DIET-02,
// achado do backend (`ResolveIngredientLinesAction::ingredientType()`), sem
// mapa produto→tipo. `IngredientType` aqui tipa os 5 casos reais do enum
// (`VO`/`CO`/`NU`/`AD`/`AG`) para a badge de exibição (`type_label` já vem
// pronto do backend) — não para escolha no formulário (não é campo do
// payload de escrita).
//
// `DietForm` (React Hook Form) usa nomes de campo PRÓXIMOS ao payload (não
// há legado Blade equivalente fiel a preservar — Diet é greenfield no FE,
// molde ESTRUTURAL de Food, não nomes 1:1 herdados). Selects usam
// `Option<T>` (mirror `FoodForm`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS — união literal inline (mirror `FoodType`, decoupling: este arquivo
// não depende de import cruzado de `@/constants/diet/*`).
// ============================================

/** `AD`=Adaptação, `CR`=Crescimento, `TE`=Terminação (`DietObjective.php`). */
export type DietObjective = 'AD' | 'CR' | 'TE';

/** `P`=Porcentagem, `U`=Unidade — default server-side `U` (`DietType.php`). */
export type DietType = 'P' | 'U';

/** 5 casos reais do enum (`IngredientType.php`) — GAP-DIET-02: o backend
 *  SEMPRE grava `NU` (Núcleo/CORE); os demais existem no enum mas nunca são
 *  observados na prática até o dono fornecer o mapa produto→tipo. */
export type IngredientType = 'VO' | 'CO' | 'NU' | 'AD' | 'AG';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface DietProductRef {
  uuid: string;
  code: string;
  description: string;
}

/** Mirror `FoodMeasurementRef` — mas o Resource de Dieta devolve `name`,
 *  NÃO `description` (`DietResource.php`/`IngredientResource.php`,
 *  confirmado por leitura direta — divergência real do Resource de Food). */
export interface DietMeasurementRef {
  uuid: string;
  name: string;
}

export interface DietUserRef {
  uuid: string;
  name: string;
}

/** Saldo de estoque de 1 ingrediente em 1 armazém, já convertido para a
 *  unidade de EXIBIÇÃO da linha quando ela difere da unidade primária do
 *  produto (`IngredientResource::stocks()`, GAP-DIET-01/`UnitConverter`) —
 *  só presente em `DietDetail` (via `ingredients[].stocks[]`), consumido
 *  pelo form de Batida (TASK-FE-DIET-06) para exibir saldo disponível. */
export interface DietIngredientStockRef {
  uuid: string;
  warehouse: {
    uuid: string;
    description: string;
  } | null;
  quantity: number;
  average_cost: number;
}

/** Linha de composição (ingrediente), só em `DietDetail` — o `index()` não
 *  eager-carrega a composição (mirror `FoodFeedstockItem`). */
export interface DietIngredientItem {
  uuid: string;
  product: DietProductRef | null;
  measurement: DietMeasurementRef | null;
  /** SEMPRE `'NU'` na prática (GAP-DIET-02) — ver nota de topo do arquivo. */
  type: IngredientType;
  type_label: string;
  dry_matter: number;
  cost_value: number;
  quantity: number;
  /** `quantity * cost_value` — SEMPRE recalculado server-side (AD-06 CV-01). */
  total: number;
  stocks: DietIngredientStockRef[] | null;
}

// ============================================
// DIET (resposta da API)
// ============================================

/** `GET /diets` — mesmo Resource do detalhe; `ingredients` só vem populado
 *  quando a relação é carregada (o índice não carrega, mirror `FoodListItem`
 *  vs `FoodDetail`). */
export interface DietListItem {
  uuid: string;
  code: string;
  date: string;
  objective: DietObjective;
  objective_label: string;
  type: DietType;
  type_label: string;
  /** decimal — cautela de tipo mirror `FoodListItem.quantity` (pode chegar
   *  como STRING quando o cast decimal não força `(float)` em algum ponto). */
  quantity: number | string | null;
  /** Já recalculados server-side (AD-06) — NUNCA ecoam o payload de escrita. */
  dry_matter: number;
  cost_per_kg: number;
  estimated_cost: number;
  observation: string | null;
  product: DietProductRef | null;
  measurement: DietMeasurementRef | null;
  user: DietUserRef | null;
  created_at: string | null;
  updated_at: string | null;
}

/** `GET /diets/{uuid}` — mesmo Resource do índice ACRESCIDO de
 *  `ingredients[]` (composição + saldo de estoque por linha). */
export interface DietDetail extends DietListItem {
  ingredients: DietIngredientItem[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /diets)
// ============================================

export interface DietsApiPaginationMeta {
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

export interface DietsListEnvelope {
  success: boolean;
  message: string;
  data: DietListItem[];
  errors: Record<string, string[]> | null;
  meta: DietsApiPaginationMeta | null;
}

/** `GET /diets/diet-options` — `ApiResponse::success` com `data: Option[]`
 *  pronto (`GetDietOptionsAction`, SEM paginação). */
export interface DietOptionsEnvelope {
  success: boolean;
  message: string;
  data: Option<string>[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FE-DIET-02 — AD-08)
// ============================================

/** `search` — AD-08: ILIKE em `products.description` (o legado mandava
 *  `name`, por isso nunca filtrava, CL-025 — corrigido no contrato da API;
 *  o front SEMPRE envia `search`, nunca `name`). */
export interface DietFilterForm {
  search?: string;
  objective?: DietObjective;
  date?: string;
}

// ============================================
// REQUEST TYPES (create/update — DietData/IngredientData, uuid-first)
// ============================================

/** `ingredients[]` do payload de escrita — SEM `uuid`/`type`/`total`
 *  (confirmado por leitura direta de `IngredientData.php`: o DTO
 *  estruturalmente não transporta esses 3 campos; `type` é sempre `CORE`
 *  gravado pela Action, `total` é sempre recalculado, e a composição inteira
 *  é substituída em cada `PUT` — sem reconciliação por identidade, diferente
 *  de `DietBeat.items`). */
export interface DietIngredientPayload {
  product_uuid: string;
  measurement_uuid: string;
  dry_matter: number;
  cost_value: number;
  quantity: number;
}

/** `POST /diets` / `PUT /diets/{uuid}` — nomes de campo CONFIRMADOS contra
 *  `DietData.php`/`DietRequest.php`. SEM `code`/`farm_id`/`user_id` (sempre
 *  resolvidos server-side) e SEM `dry_matter`/`cost_per_kg`/`estimated_cost`
 *  (AD-06, sempre recalculados a partir de `ingredients`). */
export interface DietPayload {
  product_uuid: string;
  measurement_uuid: string;
  quantity: number;
  date: string;
  objective: DietObjective;
  type: DietType;
  observation: string | null;
  ingredients: DietIngredientPayload[];
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit, TASK-FE-DIET-03)
// ============================================

/**
 * Linha de composição no RHF — `product_id`/`measurement_id` guardam o
 * `Option{label,value}` INTEIRO (uuid no `value`), mirror
 * `FoodFeedstockItemForm`. `total` é PREVIEW de UX (client-side,
 * `quantity*cost_value`, AD-06) — nunca enviado no payload (o schema/tela
 * o calcula via `useWatch`, não é campo persistido aqui).
 */
export interface DietIngredientItemForm {
  product_id: Option<string> | null;
  measurement_id: Option<string> | null;
  dry_matter: number | string;
  cost_value: number | string;
  quantity: number | string;
}

/**
 * Formulário completo (create/edit) — `product_id`/`measurement_id`
 * (cabeçalho) guardam `Option{label,value}` INTEIRO; `objective`/`type` são
 * uniões literais cruas (mirror `FoodForm.type`), não `Option` (Select
 * simples de poucas opções estáticas). SEM `code` (readonly, gerado
 * server-side) e SEM `user_id` (nunca enviado).
 */
export interface DietForm {
  product_id: Option<string> | null;
  measurement_id: Option<string> | null;
  quantity: number | string;
  date: string;
  objective: DietObjective;
  type: DietType;
  observation: string;
  ingredients: DietIngredientItemForm[];
}
