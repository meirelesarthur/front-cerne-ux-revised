// src/@types/v2/States/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ESTADOS (State) — API v1 do backend Laravel GB.Cerne.
// Catálogo GLOBAL, somente-leitura (`apiResource(...)->only(['index','show'])`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /api/v1/states          → data: StateListItem[], meta REAL (paginação
//                                  Laravel, `ApiResponse::paginated`, 10/página
//                                  default — ajuste dev 2026-07-23, ver
//                                  AJUSTE-FE-ESTADOS-001; ANTES: `::success()` com
//                                  `meta:null`, back paginou de verdade em paralelo).
//                                  Ordenado por `title` asc. Filtro: só `search`
//                                  (ILIKE em `title`, via `StateFilterData`).
//   GET /api/v1/states/{uuid}   → data: StateData (mesmo shape, sem consumidor nesta
//                                  Tarefa — TASK-FE-021 não expõe hook de detalhe,
//                                  reservado para uso futuro).
//
// Fonte: `State-contrato.md` + leitura direta de `StateController`/`StateRepository`/
// `StateFilterData`/`StateResource` (api_root, branch feature/refactor-cities-states-for-api),
// batidos em TASK-FE-021. Meta REAL: ajuste companheiro do back (paralelo a esta Tarefa).
// -----------------------------------------------------------------------------

// ============================================
// STATE (resposta da API)
// ============================================

export interface StateListItem {
  uuid: string;
  title: string;
  letter: string;
  iso: number;
  slug: string;
  population: number;
}

/** Mesmo shape de StateListItem — reservado para GET /states/{uuid}, sem consumidor nesta Tarefa. */
export type StateData = StateListItem;

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface StatesListEnvelope {
  success: boolean;
  message: string;
  data: StateListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// ============================================
// FILTRO
// ============================================

export interface StateFilterForm {
  /** Busca por `title` (param `search` do backend). NENHUM outro filtro é aceito pela API. */
  search?: string;
}

// ============================================
// OPTIONS (GET /states/options — TASK-FE-980/GAP-FE-182 corrigido: o
// endpoint JÁ EXISTE em produção, `StateController::options()`, rota
// declarada ANTES do `apiResource` em `routes/api.php:274`, SEM gate de
// `states_view` — GAP-BE-040 Opção B, mirror de `/cities/options`). Resource
// dedicado (`StateOptionResource`) devolve só `uuid`+`title`+`letter` — NÃO
// o shape completo de `StateListItem` (que também tem `iso`/`slug`/
// `population`), por isso um tipo `StateOption` dedicado, mais enxuto (mesma
// disciplina de `CostCenterRef`/`FinancialCategoryOption` vs. seus
// `*ListItem` completos). NUNCA usar `StateListItem`/`listStates` (CRUD
// gated) neste lookup.
// ============================================

export interface StateOption {
  uuid: string;
  title: string;
  letter: string;
}

export interface StatesOptionsListEnvelope {
  success: boolean;
  message: string;
  data: StateOption[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}
