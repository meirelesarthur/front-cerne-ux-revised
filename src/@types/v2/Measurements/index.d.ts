// src/@types/v2/Measurements/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de UN. DE MEDIDA (Measurement) — API v1 do backend Laravel
// GB.Cerne. TASK-FE-053 (fundação de dados, sem UI) + TASK-FE-054 (listagem,
// paginação REAL — GAP-BE-043 fechado ✅ CONCLUÍDO, GAP-FE-009 resolvido).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /measurements            → paginação REAL (`ApiResponse::paginated`,
//                                      10/página default, teto 100) — meta
//                                      completo (current_page/last_page/
//                                      per_page/total).
//   GET    /measurements/{uuid}     → data: MeasurementData (mesmo shape flat
//                                      do index).
//   POST   /measurements            → payload MeasurementPayload (create).
//   PUT    /measurements/{uuid}     → payload MeasurementPayload — SEMPRE os
//                                      2 campos (name/description), nunca
//                                      delta — `MeasurementRequest::rules()`
//                                      não diferencia por verbo.
//   DELETE /measurements/{uuid}     → sem try/catch de FK no backend hoje
//                                      (diferente de DeathLoss/PaymentTerm) —
//                                      onError genérico do useRequest cobre.
//
// `Measurement` é o cadastro mestre mais simples da família "Cadastros Base —
// Estrutura": só `name` (Sigla, max 8) + `description` (Descrição, max 100) —
// SEM FK, SEM status/ativo (divergência estrutural intencional, Doc Bruta
// §4/§10 — catálogo "nunca se desativa, só se exclui"). Catálogo GLOBAL (sem
// farm_id/tenant_id) — o header X-Farm-Id continua sendo anexado
// automaticamente pelo interceptor axios global, mas o backend ignora para
// este recurso (rota fora do grupo `farm.context`).
//
// Filtro suportado pelo backend (`MeasurementFilterData`): `search` (ILIKE em
// `name`/`description`) — acréscimo pós-migração (decisão explícita do dev
// no E2E, task-packet de busca): consumido pela tela de listagem via
// FilterSideUnidadeMedida (drawer enxuto, só o campo `search`). O legado não
// tinha busca alguma (Doc Bruta §4/§13) — esta é uma adição consciente, não
// um mirror de fidelidade.
//
// Fonte: TASK-FE-053 (contrato de tela embutido — módulo migrado antes da
// convenção de contrato formal existir em 01-Arquitetura_e_Contratos/).
// -----------------------------------------------------------------------------

// ============================================
// MEASUREMENT (resposta da API)
// ============================================

export interface MeasurementListItem {
  uuid: string;
  name: string;
  description: string;
}

// Mesmo shape flat do `MeasurementListItem` — o Resource é literalmente só
// estes 3 campos (`uuid`/`name`/`description`), sem relacionamento aninhado e
// sem campo extra só-de-detalhe. Nota: `MeasurementResource` NÃO expõe
// `created_at`/`updated_at` hoje (apesar da Doc Bruta §13 confirmar que o
// legado exibia essas 2 colunas na grid) — fora do escopo desta Tarefa.
export type MeasurementData = MeasurementListItem;

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /measurements`) — os 2 campos SEMPRE
// presentes nos dois verbos (`MeasurementRequest::rules()` não diferencia por
// verbo — full-resource-replace, mesmo racional de IdentificationTypePayload).
export interface MeasurementPayload {
  name: string;
  description: string;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface MeasurementForm {
  name: string;
  description: string;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default,
// GAP-BE-043 ✅ CONCLUÍDO — meta sempre completo)
// ============================================

export interface MeasurementsListEnvelope {
  success: boolean;
  message: string;
  data: MeasurementListItem[];
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
// declarado por consistência de assinatura com o resto dos catálogos de
// Cadastros Base)
// ============================================

export interface MeasurementFilterForm {
  /** Busca por `name`/`description` (param `search` do backend, ILIKE). Consumido pela FilterSideUnidadeMedida. */
  search?: string;
}

// ============================================
// GET /measurements/options (TASK-BE-508, aditivo TASK-FE-504) — lookup
// ENXUTO consumido pelo campo `second_measurement_uuid` de Produtos (Aba 2,
// trio `second_measurement_uuid`/`factor_type`/`factor`). Resource dedicado
// (`MeasurementOptionResource`) — shape idêntico a `MeasurementListItem`
// (`uuid`+`name`+`description`), reaproveitado por alias em vez de duplicar
// a interface. SEM gate de `measurements_view`. FLAT (`ApiResponse::success`,
// `meta` sempre `null` — catálogo global pequeno, 56 linhas totais).
// ============================================

export type MeasurementOption = MeasurementListItem;

export interface MeasurementOptionsListEnvelope {
  success: boolean;
  message: string;
  data: MeasurementOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
