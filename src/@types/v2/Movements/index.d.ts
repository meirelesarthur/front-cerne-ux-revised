// src/@types/v2/Movements/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Mov. Caixa/Bancário" (Movement — Financeiro, TASK-MV-FE-01).
// Fundação de dados greenfield no front (nada existia em `src/@types/v2/` para
// `Movement`) sobre o Model `Movement` já parcialmente migrado pela fatia
// "Saldo Inicial" (`@/@types/v2/OpenMovements`, contrato de API §0). Mirror
// estrutural de `OpenMovements/index.d.ts` (mesmo Model), acrescido do
// cabeçalho completo (22 campos) e do rateio de 5 colunas
// (Movement-contrato-tela.md §2/§4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /movements                    → data: MovementListItem[]  (SEM
//                                           allocations/destination_account/
//                                           client/provider/farm_uuid/
//                                           generated_obligation_draft —
//                                           Movement-contrato.md §2.4).
//   GET    /movements/{uuid}              → data: MovementDetail (COM
//                                           allocations[] e demais campos).
//   POST   /movements                     → payload MovementPayload.
//   PUT    /movements/{uuid}               → payload MovementPayload
//                                           (estratégia "apagar e recriar" —
//                                           a resposta devolve um `uuid`
//                                           DIFERENTE do usado na URL,
//                                           Movement-contrato-tela.md §2.6;
//                                           o front NUNCA reusa o uuid antigo
//                                           pós-update).
//   PATCH  /movements/{uuid}/allocation    → payload MovementAllocationPayload
//                                           (só `allocations[]`, recalcula
//                                           sobre o `value` ATUAL do
//                                           movimento, não reabre o
//                                           cabeçalho).
//   DELETE /movements/{uuid}               → 204.
//
// `code`/`appropriation` NUNCA vão no payload de escrita — sempre gerados
// pelo servidor (Movement-contrato.md §2, campos #1/#17). `type` expõe só
// E/S nesta tela; `type_category` expõe só E/S/T/F (nunca `I`, tratado pela
// fatia Saldo Inicial) — ver `@/constants/Financial/movement/movement-status`
// (fonte do enum) e as fábricas de opção em
// `@/constants/Financial/movement/options/`. Union type declarada INLINE
// aqui (mirror `AccountTypeCode` em `@/@types/v2/CadastrosBase/account`) para
// este arquivo não depender de import cruzado de `constants/`.
//
// `value`/`interest`/`total_allocated`/linha `.value` tipados `number | string`
// na LEITURA — mesma cautela já documentada em `OpenMovementListItem.value`
// (decimal cast pode chegar como STRING quando o Resource não força
// `(float)`). Consumidores (grid/detalhe) SEMPRE fazem `Number(...)` antes de
// formatar/somar. O formulário de criação/edição não sofre esse risco — ali
// o valor é 100% client-side (RHF/NumberInput), nunca lido de volta do
// servidor antes do submit.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// Enums de escrita/leitura de `type`/`type_category` — união literal inline,
// mirror exato do contrato (Movement-contrato.md §2, campos #3/#4).
// ============================================

export type MovementTypeCode = 'E' | 'S';
export type MovementTypeCategoryCode = 'E' | 'S' | 'T' | 'F';
/** Tipo de categoria como vem na LISTAGEM: acrescenta `I` (linha de Saldo
 *  Inicial, somente leitura nesta tela). */
export type MovementListTypeCategoryCode = MovementTypeCategoryCode | 'I';
/** Opções do filtro "Tipo Cat." (legado: E, S, T, F — sem `I`). Só configura
 *  o lookup de Categoria; NUNCA é enviado como filtro de linha. */
export type MovementFilterCategoryType = MovementTypeCategoryCode;

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface MovementAccountRef {
  uuid: string;
  bank: string;
  agency: string;
  account: string;
}

export interface MovementProprietaryRef {
  uuid: string;
  name: string;
}

/** A API agora expõe `name` junto do `uuid` (Movement-contrato-tela.md §1,
 *  Risco 1 revisto) — o form de edição usa o `name` direto, sem lookup
 *  adicional (`getClientByUuid` removido). */
export interface MovementClientRef {
  uuid: string;
  name: string | null;
}

/** A API agora expõe `name` junto do `uuid` — mesma revisão de `MovementClientRef`
 *  (`getProviderByUuid` removido). */
export interface MovementProviderRef {
  uuid: string;
  name: string | null;
}

export interface MovementAllocationCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

