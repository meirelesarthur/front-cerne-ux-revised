// src/@types/v2/BaseRegistrations/birthNote/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de OBSERVAÇÃO NASCIMENTO (BirthNote — Cadastros Base /
// Pecuária). TASK-FE-100 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /birth-notes            → data: BirthNoteListItem[], meta REAL
//                                     (`ApiResponse::paginated`, 10/página
//                                     default, teto 100, ordenado por
//                                     `description` asc) — mesmo racional de
//                                     IdentificationType.
//   GET    /birth-notes/{uuid}     → data: BirthNoteData (mesmo shape flat do
//                                     index).
//   POST   /birth-notes            → payload BirthNotePayload (create).
//   PUT    /birth-notes/{uuid}     → payload BirthNotePayload — SEMPRE os 2
//                                     campos (description/is_enabled), nunca
//                                     delta — `BirthNoteRequest::rules()` não
//                                     diferencia por verbo.
//   DELETE /birth-notes/{uuid}     → 204 SEMPRE que o uuid existir — SEM
//                                     guarda de FK (D6 do contrato de API,
//                                     §6) — `onError` genérico do `useRequest`
//                                     cobre qualquer 4xx/5xx residual.
//
// `BirthNote` é a INTERSEÇÃO de 2 telas-irmãs: `IdentificationType`
// (paginação real) + `DiagnosticTechnique` (filtro `search`, tipo de
// filtro) — mesmo shape exato de 2 campos, SEM FK, SEM campo gerado no
// servidor. Catálogo GLOBAL (sem farm_id/tenant_id) — o header X-Farm-Id
// continua sendo anexado automaticamente pelo interceptor axios global, mas
// o backend ignora para este recurso (rota fora do grupo `farm.context`).
//
// Filtro suportado pelo backend (`BirthNoteFilterData`): `search` (ILIKE em
// `description`) — CONSUMIDO pela UI (drawer de filtro, TASK-FE-101, D2 do
// Maestro). `is_enabled` também é aditivo no backend mas NÃO consumido por
// nenhuma tela nesta rodada (mesma decisão de fidelidade de
// `IdentificationType`) — não incluído aqui para não sugerir um Select que
// nenhuma tela renderiza.
//
// Fonte: `BirthNote-contrato.md` §7/§9/§10/§11/§16, TASK-FE-100.
// -----------------------------------------------------------------------------

// ============================================
// BIRTH NOTE (resposta da API)
// ============================================

export interface BirthNoteListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

// Mesmo shape flat do `BirthNoteListItem` — o Resource é literalmente só
// estes 3 campos (`uuid`/`description`/`is_enabled`), sem relacionamento
// aninhado e sem campo extra só-de-detalhe.
export type BirthNoteData = BirthNoteListItem;

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /birth-notes`) — os 2 campos SEMPRE
// presentes nos dois verbos (`BirthNoteRequest::rules()` não diferencia por
// verbo — full-resource-replace, mesmo racional de IdentificationTypePayload).
export interface BirthNotePayload {
  description: string;
  is_enabled: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface BirthNoteForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface BirthNotesListEnvelope {
  success: boolean;
  message: string;
  data: BirthNoteListItem[];
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
// FILTRO (`search` CONSUMIDO pela UI — drawer de filtro, TASK-FE-101; D2 do
// Maestro. `is_enabled` é aditivo no backend mas NÃO consumido nesta rodada.)
// ============================================

export interface BirthNoteFilterForm {
  /** Busca por `description` (param `search` do backend). CONSUMIDO pelo drawer de filtro. */
  search?: string;
}

// ============================================
// BIRTH NOTE OPTIONS (mirror `EmployeeOption`/`EmployeeOptionsListEnvelope`)
// — lookup ENXUTO `GET /birth-notes/options`, SEM gate de
// `permission:birth_note_view` (UT-000729 — quem cria Nascimento sem a
// permissão de gestão de Observação de Nascimento tomava 403 em
// `listBirthNotes`/`GET /birth-notes` e o select ficava vazio). FLAT — a
// resposta NÃO é paginada (`ApiResponse::success`, `meta: null` sempre).
// ============================================

export interface BirthNoteOptionItem {
  uuid: string;
  description: string;
}

export interface BirthNoteOptionsListEnvelope {
  success: boolean;
  message: string;
  data: BirthNoteOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
