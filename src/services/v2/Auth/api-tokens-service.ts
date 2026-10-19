// Auth API Tokens Service - API V2
// Baseado no Postman Collection: GB Cerne API v2 > Auth > API Tokens

import type { Response } from '@/@types/response-api';
import api from '@/services/api';

// ============================================
// TYPES
// ============================================

// --- Tipos de Scope ---

export interface TokenPermission {
  id: number;
  name: string;
  method: string;
  tag: string;
  description: string;
}

export interface TokenTeam {
  id: number;
  team_name: string;
}

export interface AvailablePermission {
  id: number;
  name: string;
  method: string;
  description: string;
}

export interface AvailableTeam {
  id: number;
  name: string;
}

export interface AvailablePermissionsResponse {
  permissions: Record<string, AvailablePermission[]>;
  tags: string[];
  teams: AvailableTeam[];
}

// --- Tipos de Token ---

export interface ApiTokenData {
  id: number;
  user_id: number;
  name: string;
  scoped: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked: number;
  permissions: TokenPermission[];
  teams: TokenTeam[];
}

export interface ApiTokensListResponse {
  items: ApiTokenData[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
  limits: ApiTokenLimits;
}

export interface ApiTokenLimits {
  max_tokens: number;
  active_tokens: number;
  team_active_tokens: number;
  remaining: number;
  is_unlimited: boolean;
  context: string;
  context_name: string;
}

export interface CreateApiTokenResponse {
  message: string;
  token: string;
  token_info: {
    id: number;
    name: string;
    scoped: boolean;
    created_at: string;
    last_used_at: string | null;
    prefix: string;
    permissions: TokenPermission[];
    teams: TokenTeam[];
  };
  limits: ApiTokenLimits;
}

export interface CreateApiTokenRequest {
  name: string;
  permission_ids?: number[];
  tags?: string[];
  team_ids?: number[];
}

export interface UpdateApiTokenRequest {
  name?: string;
}

// ============================================
// GET ENDPOINTS
// ============================================

/**
 * GET /api/v2/auth/api-tokens
 * Lista os API tokens do usuário autenticado
 */
export async function getApiTokens() {
  const { data } = await api.V2.get<Response<ApiTokensListResponse>>(
    '/auth/api-tokens'
  );
  return data;
}

/**
 * GET /api/v2/auth/api-tokens/available-permissions
 * Retorna as permissões que o usuário pode atribuir a tokens
 */
export async function getAvailablePermissions() {
  const { data } = await api.V2.get<Response<AvailablePermissionsResponse>>(
    '/auth/api-tokens/available-permissions'
  );
  return data;
}

// ============================================
// POST ENDPOINTS
// ============================================

/**
 * POST /api/v2/auth/api-tokens
 * Cria um novo API token
 */
export async function createApiToken(requestData: CreateApiTokenRequest) {
  const { data } = await api.V2.post<Response<CreateApiTokenResponse>>(
    '/auth/api-tokens',
    requestData
  );
  return data;
}

// ============================================
// PUT ENDPOINTS
// ============================================

/**
 * PUT /api/v2/auth/api-tokens
 * Atualiza um API token (token_id enviado no body)
 */
export async function updateApiToken(tokenId: number, requestData: UpdateApiTokenRequest) {
  const { data } = await api.V2.put<Response<ApiTokenData>>(
    '/auth/api-tokens',
    { token_id: tokenId, ...requestData }
  );
  return data;
}

// ============================================
// DELETE ENDPOINTS
// ============================================

/**
 * DELETE /api/v2/auth/api-tokens
 * Revoga um API token (token_id enviado no body)
 */
export async function deleteApiToken(tokenId: number) {
  const { data } = await api.V2.delete(
    '/auth/api-tokens',
    { data: { token_id: tokenId } }
  );
  return data;
}

/**
 * DELETE /api/v2/auth/api-tokens/all
 * Revoga todos os API tokens do usuário
 */
export async function revokeAllApiTokens() {
  const { data } = await api.V2.delete('/auth/api-tokens/all');
  return data;
}
