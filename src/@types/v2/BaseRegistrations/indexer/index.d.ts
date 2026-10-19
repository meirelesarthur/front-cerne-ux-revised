// src/@types/v2/BaseRegistrations/indexer/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de INDEXADORES (Indexer — Cadastros Base / Financeiros).
// TASK-FE-210 (fundação de dados, sem UI). Mirror mecânico de
// `@types/v2/BirthNotes/index.d.ts` + 1 campo (`descriptive`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /indexers            → data: IndexerListItem[], meta REAL
//                                  (`ApiResponse::paginated`, 10/página
//                                  default, teto 100, ordenado por
//                                  `description` asc).
//   GET    /indexers/{uuid}     → data: IndexerData (mesmo shape flat do
//                                  index).
//   POST   /indexers            → payload IndexerPayload (create).
//   PUT    /indexers/{uuid}     → payload IndexerPayload — SEMPRE os 3
//                                  campos (description/descriptive/
//                                  is_enabled), nunca delta —
//                                  `IndexerRequest::rules()` não diferencia
//                                  por verbo.
//   DELETE /indexers/{uuid}     → 204 SEMPRE que o uuid existir — SEM
//                                  guarda de FK (D8 do contrato de API, §6)
//                                  — `onError` genérico do `useRequest`
//                                  cobre qualquer 4xx/5xx residual.
//
// Catálogo GLOBAL (sem farm_id/tenant_id) — o header X-Farm-Id continua
// sendo anexado automaticamente pelo interceptor axios global, mas o
// backend ignora para este recurso (rota fora do grupo `farm.context`).
//
// Filtro suportado pelo backend (`IndexerFilterData`): `search` (ILIKE em
// `description` OU `descriptive`, D9 do contrato de API §10) — CONSUMIDO
// pela UI (drawer de filtro, TASK-FE-211) como 1 único campo. `is_enabled`
// também é aditivo no backend mas NÃO consumido por nenhuma tela nesta
// rodada (mesma decisão de fidelidade de `BirthNote`/`IdentificationType`).
//
// Fonte: `Indexer-contrato.md §7/§9/§11/§16`, TASK-FE-210.
// -----------------------------------------------------------------------------

// ============================================
// INDEXER (resposta da API)
// ============================================

export interface IndexerListItem {
  uuid: string;
  description: string;
  descriptive: string;
  is_enabled: boolean;
}

// Mesmo shape flat do `IndexerListItem` — o Resource é literalmente só
// estes 4 campos (`uuid`/`description`/`descriptive`/`is_enabled`), sem
// relacionamento aninhado e sem campo extra só-de-detalhe.
export type IndexerData = IndexerListItem;

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /indexers`) — os 3 campos SEMPRE
// presentes nos dois verbos (`IndexerRequest::rules()` não diferencia por
// verbo — full-resource-replace, mesmo racional de `BirthNotePayload`).
export interface IndexerPayload {
  description: string;
  descriptive: string;
  is_enabled: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface IndexerForm {
  uuid?: string;
  description: string;
  descriptive: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface IndexersListEnvelope {
  success: boolean;
  message: string;
  data: IndexerListItem[];
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
// FILTRO (`search` CONSUMIDO pela UI — drawer de filtro, TASK-FE-211; o
// backend filtra por `description` OU `descriptive`, D9 do contrato de API
// §10, mas a UI continua com 1 único campo. `is_enabled` é aditivo no
// backend mas NÃO consumido nesta rodada.)
// ============================================

export interface IndexerFilterForm {
  /** Busca por `description` OU `descriptive` (param `search` do backend, D9). CONSUMIDO pelo drawer de filtro. */
  search?: string;
}
