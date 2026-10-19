// src/@types/v2/ScheduledReviews/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de REVISÕES AGENDADAS (ScheduledReview) — API v1 do backend
// Laravel GB.Cerne. Listagem GLOBAL, somente-leitura (read-only puro, sem
// CRUD, sem tela de detalhe — TASK-REVAG-FE-01).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /api/v1/scheduled-reviews → data: ScheduledReviewListItem[], meta REAL
//                                    (paginação Laravel, ApiResponse::paginated,
//                                    10/página default). Ordenado por `date`
//                                    DESC NULLS LAST. Filtro: NENHUM (endpoint
//                                    sem filtros — só `page`/`per_page`).
//
// Fonte: contrato-tela-revisoes-agendadas-frontend.md §2/§FE-05 +
// contrato-api-revisoes-agendadas.md (TGT-08 — 4 campos, nem um a mais).
// -----------------------------------------------------------------------------

// ============================================
// SCHEDULED REVIEW (resposta da API)
// ============================================

export interface ScheduledReviewListItem {
  uuid: string;
  equipment_description: string;
  hour_meter_km: number;
  date: string | null;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface ScheduledReviewsListEnvelope {
  success: boolean;
  message: string;
  data: ScheduledReviewListItem[];
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
