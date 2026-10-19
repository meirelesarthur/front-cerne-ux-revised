// src/@types/v2/OpenMovements/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Saldo Inicial" (OpenMovement — Cadastros Base /
// Financeiros, execução 031, TASK-FE-031-35). Fachada REST dedicada
// `/api/v1/open-movements` sobre o Model genérico `Movement` (contrato de API
// §1) — só `index`/`show`/`store`/`destroy`, SEM `update` (o legado nunca
// teve edição de Saldo Inicial, veredito confirmado pelo Documentor + dono).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /open-movements          → data: OpenMovementListItem[] (SEM
//                                      `items[]` — o `index()` do legado não
//                                      eager-carrega o rateio, mirror fiel),
//                                      meta paginação REAL (front controla via
//                                      `per_page`, default desta tela = 10).
//   GET    /open-movements/{uuid}   → data: OpenMovementDetail (COM `items[]`).
//   POST   /open-movements          → payload OpenMovementPayload. `type`/
//                                      `type_category`/`appropriation`/
//                                      `farm_id`/`code` NÃO existem no DTO do
//                                      backend — são fixados 100% pela Action
//                                      (contrato de API §6/§9), nunca
//                                      enviados por este payload.
//   DELETE /open-movements/{uuid}   → 204.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`; o
// service (TASK-FE-031-35) não manipula o header manualmente.
//
// `value`/`interest` (Movement, decimal(10,2)) e `items[].value`
// (movement_category, decimal(12,2)): mesma cautela já documentada em
// `AccountListItem.limit`/`.balance` (`@/@types/v2/CadastrosBase/account`) —
// um cast `decimal:2` do Model pode chegar como STRING do backend quando o
// Resource não força `(float)`. Tipados aqui como `number | string`;
// consumidores (grid/detalhe) SEMPRE fazem `Number(...)` antes de
// formatar/somar, nunca tratam como number cru. O formulário de criação
// (TASK-FE-031-37) não sofre esse risco — ali o valor é 100% client-side
// (`NumberInput`/RHF), nunca lido de volta do servidor.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API)
// ============================================

export interface OpenMovementAccountRef {
  uuid: string;
  bank: string;
  agency: string;
  account: string;
}

export interface OpenMovementProprietaryRef {
  uuid: string;
  name: string;
}

export interface OpenMovementItemCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

export interface OpenMovementItemCostCenterRef {
  uuid: string;
  code: string;
  description: string;
}

/** Linha do rateio, só em `OpenMovementDetail` (o `index()` não eager-carrega `categories`). */
export interface OpenMovementItemDetail {
  financial_category: OpenMovementItemCategoryRef;
  /** `null` quando o pivot não tem centro de custo (a API devolve null; ex.: legado). */
  cost_center: OpenMovementItemCostCenterRef | null;
  /** decimal(12,2) — ver cautela de tipo no cabeçalho do arquivo. */
  value: number | string;
}

// ============================================
// OPEN MOVEMENT (resposta da API)
// ============================================

export interface OpenMovementListItem {
  uuid: string;
  code: string;
  account: OpenMovementAccountRef;
  date: string;
  /** decimal(10,2) — ver cautela de tipo no cabeçalho do arquivo. */
  value: number | string;
  /** decimal(10,2) — ver cautela de tipo no cabeçalho do arquivo. */
  interest: number | string;
  document: string | null;
  note: string | null;
  proprietary: OpenMovementProprietaryRef | null;
  created_at: string;
  updated_at: string;
}

/** `GET /open-movements/{uuid}` — mesmo Resource do índice ACRESCIDO de `items[]` (contrato de API §11). */
export interface OpenMovementDetail extends Omit<OpenMovementListItem, 'account'> {
  /** `null` quando a conta não está carregada/existe (o Resource devolve null). */
  account: OpenMovementAccountRef | null;
  items: OpenMovementItemDetail[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /open-movements)
// ============================================

export interface OpenMovementsApiPaginationMeta {
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

export interface OpenMovementsListEnvelope {
  success: boolean;
  message: string;
  data: OpenMovementListItem[];
  errors: Record<string, string[]> | null;
  meta: OpenMovementsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-FE-031-36)
// ============================================

/**
 * Persistido em `paginatedQuery.filter` (drawer + storage) — guarda o par
 * uuid+label de `account_uuid`/`proprietary_uuid` para re-hidratar o drawer
 * ao reabrir (mirror `OpeningBalanceFilterForm.product_uuid/product_label`).
 * `*_label` NUNCA é enviado à API — `index.tsx` achata este tipo para
 * `ListOpenMovementsParams` (`toRequestFilter`) antes de chamar
 * `listOpenMovements`.
 */
export interface OpenMovementFilterForm {
  start_date?: string;
  end_date?: string;
  account_uuid?: string;
  account_label?: string;
  proprietary_uuid?: string;
  proprietary_label?: string;
}

// ============================================
// REQUEST TYPES (create — contrato de API §6/§7)
// ============================================

export interface OpenMovementItemPayload {
  financial_category_uuid: string;
  cost_center_uuid: string;
  value: number;
}

export interface OpenMovementPayload {
  account_uuid: string;
  date: string;
  value: number;
  /** Omitido quando vazio — backend default `0` (contrato de API §6). */
  interest?: number;
  document?: string | null;
  note?: string | null;
  proprietary_uuid: string;
  items: OpenMovementItemPayload[];
}

// ============================================
// REACT HOOK FORM (formulário de criação, TASK-FE-031-37)
// ============================================

/**
 * Linha do rateio no RHF — `financial_category_uuid`/`cost_center_uuid`
 * guardam o `Option{label,value}` INTEIRO (mesma convenção de
 * `apportionments.*.cost_center_uuid` em `CostCenterForm`,
 * `@/@types/v2/CostCenters`) — a extração do uuid cru para o payload
 * acontece só na tela do formulário.
 */
export interface OpenMovementItemForm {
  financial_category_uuid: Option<string> | null;
  cost_center_uuid: Option<string> | null;
  value: number | null;
}

export interface OpenMovementForm {
  /** `SelectAsyncPaginate` — RHF guarda o `Option{label,value}` inteiro. */
  account_uuid: Option<string> | null;
  /** `SelectCombobox` (endpoint não-paginado) — RHF guarda o `Option{label,value}` inteiro. */
  proprietary_uuid: Option<string> | null;
  date: string;
  value: number | null;
  interest: number | null;
  document: string;
  note: string;
  items: OpenMovementItemForm[];
}
