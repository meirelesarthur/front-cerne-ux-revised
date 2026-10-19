// src/@types/v2/Planos/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PLANOS (PlanRole) — API v1 do backend Laravel GB.Cerne.
// TASK-FE-2700 (execução, gatilho "EXECUÇÃO frontend do módulo Planos").
//
// "Casa definitiva" da entidade — absorve e substitui a fatia mínima de
// leitura que vivia em `@/@types/v2/Configuracoes/planRole` (TASK-FE-2600,
// só `PlanRoleListItem`). Este arquivo modela o Resource/Request REAIS
// (verificados por leitura direta do código, `GB.Cerne.Api` em `develop`):
//   `app/Http/Resources/V1/PlanRoleResource.php`
//   `app/Http/Requests/Api/V1/PlanRoleRequest.php`
//
// Campos em INGLÊS (nomenclatura real do Resource) — a Doc Bruta original
// falava `nome`/`valor` (Model, PT), mas o Resource expõe `name`/`price`.
//
// GAP-FE-233 RESOLVIDO (backend, 2026-08-07) — `PlanRoleRequest`/
// `PlanRoleResource` passaram a falar `role_uuid`/`role_uuids[]` (uuid),
// fechando a exceção que quebrava a convenção uuid-na-borda (Lei GB 10).
// Modelados aqui FIELMENTE ao Resource/Request reais:
//   - leitura (`PlanRoleDetail`): `role_uuid` (uuid escalar, Atribuição
//     Principal) + `role` (`{uuid,name}`, mesmo dado com rótulo) +
//     `role_uuids` (`{uuid,name}[]`, Atribuições Adicionais);
//   - escrita (`PlanRolePayload`): `role_uuid` (uuid, `required`) +
//     `role_uuids` (uuid[], `sometimes`) — a Action resolve uuid→id
//     internamente, mesmo padrão de `segment_uuids`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// PLAN ROLE (resposta da API)
// ============================================

/** Fatia mínima de leitura — mantém o select "Plano padrão" de
 * `Configuracoes/Config/index.tsx` funcionando sem over-fetch (mesmo shape
 * de antes, TASK-FE-2600). */
export interface PlanRoleListItem {
  uuid: string;
  name: string;
  price: number;
  interval_days: number;
  is_free: boolean;
  /** GAP-FE-233 — `role.name` já vem eager-loaded no Resource; útil na
   * coluna "Atribuição Principal" da grid sem chamada extra. */
  role: PlanRoleAssignedRole | null;
  animals_limit: number;
}

/** Objeto `role`/item de `role_uuids` aninhado — uuid-na-borda (Lei GB 10,
 * GAP-FE-233 resolvido). */
export interface PlanRoleAssignedRole {
  uuid: string;
  name: string;
}

/** Detalhe completo — todos os campos do `PlanRoleResource::toArray()`. */
export interface PlanRoleDetail {
  uuid: string;
  name: string;
  price: number;
  interval_days: number;
  farm_limit: number | null;
  concurrent_user_limit: number | null;
  is_free: boolean;
  animals_limit: number;
  agriculture_area_limit: number;
  fruitgrowing_area_limit: number;
  /** Atribuição Principal — uuid escalar, sempre presente (relação `role`
   * é eager-loaded pelo Repository; só `null` se o registro nunca teve
   * perfil, o que o `PlanRoleRequest` (`role_uuid` required) não permite
   * criar). */
  role_uuid: string | null;
  role: PlanRoleAssignedRole | null;
  /** Atribuições Adicionais — array de `{uuid,name}`, eager-loaded (`roles`). */
  role_uuids: PlanRoleAssignedRole[];
  segment_uuids: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PlanRolesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PlanRolesListEnvelope {
  success: boolean;
  message: string;
  data: PlanRoleListItem[];
  errors: Record<string, string[]> | null;
  meta: PlanRolesApiPaginationMeta | null;
}

// ============================================
// LOOKUP ENXUTO (GET /plan-roles/options — GAP-TN-12/TASK-TN-10)
// ============================================

/**
 * Shape ENXUTO do `PlanRoleOptionResource` (`ListPlanRoleOptionsAction::
 * handle()`) — universo COMPLETO de planos comerciais, sem filtro/gate de
 * gestão, fora de qualquer farm-context. Campo `nome` (PT — nomenclatura do
 * Model, mirror do legado `PlanRole::get(['id', 'nome'])`) — NÃO confundir
 * com `PlanRoleListItem.name` (EN, Resource do CRUD completo `/plan-roles`).
 */
export interface PlanRoleOptionItem {
  uuid: string;
  nome: string;
}

/** `ApiResponse::success()` — sem paginação, `meta` sempre `null`. */
export interface PlanRoleOptionsListEnvelope {
  success: boolean;
  message: string;
  data: PlanRoleOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

/** Espelha `PlanRoleRequest::rules()` 1:1 (nomes em inglês, contrato real). */
export interface PlanRolePayload {
  name: string;
  price: number;
  interval_days: number;
  farm_limit?: number | null;
  concurrent_user_limit?: number | null;
  is_free: boolean;
  animals_limit: number;
  agriculture_area_limit: number;
  fruitgrowing_area_limit: number;
  /** Atribuição Principal — `required|uuid|exists:roles,uuid` no backend. */
  role_uuid: string;
  /** Atribuições Adicionais — `sometimes|array`, cada item `uuid|exists:roles,uuid`. */
  role_uuids?: string[];
  segment_uuids?: string[];
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface PlanRoleForm {
  uuid?: string;
  name: string;
  price: number;
  interval_days: number;
  farm_limit: number | null;
  concurrent_user_limit: number | null;
  is_free: boolean;
  animals_limit: number;
  agriculture_area_limit: number;
  fruitgrowing_area_limit: number;
  /** Option-based (mirror `city_uuid`/`parent_uuid`) — alimenta o
   * `SelectAsyncPaginate` (busca server-side em `/roles`, TASK-FE-233). */
  role_uuid: Option<string> | null;
  /** Conjunto de uuids selecionados (mirror `role_uuids` de Usuários). */
  role_uuids: string[];
  segment_uuids: string[];
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface PlanRoleFilterForm {
  /** Busca por nome (param `search` do backend, ILIKE). */
  search?: string;
  is_free?: boolean;
}
