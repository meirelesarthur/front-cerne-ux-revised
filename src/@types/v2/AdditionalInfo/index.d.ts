// src/@types/v2/AdditionalInfo/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de INFORMAÇÕES COMPLEMENTARES (AdditionalInfo) — API v1 do
// backend Laravel GB.Cerne. Criado em TASK-AI-03 (listagem paginada real +
// filtro + exclusão), completado em TASK-AI-04 (formulário create/edit).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /additional-info            → data: AdditionalInfoListItem[] + meta
//                                         REAL de paginação (ApiResponse::
//                                         paginated(), current_page/last_page/
//                                         per_page/total).
//   GET    /additional-info/{uuid}     → data: AdditionalInfoData (TASK-AI-04).
//   POST   /additional-info            → payload AdditionalInfoPayload
//                                         (TASK-AI-04).
//   PUT    /additional-info/{uuid}     → payload AdditionalInfoPayload —
//                                         SEMPRE os 3 campos, nunca delta
//                                         (TASK-AI-04).
//   DELETE /additional-info/{uuid}     → 204; 422 estruturado se em uso em
//                                         nature_operations ("Informação
//                                         Complementar está em uso e não pode
//                                         ser excluída." — DeleteAdditionalInfoAction).
//
// `AdditionalInfo` NÃO TEM FK própria — apenas `description`/`info`/
// `is_active`, sem nenhum select assíncrono (ver TASK-AI-03, seção "Correção
// de premissa": é o inverso, `NatureOperation` — ainda legado — tem a FK para
// `AdditionalInfo`).
//
// `AdditionalInfo` é FARM-SCOPED (`tenant_id`+`farm_id`, DA-AI-02,
// HasFarmTenantScope canônico) — diferente de `LowReason`/`TypeTitle`
// (catálogos globais). O header X-Farm-Id, anexado automaticamente pelo
// interceptor axios global, é RESPEITADO pelo backend aqui. `tenant_id`/
// `farm_id` nunca entram em nenhum tipo/payload do cliente (DA-AI-09,
// resolvidos no backend via FarmContext).
//
// Fonte: `[[01-Arquitetura_e_Contratos/AdditionalInfo-contrato]]` (APROVADO,
// 100%), seções 2-4 (Schema/Endpoints/Camadas), lido integralmente em
// TASK-AI-03/04.
// -----------------------------------------------------------------------------

// ============================================
// ADDITIONAL INFO (resposta da API)
// ============================================

export interface AdditionalInfoListItem {
  uuid: string;
  description: string;
  info: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface AdditionalInfosApiPaginationMeta {
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

export interface AdditionalInfosListEnvelope {
  success: boolean;
  message: string;
  data: AdditionalInfoListItem[];
  errors: Record<string, string[]> | null;
  meta: AdditionalInfosApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem — TASK-AI-03)
// ============================================

export interface AdditionalInfoFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_active?: '' | 'true' | 'false';
}

// ============================================
// REQUEST TYPES (TASK-AI-04)
// ============================================

// Mesmo shape flat do `AdditionalInfoListItem` — GET /additional-info/{uuid}
// devolve o mesmo Resource do index(), sem campos extras só-de-detalhe.
export type AdditionalInfoData = AdditionalInfoListItem;

export interface AdditionalInfoPayload {
  description: string;
  info: string;
  is_active: boolean;
  // `tenant_id`/`farm_id` NUNCA aparecem aqui — resolvidos no backend via
  // FarmContext (DA-AI-09). O form nem os conhece.
}

// ============================================
// REACT HOOK FORM (TASK-AI-04)
// ============================================

export interface AdditionalInfoForm {
  uuid?: string;
  description: string;
  info: string;
  is_active: boolean;
}
