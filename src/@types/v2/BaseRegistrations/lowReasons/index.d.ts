// src/@types/v2/BaseRegistrations/lowReasons/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de MOTIVOS DE BAIXA (LowReason) — API v1 do backend Laravel
// GB.Cerne. Criado em TASK-LR-FE-01 (listagem), completado em TASK-LR-FE-02
// (formulário).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /low-reasons            → data: LowReasonListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total —
//                                     diferente de Species, que nunca pagina).
//   GET    /low-reasons/{uuid}     → data: LowReasonData (mesmo shape flat,
//                                     sem campos extras só-de-detalhe).
//   POST   /low-reasons            → payload LowReasonPayload (create).
//   PUT    /low-reasons/{uuid}     → payload LowReasonPayload — SEMPRE os 3
//                                     campos (description/do_movement/
//                                     is_enabled), nunca delta (diverge de
//                                     Species — LowReasonRequest.rules() exige
//                                     os 3 sempre presentes).
//   DELETE /low-reasons/{uuid}     → 204; 422 estruturado se em uso em
//                                     write_offs ("Motivo de baixa está em uso
//                                     (baixas vinculadas) e não pode ser
//                                     excluído." — DA-LR-04).
//
// `code`: sequencial 6 dígitos zero-padded, GERADO NO SERVIDOR (DA-LR-16,
// `pg_advisory_xact_lock`) — SÓ LEITURA em toda e qualquer tela. Nunca faz
// parte de nenhum payload (create ou update).
//
// `LowReason` é catálogo GLOBAL (sem farm_id/tenant_id, DA-LR-02) — o header
// X-Farm-Id continua sendo anexado automaticamente pelo interceptor axios
// global, mas o backend o ignora para este recurso.
//
// Fonte: `[[01-Arquitetura_e_Contratos/LowReason-contrato]]` (APROVADO, 100%),
// seções 3-4 (endpoints/Resource/Request), lido integralmente em
// TASK-LR-FE-01/02.
// -----------------------------------------------------------------------------

// ============================================
// LOW REASON (resposta da API)
// ============================================

export interface LowReasonListItem {
  uuid: string;
  /** Sequencial 6 dígitos zero-padded, gerado no servidor — SÓ LEITURA, nunca no payload. */
  code: string;
  description: string;
  do_movement: boolean;
  is_enabled: boolean;
}

// TASK-LR-FE-02: mesmo shape flat do `LowReasonListItem` — diferente de
// `CostCenterDetail`, este Resource não adiciona campos extras só-de-detalhe
// (sem categories/apportionments equivalentes). Alias por clareza semântica
// no formulário (mesmo racional documentado na ficha da Tarefa).
export type LowReasonData = LowReasonListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL, diferente de Species)
// ============================================

export interface LowReasonsApiPaginationMeta {
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

export interface LowReasonsListEnvelope {
  success: boolean;
  message: string;
  data: LowReasonListItem[];
  errors: Record<string, string[]> | null;
  meta: LowReasonsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (TASK-LR-FE-02)
// ============================================

export interface LowReasonPayload {
  description: string;
  do_movement: boolean;
  is_enabled: boolean;
  // `code` NUNCA aparece aqui — gerado/imutável no servidor (DA-LR-16). Não
  // entra em nenhum payload, nem create nem update.
}

// ============================================
// REACT HOOK FORM (TASK-LR-FE-02)
// ============================================

export interface LowReasonForm {
  uuid?: string;
  /** Só para EXIBIÇÃO (edição) — nunca no payload, nunca editável pelo usuário. */
  code?: string;
  description: string;
  do_movement: boolean;
  is_enabled: boolean;
}

// ============================================
// FILTRO (drawer da listagem — TASK-LR-FE-01)
// ============================================

export interface LowReasonFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  do_movement?: '' | 'true' | 'false';
}
