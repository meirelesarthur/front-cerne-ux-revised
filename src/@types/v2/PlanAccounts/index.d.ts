// src/@types/v2/PlanAccounts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PLANO DE CONTAS — API v1 do backend Laravel GB.Cerne.
//
// Contrato ([[PlanAccount-contrato]], APROVADO v1.2):
//   GET    /api/v1/plan-accounts            → data: PlanAccountListItem[] + meta (paginação, per_page default 15/max 100)
//   GET    /api/v1/plan-accounts/{uuid}     → data: PlanAccountDetail (inclui categories)
//   POST   /api/v1/plan-accounts            → payload PlanAccountPayload (parent_uuid aceito só aqui)
//   PUT    /api/v1/plan-accounts/{uuid}     → payload PlanAccountPayload (parent_uuid PROIBIDO — imutável após criar)
//   DELETE /api/v1/plan-accounts/{uuid}     → 204 (falha com message de negócio se houver dependentes — DA-PA-05)
//
// TASK-PA-03a (listagem) cobriu `PlanAccountListItem`/`PlanAccountDetail`/
// filtro. Esta Tarefa (TASK-PA-03b, formulário create/edit + categorias)
// adiciona `PlanAccountPayload`/`PlanAccountForm`, sem alterar o que já
// existia.
//
// `class`/`code` são SEMPRE somente-leitura (DA-PA-01/DA-PA-02 — derivação
// automática por profundidade / gerado no servidor) — por isso NÃO fazem
// parte de `PlanAccountPayload` (nunca entram em nenhum payload de escrita).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { FinancialCategoryRef } from '@/@types/v2/FinancialCategories';

// ============================================
// PLAN ACCOUNT (resposta da API)
// ============================================

export interface PlanAccountRef {
  uuid: string;
  code: string;
  description: string;
}

export interface PlanAccountCodePreview {
  code: string;
  class: 1 | 2;
  class_label: string;
}

export interface PlanAccountListItem {
  uuid: string;
  code: string; // gerado no servidor — DA-PA-02, sempre somente-leitura
  description: string;
  /** 1=Devedor · 2=Credor · 3=Ambos. */
  condition: 1 | 2 | 3;
  condition_label: string;
  /** 1=SYNTHETIC (Sintético) · 2=ANALYTICAL (Analítico) — derivado por profundidade, DA-PA-01, sempre somente-leitura. */
  class: 1 | 2;
  class_label: string;
  /**
   * Enum int-backed no backend (CAPEX=1/OPEX=2, DA-PA-14 —
   * `PlanAccountResource::toArray()` devolve `$this->type?->value`, sempre
   * numérico, nunca a string 'capex'/'opex' — TASK-PA-FIX-03). Nullable —
   * omitir badge de tipo quando `null`.
   */
  type?: 1 | 2 | null;
  type_label?: string | null;
  is_enabled: boolean;
  /** Conta-pai (só uuid/code/description) — null se for raiz. */
  parent: PlanAccountRef | null;
}

