// src/@types/v2/BaseRegistrations/identificationTypes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de TIPOS DE IDENTIFICAÇÃO (IdentificationType) — API v1 do
// backend Laravel GB.Cerne. TASK-FE-037 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /identification-types            → data: IdentificationTypeListItem[],
//                                              meta REAL (`ApiResponse::paginated`,
//                                              10/página default, teto 100, ordenado
//                                              por `description` asc) — diferente de
//                                              DiagnosticTechnique (meta sempre null).
//   GET    /identification-types/{uuid}     → data: IdentificationTypeData (mesmo
//                                              shape flat do index).
//   POST   /identification-types            → payload IdentificationTypePayload
//                                              (create).
//   PUT    /identification-types/{uuid}     → payload IdentificationTypePayload —
//                                              SEMPRE os 2 campos (description/
//                                              is_enabled), nunca delta —
//                                              `IdentificationTypeRequest::rules()`
//                                              não diferencia por verbo, mesmo
//                                              racional de updateDiagnosticTechnique.
//   DELETE /identification-types/{uuid}     → 204; 422 estruturado
//                                              (BusinessRuleException) se em uso
//                                              pelas FKs animal_id_animal/
//                                              birth_animal_id_animal — `onError`
//                                              genérico do `useRequest` cobre.
//
// `IdentificationType` é o cadastro mestre mais simples da família "Cadastros
// Base — Pecuários": só `description` + `is_enabled` — SEM FK, SEM campo
// gerado no servidor. Catálogo GLOBAL (sem farm_id/tenant_id) — o header
// X-Farm-Id continua sendo anexado automaticamente pelo interceptor axios
// global, mas o backend ignora para este recurso (rota fora do grupo
// `farm.context`).
//
// Filtro suportado pelo backend (`IdentificationTypeFilterData`): `search`
// (ILIKE em `description`) e `is_enabled` — ambos aditivos, NENHUM consumido
// pela UI nesta rodada (decisão de fidelidade ao legado, ver TASK-FE-038).
//
// Fonte: `IdentificationType-contrato.md` §7/§9/§10/§11, TASK-FE-037.
// -----------------------------------------------------------------------------

// ============================================
// IDENTIFICATION TYPE (resposta da API)
// ============================================

export interface IdentificationTypeListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

// Mesmo shape flat do `IdentificationTypeListItem` — o Resource é literalmente
// só estes 3 campos (`uuid`/`description`/`is_enabled`), sem relacionamento
// aninhado e sem campo extra só-de-detalhe.
export type IdentificationTypeData = IdentificationTypeListItem;

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /identification-types`) — os 2 campos
// SEMPRE presentes nos dois verbos (`IdentificationTypeRequest::rules()` não
// diferencia por verbo — full-resource-replace, mesmo racional de
// DiagnosticTechniquePayload).
export interface IdentificationTypePayload {
  description: string;
  is_enabled: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface IdentificationTypeForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface IdentificationTypesListEnvelope {
  success: boolean;
  message: string;
  data: IdentificationTypeListItem[];
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
// FILTRO (aditivo no backend — NENHUM campo consumido pela UI nesta rodada,
// declarado por consistência de assinatura com `useCustomGridQuery`)
// ============================================

export interface IdentificationTypeFilterForm {
  /** Busca por `description` (param `search` do backend). NÃO consumido por nenhuma tela nesta rodada. */
  search?: string;
  /** Filtro por status (param `is_enabled` do backend). NÃO consumido por nenhuma tela nesta rodada. */
  is_enabled?: boolean;
}

// ============================================
// OPTIONS (lookup enxuto — GAP-FE-206, correção pós-E2E 2026-08-03)
// ============================================

// `GET /identification-types/options` (`IdentificationTypeOptionResource`,
// TASK-BE-885) — uuid+label, SEM `idanimal_view`. Achado real desta
// correção: o `index()` (`/identification-types`, usado por
// `listIdentificationTypes`) EXIGE `idanimal_view` — 403 ("Sem opções") no
// Select de Tipo de Identificação (bloco de identificação dinâmica e bloco
// Bezerro) do form de Animal para um operador de rebanho comum.
// `listIdentificationTypes` PERMANECE intocado (tela de administração
// continua usando o índice completo).
export interface IdentificationTypeOptionItem {
  uuid: string;
  label: string;
}

export interface IdentificationTypesOptionsListEnvelope {
  success: boolean;
  message: string;
  data: IdentificationTypeOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
