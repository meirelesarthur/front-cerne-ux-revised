// src/@types/v2/BaseRegistrations/permission/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Permissões (Permission) — API v1 do backend Laravel
// GB.Cerne, execução 032, TASK-FE-2400. Catálogo técnico GLOBAL do sistema
// (sem `farm_id`/tenancy — mesma exceção de `Bank`/`SystemUpdate`/`Ibpt`).
//
// Fonte: contrato de tela `contrato-front-permissoes.md` §6.1
// (CONTRATO_AUTOAPROVADO).
//
// `show === index` no shape — alias estrutural, mesmo padrão de
// `SystemUpdateDetail`.
// -----------------------------------------------------------------------------

export interface PermissionListItem {
  uuid: string;
  /** slug técnico, ex.: "farms_view" — max 60. */
  name: string;
  /** rótulo humano curto — max 191. */
  description: string;
  /** sempre 'web' hoje — NUNCA exposto no form (contrato de tela §4). */
  guard_name: string;
  created_at: string | null;
  updated_at: string | null;
}

// show === index no shape (alias estrutural, sem agregação extra).
export type PermissionDetail = PermissionListItem;

// ============================================
// REQUEST TYPES
// ============================================

export interface PermissionPayload {
  name: string;
  description: string;
  // guard_name OMITIDO de propósito — backend default 'web' (contrato de
  // tela §4).
}

// ============================================
// REACT HOOK FORM (TASK-FE-2402 — campos do formulário)
// ============================================

export interface PermissionForm {
  uuid?: string;
  name: string;
  description: string;
}

export interface PermissionFilterForm {
  /** só existe porque §7.2 do contrato de tela foi aprovada (default: adicionar). */
  search?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PermissionsApiPaginationMeta {
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

export interface PermissionsListEnvelope {
  success: boolean;
  message: string;
  data: PermissionListItem[];
  errors: Record<string, string[]> | null;
  meta: PermissionsApiPaginationMeta | null;
}