// `categories` só vem em detalhe (show/store/update) — mesma convenção de
// `CostCenterDetail` — por isso não faz parte de `PlanAccountListItem`.
// Shape `FinancialCategoryRef` (uuid/code/description) — categorias
// FINANCEIRAS vinculadas (`FinancialCategory`, N:N via `category_uuids`),
// não outras `PlanAccount` (por isso não reaproveita `PlanAccountRef` aqui,
// apesar do shape estrutural idêntico — DA-PA-09).
export interface PlanAccountDetail extends PlanAccountListItem {
  categories: FinancialCategoryRef[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PlanAccountsApiPaginationMeta {
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

export interface PlanAccountsListEnvelope {
  success: boolean;
  message: string;
  data: PlanAccountListItem[];
  errors: Record<string, string[]> | null;
  meta: PlanAccountsApiPaginationMeta | null;
}

// TASK-FE-036-103 (esteira 036, Contas a Pagar) — `GET /plan-accounts/options`,
// mirror `CostCenterOptionsListEnvelope` (Resource enxuto `PlanAccountRef`).
export interface PlanAccountOptionsListEnvelope {
  success: boolean;
  message: string;
  data: PlanAccountRef[];
  errors: Record<string, string[]> | null;
  meta: PlanAccountsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface PlanAccountFilterForm {
  search?: string;
  condition?: '1' | '2' | '3' | '';
  /**
   * Enum int-backed no backend (SYNTHETIC=1/ANALYTICAL=2) — TASK-PA-FIX-02:
   * enviar string ('synthetic') faz `Enum::from()` lançar → HTTP 500. Valor
   * de rede é numérico; o rótulo de UI (Sintético/Analítico) não muda.
   */
  class?: 1 | 2;
  /** Enum int-backed no backend (CAPEX=1/OPEX=2) — mesmo racional de `class` acima. */
  type?: 1 | 2;
  is_enabled?: '' | 'true' | 'false';
  parent_uuid?: string;
  /**
   * Display-only, NUNCA vai à API — só re-hidrata o rótulo (`código —
   * descrição`) da conta-pai no drawer de filtro ao reabrir. Ver
   * `FilterSidePlanAccount.tsx`/`plan-account-service.ts` (whitelist
   * explícita de `ListPlanAccountsParams`, sem spread do filtro).
   */
  parent_label?: string;
}

// ============================================
// FORMULÁRIO CREATE/EDIT (TASK-PA-03b)
// ============================================

// Payload de escrita (POST/PUT) — NUNCA inclui `code`/`class` (DA-PA-01/02,
// somente-leitura, gerados no servidor). `parent_uuid` só é preenchido pela
// tela no modo CREATE (o backend rejeita `prohibited` no update — Seção 4 do
// contrato); no update o campo é omitido do objeto (não enviado como
// `undefined` explícito nem `null`).
export interface PlanAccountPayload {
  description: string;
  condition: 1 | 2 | 3;
  is_enabled: boolean;
  /**
   * Enum int-backed no backend (CAPEX=1/OPEX=2, DA-PA-14) — TASK-PA-FIX-02:
   * enviar string ('capex') faz o Form Request (`Rule::enum()`) rejeitar com
   * 422 "type invalid". O rótulo de UI (CAPEX/OPEX) não muda; só o valor de
   * escrita. Continua nullable (DA-PA-14).
   */
  type?: 1 | 2 | null;
  parent_uuid?: string | null;
  category_uuids?: string[];
}

// React Hook Form — mesma convenção de `CostCenterForm`:
//  - `condition` é STRING no form ('1'|'2'|'3'), convertido para `number` só
//    no submit (`tryPersistPlanAccount`);
//  - `parent_uuid` guarda o par `{ label, value }` completo (componente é
//    `SelectAsyncPaginate`, busca paginada sem lista fechada), reduzido à
//    uuid crua só no payload;
//  - `category_uuids` guarda um ARRAY de `Option<string>` (multi-select REAL
//    — Achado 1 da Tarefa, decisão do dev 2026-07-20), reduzido a
//    `string[]` só no payload.
export interface PlanAccountForm {
  uuid?: string;
  description: string;
  condition?: '1' | '2' | '3';
  is_enabled: boolean;
  /**
   * Valor numérico (backing do enum, TASK-PA-FIX-02/03) — `''` representa
   * "nenhum selecionado" (convertido para `null` só no submit, DA-PA-14). O
   * GET já devolve `type` numérico (ver `PlanAccountListItem.type`); `fillForm`
   * em CreateOrUpdatePlanAccount.tsx só troca `null` por `''` para o Select.
   */
  type?: 1 | 2 | '';
  parent_uuid: Option<string> | null;
  category_uuids: Option<string>[];
}

// ============================================
// IMPORT EXCEL (TASK-PA-08)
// ============================================

// Espelha `App\Data\PlanAccountImportResultData` (backend, TASK-PA-06) —
// contas ausentes da planilha que NÃO foram excluídas por estarem em uso
// (lançamentos/categorias/subcontas vinculadas, mesma guarda de
// `hasDependents()` de `DeletePlanAccountAction`, DA-PA-05). `motivo` é a
// mensagem de negócio já pronta para exibição (não um código a mapear).
export interface PlanAccountImportPreservedItem {
  code: string;
  description: string;
  motivo: string;
}

export interface PlanAccountImportResult {
  created: number;
  updated: number;
  deleted: number;
  preserved: PlanAccountImportPreservedItem[];
}
