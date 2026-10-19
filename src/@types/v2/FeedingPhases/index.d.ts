// src/@types/v2/FeedingPhases/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Fases de Alimentação" (FeedingPhase — Operacional/
// Pecuária/Confinamento, F-034, TASK-FP-FE-01). Fundação de dados espelhando
// 1:1 a estrutura de `@/@types/v2/Diets` (cabeçalho + composição `hasMany` de
// itens), sobre o Model `FeedingPhase`/`ItemFeedingPhase` — shape confirmado
// por leitura direta de `FeedingPhaseResource.php`/`ItemFeedingPhaseResource.php`/
// `FeedingPhaseRequest.php` (`GB.Cerne.Api`,
// `97-Esteiras/051/CONTRATOS/feeding-phases-contrato-migracao.md` §4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /feeding-phases           → data: FeedingPhaseListItem[] (mesmo
//                                      Resource do detalhe — `items` só vem
//                                      preenchido quando a relação é
//                                      carregada, o índice não carrega).
//   GET    /feeding-phases/{uuid}    → data: FeedingPhaseDetail (COM items[]).
//   POST   /feeding-phases           → payload FeedingPhasePayload.
//   PUT    /feeding-phases/{uuid}    → payload FeedingPhasePayload — a
//                                      composição inteira substitui a
//                                      anterior (replace-all, corrige
//                                      OQ-03/FM-07 do legado — SEM `item_id`
//                                      no wire).
//   DELETE /feeding-phases/{uuid}    → soft delete (cascade items).
//   Select de Dieta: REUSA `GET /diets/diet-options` (`@/services/v2/Diets/
//   diet-service`) — não há endpoint próprio de opções aqui.
//
// `code`/`sequence` são SEMPRE server-authoritative (nunca aceitos no
// payload de escrita — `FeedingPhaseRequest::rules()` confirmado por leitura
// direta não os declara). `user_id`/`farm_id` nunca são campos de entrada
// (contexto). Nunca `id` — sempre `uuid`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM — união literal inline (mirror `DietObjective`), decoupling: este
// arquivo não depende de import cruzado de `@/constants/feeding-phase/*`.
// ============================================

/** `PD`=Por Dias, `PP`=Por Peso (`App\Enums\FeedingPhaseChangeRule`). */
export type FeedingPhaseChangeRule = 'PD' | 'PP';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface FeedingPhaseUserRef {
  uuid: string;
  name: string;
}

export interface FeedingPhaseItemChangeRuleRef {
  value: FeedingPhaseChangeRule;
  label: string;
  /** Unidade dinâmica do par min/max — "dias" (PD) ou "kg" (PP), CV-03 —
   *  o front deriva o rótulo daqui, nunca duplica a lógica em JS. */
  unit_label: string;
}

export interface FeedingPhaseItemDietRef {
  uuid: string;
  code: string;
  /** `diet.product.description` quando carregado; `null` se a relação de
   *  produto não veio populada (`ItemFeedingPhaseResource.php`). */
  description: string | null;
}

// ============================================
// ITEM DA FASE (resposta da API) — só em `FeedingPhaseDetail`
// ============================================

export interface FeedingPhaseItemRef {
  uuid: string;
  /** Server-authoritative — posição 1..N atribuída pela Action, nunca
   *  aceita do cliente. */
  sequence: number;
  change_rule: FeedingPhaseItemChangeRuleRef;
  minimum_start: number;
  maximum_end: number;
  diet: FeedingPhaseItemDietRef | null;
}

// ============================================
// FEEDING PHASE (resposta da API)
// ============================================

/** `GET /feeding-phases` — mesmo Resource do detalhe; `items` só vem
 *  populado quando a relação é carregada (o índice não carrega, mirror
 *  `DietListItem` vs `DietDetail`). */
export interface FeedingPhaseListItem {
  uuid: string;
  code: string;
  date: string;
  name: string;
  observation: string | null;
  user: FeedingPhaseUserRef | null;
  items: FeedingPhaseItemRef[];
  created_at: string | null;
  updated_at: string | null;
}

/** `GET /feeding-phases/{uuid}` — mesmo Resource do índice, com `items[]`
 *  sempre populado (composição da fase). */
export interface FeedingPhaseDetail extends FeedingPhaseListItem {
  items: FeedingPhaseItemRef[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /feeding-phases)
// ============================================

export interface FeedingPhasesApiPaginationMeta {
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

export interface FeedingPhasesListEnvelope {
  success: boolean;
  message: string;
  data: FeedingPhaseListItem[];
  errors: Record<string, string[]> | null;
  meta: FeedingPhasesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FP-FE-02) — 3 filtros CORRIGIDOS na API
// (FLT-01..03/CL-31..33: o legado nunca filtrava de fato/quebrava com 500).
// ============================================

export interface FeedingPhaseFilterForm {
  name?: string;
  diet_uuid?: string;
  change_rule?: FeedingPhaseChangeRule;
}

// ============================================
// REQUEST TYPES (create/update — FeedingPhaseData/ItemFeedingPhaseData)
// ============================================

/** `items[]` do payload de escrita — SEM `sequence`/`item_id` (server-
 *  authoritative / replace-all elimina OQ-03/FM-07 do legado). */
export interface FeedingPhaseItemPayload {
  diet_uuid: string;
  change_rule: FeedingPhaseChangeRule;
  minimum_start: number;
  maximum_end: number;
}

/** `POST /feeding-phases` / `PUT /feeding-phases/{uuid}` — nomes de campo
 *  confirmados contra `FeedingPhaseRequest.php`. SEM `code`/`farm_id`/
 *  `user_id` (sempre resolvidos server-side). PUT sempre envia o payload
 *  COMPLETO — a composição inteira substitui a anterior (replace-all). */
export interface FeedingPhasePayload {
  date: string;
  name: string;
  observation: string | null;
  items: FeedingPhaseItemPayload[];
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit, TASK-FP-FE-03)
// ============================================

/**
 * Linha de composição no RHF — `diet_id` guarda o `Option{label,value}`
 * INTEIRO (uuid no `value`, mirror `DietIngredientItemForm.product_id`).
 * `change_rule` guarda o `Option{label,value}` INTEIRO (fábrica derivada da
 * tradução), NÃO a união literal crua — diferente de `DietForm.objective`,
 * pois aqui não há Select estático de poucas opções fixas fora de fábrica.
 */
export interface FeedingPhaseItemForm {
  diet_id: Option<string> | null;
  change_rule: Option<FeedingPhaseChangeRule> | null;
  minimum_start: number | string;
  maximum_end: number | string;
}

/**
 * Formulário completo (create/edit). SEM `code` (readonly, gerado
 * server-side) e SEM `user_id` (nunca enviado) — mirror `DietForm`.
 */
export interface FeedingPhaseForm {
  date: string;
  name: string;
  observation: string;
  items: FeedingPhaseItemForm[];
}
