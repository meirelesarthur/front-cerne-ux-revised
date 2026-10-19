// src/@types/v2/BaseRegistrations/diagnosticTechnique/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de TÉCNICAS DIAGNÓSTICO (DiagnosticTechnique) — API v1 do
// backend Laravel GB.Cerne. TASK-FE-017 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /diagnostic-techniques            → data: DiagnosticTechniqueListItem[],
//                                               meta SEMPRE null (`index()` usa
//                                               `ApiResponse::success()`, nunca
//                                               `::paginated()` — catálogo pequeno,
//                                               sem paginação real, mesmo racional
//                                               de Species).
//   GET    /diagnostic-techniques/{uuid}     → data: DiagnosticTechniqueData
//                                               (mesmo shape flat do index, sem
//                                               campo extra só-de-detalhe).
//   POST   /diagnostic-techniques            → payload DiagnosticTechniquePayload
//                                               (create).
//   PUT    /diagnostic-techniques/{uuid}     → payload DiagnosticTechniquePayload —
//                                               SEMPRE os 2 campos (description/
//                                               is_enabled), nunca delta — mesmo
//                                               racional de updateLowReason
//                                               (`DiagnosticTechniqueRequest::rules()`
//                                               não diferencia por verbo), NÃO o
//                                               delta parcial de updateSpecie.
//   DELETE /diagnostic-techniques/{uuid}     → 204, físico (sem soft-delete); sem
//                                               checagem de dependência de aplicação
//                                               nesta camada (`onError` genérico do
//                                               `useRequest` cobre — mesmo
//                                               tratamento de Species/LowReason).
//
// `DiagnosticTechnique` é o cadastro mestre MAIS SIMPLES da família "Cadastros
// Base — Pecuários": só `description` + `is_enabled` — SEM FK (diferente de
// Species, que tem `cost_center_uuid`), SEM campo gerado no servidor (diferente
// de LowReason, que tem `code`), SEM segundo booleano (diferente de LowReason,
// que tem `do_movement`). Catálogo GLOBAL (sem farm_id/tenant_id) — o header
// X-Farm-Id continua sendo anexado automaticamente pelo interceptor axios
// global, mas o backend ignora para este recurso (rota fora do grupo
// `farm.context`).
//
// Filtro suportado pelo backend (`DiagnosticTechniqueFilterData`): SOMENTE
// `search` (ILIKE em `description`). NÃO existe filtro `is_enabled` aceito
// pela API — não fabricar esse campo em `DiagnosticTechniqueFilterForm`.
//
// Fonte: `[[01-Arquitetura_e_Contratos/DiagnosticTechnique/DiagnosticTechnique-contrato]]`
// (APROVADO, v1.1), §5/§9 (endpoints/Resource) + leitura direta de
// `GB.Cerne.Api` (`DiagnosticTechniqueRequest.php`/`DiagnosticTechniqueResource.php`/
// `DiagnosticTechniqueRepository.php`/`DiagnosticTechniqueFilterData.php`),
// TASK-FE-017.
// -----------------------------------------------------------------------------

// ============================================
// DIAGNOSTIC TECHNIQUE (resposta da API)
// ============================================

export interface DiagnosticTechniqueListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

// Mesmo shape flat do `DiagnosticTechniqueListItem` — o Resource é literalmente
// só estes 3 campos (`uuid`/`description`/`is_enabled`), sem relacionamento
// aninhado e sem campo extra só-de-detalhe.
export interface DiagnosticTechniqueData {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /diagnostic-techniques`) — os 2 campos
// SEMPRE presentes nos dois verbos (`DiagnosticTechniqueRequest::rules()` não
// diferencia por verbo — full-resource-replace, mesmo racional de
// LowReasonPayload, NÃO o delta opcional de SpeciePayload).
export interface DiagnosticTechniquePayload {
  description: string;
  is_enabled: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface DiagnosticTechniqueForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::success — SEM paginação real)
// ============================================

export interface DiagnosticTechniqueListEnvelope {
  success: boolean;
  message: string;
  data: DiagnosticTechniqueListItem[];
  errors: Record<string, string[]> | null;
  /** SEMPRE null — `index()` nunca usa `ApiResponse::paginated()`. */
  meta: null;
}

// ============================================
// FILTRO (drawer da listagem — TASK-FE-018)
// ============================================

export interface DiagnosticTechniqueFilterForm {
  /** Busca por `description` (param `search` do backend). NENHUM outro filtro é aceito pela API. */
  search?: string;
}
