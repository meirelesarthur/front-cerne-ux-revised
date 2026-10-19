// src/@types/v2/Configuracoes/help/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Tutoriais" (Help) — API v1 do backend Laravel GB.Cerne
// (TASK-HP-06, contrato `Help-contrato.md`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /helps                     → data: HelpData[] + meta de paginação
//                                        (ApiResponse::paginated), filtro
//                                        opcional `permission_uuid`
//   GET    /helps/{uuid}              → data: HelpData
//   POST   /helps                     → payload CreateHelpRequest
//   PUT/PATCH /helps/{uuid}           → payload UpdateHelpRequest (campos
//                                        opcionais — `sometimes` no backend)
//   DELETE /helps/{uuid}              → 204 (sem guarda de FK — nada
//                                        referencia `helps.id`)
//
// `Help` é catálogo GLOBAL (sem `farm_id`/`tenant_id`, Help-contrato §6) — o
// header `X-Farm-Id` continua sendo enviado pelo interceptor axios global
// (`src/services/api.ts`), mas o backend não o usa para este recurso.
//
// Lookup de TELAS (`GET /permissions/screens`, Help-contrato §10) é um
// endpoint DISTINTO, sem gate administrativo, ~200 entradas, SEM paginação —
// alimenta o Select de `permission` do formulário. NUNCA usar
// `HelpData['permission']`/`HelpPermissionRef` para popular esse Select (são
// o vínculo já resolvido de um Help existente, não o catálogo de opções).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// HELP (resposta da API)
// ============================================

/** Permissão/tela vinculada ao Help — mirror de `HelpResource.permission` (Help-contrato §4.5). */
export interface HelpPermissionRef {
  uuid: string;
  name: string;
  /** Ex.: "Visualizar" — descrição da AÇÃO da permissão (não da tela). */
  description: string | null;
  /**
   * Título calculado em runtime pelo backend (`getDescriptionPermission()`,
   * Help-contrato §4.5) — é o rótulo da TELA/módulo (ex.: "Tutoriais"), não
   * da ação. Pode ser `null` se o backend não resolver a árvore de permissão.
   */
  group_title: string | null;
}

export interface HelpData {
  uuid: string;
  url: string;
  permission: HelpPermissionRef | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface HelpsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface HelpsListEnvelope {
  success: boolean;
  message: string;
  data: HelpData[];
  errors: Record<string, string[]> | null;
  meta: HelpsApiPaginationMeta | null;
}

// ============================================
// LOOKUP DE TELAS (GET /permissions/screens — Help-contrato §10)
// ============================================
// Achatada, ~200 entradas, SEM paginação, SEM gate administrativo — mirror
// exato de `checkPermissionsRecursive()` do legado (1 entrada por
// grupo-folha do menu, sempre o slug `_view`). NUNCA usar `/permissions` nem
// `/permissions/tree` para este Select (gate/formato errados).

export interface PermissionScreenOption {
  uuid: string;
  name: string;
  title: string;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface HelpForm {
  url: string;
  /**
   * Select do lookup de telas (`permission-screens-service`) — `value` =
   * `permission.uuid`, `label` = `title` do `/permissions/screens`. Option
   * OBRIGATÓRIO no formulário (Help-contrato não torna `permission_uuid`
   * obrigatório no backend, mas a ficha desta Tarefa exige seleção no form).
   */
  permission: Option<string> | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface HelpFilterForm {
  permission_uuid?: string;
}

export interface HelpFilterRequest {
  permission_uuid?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateHelpRequest {
  url: string;
  permission_uuid: string;
}

/** Todos os campos opcionais — `sometimes` no backend (Help-contrato §4.2). */
export interface UpdateHelpRequest {
  url?: string;
  permission_uuid?: string;
}