export interface MovementAllocationCenterRef {
  uuid: string;
  code: string;
  description: string;
}

export interface MovementAllocationPlanAccountRef {
  uuid: string;
  code: string;
  description: string;
}

export interface MovementAllocationHarvestRef {
  uuid: string;
  description: string;
}

/** Linha do rateio, só em `MovementDetail` (o `index()` não eager-carrega o
 *  rateio, mirror `OpenMovementItemDetail`). */
export interface MovementAllocationRow {
  category: MovementAllocationCategoryRef;
  center: MovementAllocationCenterRef | null;
  plan_account: MovementAllocationPlanAccountRef | null;
  harvest: MovementAllocationHarvestRef | null;
  /** decimal — ver cautela de tipo no cabeçalho do arquivo. */
  value: number | string;
}

/** Rascunho do título gerado (Expense/Income) devolvido no payload de
 *  resposta — Decisão #9 do contrato de API (buffer de sessão substituído
 *  por payload stateless). Condicional, só presente quando o servidor
 *  recalcula `generates_obligation=true`. */
export interface MovementGeneratedObligationDraft {
  type: 'expense' | 'income';
  note: string | null;
  amount: number | string;
  provider_uuid: string | null;
  client_uuid: string | null;
  proprietary_uuid: string | null;
  interest: number | string | null;
  dt_emission: string;
  movement_uuid: string;
  /** API r2 (T-OBR-3): Apropriação sugerida (2 = Indireta, legado L6). Opcional
   *  — ausente em respostas antigas. */
  appropriation?: number | null;
}

// ============================================
// MOVEMENT (resposta da API)
// ============================================

/** `GET /movements` — Movement-contrato.md §2.4. */
export interface MovementListItem {
  uuid: string;
  code: string;
  date: string;
  type: MovementTypeCode;
  type_category: MovementListTypeCategoryCode;
  account: MovementAccountRef;
  proprietary: MovementProprietaryRef | null;
  /** decimal(10,2) — ver cautela de tipo no cabeçalho do arquivo. */
  value: number | string;
  /** decimal(10,2) — ver cautela de tipo no cabeçalho do arquivo. */
  interest: number | string;
  document: string | null;
  note: string | null;
  fiscal_document: boolean;
  generates_obligation: boolean;
  /** decimal — soma real do rateio desde o 1º paint (Decisão #3, bug do
   *  legado "Total Rateado" corrigido). */
  total_allocated: number | string;
  created_at: string;
  updated_at: string;
  // ---- Campos da API r2 (plano API r2 §10.1) — OPCIONAIS no tipo: o front
  // usa o campo quando existe e cai em derivação segura quando a API (ainda)
  // não o devolve. ----
  /** Valor com sinal (S negativo), decimal em string. */
  signed_value?: number | string;
  /** Linha de Saldo Inicial: somente leitura nesta tela. */
  is_opening_balance?: boolean;
  is_mirror?: boolean;
  is_account?: boolean;
  is_reconciled?: boolean;
  /** Quantidade de títulos (Contas a Pagar/Receber) gerados por este movimento. */
  generated_obligations_count?: number;
}

/** `GET /movements/{uuid}` — mesmo Resource do índice ACRESCIDO de
 *  `destination_account`/`farm_uuid`/`client`/`provider`/`allocations[]`/
 *  `generated_obligation_draft?` (Movement-contrato.md §2.3). */
export interface MovementDetail extends MovementListItem {
  destination_account: MovementAccountRef | null;
  farm_uuid: string | null;
  client: MovementClientRef | null;
  provider: MovementProviderRef | null;
  allocations: MovementAllocationRow[];
  generated_obligation_draft?: MovementGeneratedObligationDraft;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /movements)
// ============================================

export interface MovementsApiPaginationMeta {
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
  /** API r2 §10.1 — totais da página (opcional enquanto a API não os expõe). */
  page_totals?: MovementsPageTotals | null;
}

/** `meta.page_totals` (API r2 §10.1) — totais SÓ da página devolvida. */
export interface MovementsPageTotals {
  interest: number | string;
  net_value: number | string;
}

