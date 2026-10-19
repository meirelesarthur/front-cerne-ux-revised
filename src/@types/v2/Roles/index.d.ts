// src/@types/v2/Roles/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PERFIS (Roles RBAC) — API v1 do backend Laravel GB.Cerne.
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /roles            → data: RoleListItem[]  + meta de paginação Laravel
//   GET    /roles/{uuid}     → data: RoleDetail (inclui permissions atribuídas)
//   POST   /roles            → payload RolePayload
//   PUT    /roles/{uuid}     → payload RolePayload
//   DELETE /roles/{uuid}     → 204 (falha com message de negócio se em uso)
//   GET    /permissions/tree → data: PermissionTreeGroup[] (árvore hierárquica)
// -----------------------------------------------------------------------------

// ============================================
// ROLE (resposta da API)
// ============================================

export interface RoleTenant {
  uuid: string;
  name: string;
}

export interface RoleListItem {
  uuid: string;
  name: string;
  description: string | null;
  is_user_visible: boolean;
  type: string;
  /** null = perfil global (visível a todos os tenants). */
  tenant: RoleTenant | null;
}

export interface RolePermission {
  uuid: string;
  name: string;
  description: string;
}

export interface RoleDetail extends RoleListItem {
  /** Permissões ATRIBUÍDAS ao perfil. */
  permissions: RolePermission[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface RolesApiPaginationMeta {
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

export interface RolesListEnvelope {
  success: boolean;
  message: string;
  data: RoleListItem[];
  errors: Record<string, string[]> | null;
  meta: RolesApiPaginationMeta | null;
}

// ============================================
// LOOKUP ENXUTO (GET /roles/options — GAP-TN-12/TASK-TN-10)
// ============================================

/**
 * Shape ENXUTO do `RoleOptionResource` (`ListRoleOptionsAction::handle()`) —
 * universo COMPLETO de perfis de PLATAFORMA (`type_user=PLATFORM`,
 * `tenant_id IS NULL`, `is_user_visible=1`), FORA de qualquer farm-context.
 * NÃO confundir com `RoleListItem` (CRUD completo `/roles`, que também tem
 * `is_user_visible`/`type`/`tenant`) — este endpoint não expõe esses campos.
 */
export interface RoleOptionItem {
  uuid: string;
  name: string;
  description: string | null;
}

/** `ApiResponse::success()` — sem paginação, `meta` sempre `null`. */
export interface RoleOptionsListEnvelope {
  success: boolean;
  message: string;
  data: RoleOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface RolePayload {
  name: string;
  description?: string;
  is_user_visible?: boolean;
  /** CONJUNTO COMPLETO de uuids selecionados (folhas com uuid null ficam de fora). */
  permission_uuids?: string[];
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface RoleForm {
  uuid?: string;
  name: string;
  description?: string;
  is_user_visible?: boolean;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface RoleFilterForm {
  /** Busca por nome/descrição (param `search` do backend). */
  search?: string;
}

// ============================================
// ÁRVORE DE PERMISSÕES (GET /permissions/tree)
// ============================================

/**
 * FOLHA da árvore — uma permissão concreta.
 * `uuid: null` = permissão declarada na árvore mas sem seed neste ambiente
 * (drift) — não-selecionável e ignorada no submit.
 */
export interface PermissionTreeLeaf {
  name: string;
  description: string;
  uuid: string | null;
}

/** NÓ DE GRUPO da árvore — agrupa outros grupos e/ou folhas. */
export interface PermissionTreeGroup {
  title: string;
  icon?: string;
  url?: string;
  is_farm?: boolean;
  items: PermissionTreeNode[];
}

export type PermissionTreeNode = PermissionTreeGroup | PermissionTreeLeaf;