export interface MovementsListEnvelope {
  success: boolean;
  message: string;
  data: MovementListItem[];
  errors: Record<string, string[]> | null;
  meta: MovementsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

/**
 * Persistido em `paginatedQuery.filter` (drawer + storage) — guarda o par
 * uuid+label das FKs de filtro para re-hidratar o drawer ao reabrir (mirror
 * `OpenMovementFilterForm.account_uuid/account_label`). `*_label` NUNCA é
 * enviado à API.
 */
export interface MovementFilterForm {
  start_date?: string;
  end_date?: string;
  account_uuid?: string;
  account_label?: string;
  proprietary_uuid?: string;
  proprietary_label?: string;
  type?: MovementTypeCode;
  /** "Tipo Cat." — nome de FORM/persistência (a API não conhece esta chave;
   *  não filtra linhas, só restringe as opções de Categoria). */
  category_type?: MovementFilterCategoryType;
  category_uuid?: string;
  category_label?: string;
  harvest_uuid?: string;
  harvest_label?: string;
  value_min?: number;
  value_max?: number;
}

// ============================================
// REQUEST TYPES (create/update/allocation — Movement-contrato.md §2.1/§2.2)
// ============================================

export interface MovementAllocationPayload {
  category_uuid: string;
  center_uuid: string;
  plan_account_uuid?: string | null;
  harvest_uuid?: string | null;
  value: number;
}

/** `POST /movements` / `PUT /movements/{uuid}` — nomes de campo EXATOS
 *  confirmados em `MovementRequest.php` (Movement-contrato.md §2.1).
 *  `code`/`appropriation` NUNCA entram aqui — sempre gerados pelo servidor. */
export interface MovementPayload {
  date: string;
  type: MovementTypeCode;
  type_category: MovementTypeCategoryCode;
  account_uuid: string;
  /** Obrigatório só quando `type_category === 'T'` — Movement-contrato-tela.md §2.1. */
  destination_account_uuid: string | null;
  farm_uuid: string | null;
  proprietary_uuid: string | null;
  client_uuid: string | null;
  provider_uuid: string | null;
  value: number;
  interest?: number;
  document: string | null;
  note: string | null;
  fiscal_document: boolean;
  generates_obligation?: boolean;
  allocations: MovementAllocationPayload[];
  /** TASK-MES-FE-05 (execução 044, Meses Conciliados) — extensão ADITIVA e
   *  OPCIONAL (`CONTRATO-API-MESES §3.1`): marca o `Movement` como já
   *  conciliado quando criado a partir do dialog "Novo Lançamento" da
   *  Conciliação OFX. Ausente/`undefined` preserva 100% do comportamento
   *  atual de `CreateOrUpdateMovimento.tsx` (que não envia este campo). */
  is_reconciled?: boolean;
}

/** `PATCH /movements/{uuid}/allocation` — só `allocations[]`, nenhum campo
 *  de cabeçalho (Movement-contrato.md §2.2). */
export interface MovementAllocationRequestPayload {
  allocations: MovementAllocationPayload[];
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit)
// ============================================

/**
 * Linha do rateio no RHF — `category_uuid`/`center_uuid`/`plan_account_uuid`/
 * `harvest_uuid` guardam o `Option{label,value}` INTEIRO (mesma convenção de
 * `OpenMovementItemForm.financial_category_uuid`) — a extração do uuid cru
 * para o payload acontece só na tela do formulário. `category_uuid`/
 * `center_uuid` obrigatórios; `plan_account_uuid`/`harvest_uuid` opcionais
 * (Movement-contrato-tela.md §4).
 */
export interface MovementAllocationItemForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  plan_account_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  value: number | null;
}

/** Formulário completo (create/edit — 22 campos, Movement-contrato-tela.md §2/§5). */
export interface MovementForm {
  date: string;
  /** `Option{label,value}` inteiro — fábrica `movementTypeOptions` (só E/S). */
  type: Option<MovementTypeCode> | null;
  /** `Option{label,value}` inteiro — fábrica `movementTypeCategoryOptions` (E/S/T/F). */
  type_category: Option<MovementTypeCategoryCode> | null;
  account_uuid: Option<string> | null;
  /** Só habilitado/exigido quando `type_category.value === 'T'`. */
  destination_account_uuid: Option<string> | null;
  farm_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  value: number | null;
  interest: number | null;
  document: string;
  note: string;
  fiscal_document: boolean;
  generates_obligation: boolean;
  allocations: MovementAllocationItemForm[];
}

/** Formulário dedicado de edit-rateio (`PATCH .../allocation`) — SEM
 *  cabeçalho editável, mirror `MovementAllocationEditor` reusado
 *  (Movement-contrato-tela.md §4, "Reuso"). */
export interface MovementAllocationForm {
  allocations: MovementAllocationItemForm[];
}
