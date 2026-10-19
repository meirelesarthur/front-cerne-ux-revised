// Auth Types - API V2 (GB Cerne)
import type { EndpointPermission, UserTeam, UserTier, UserProfileV2 } from './v2/permissions.d';

// Re-export 2FA types
export type {
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyBackupRequest,
  TwoFactorDisableRequest,
  TwoFactorRegenerateBackupCodesRequest,
  TwoFactorRegenerateBackupCodesResponse,
  TwoFactorMessageResponse,
  TwoFactorRequiredResponse,
} from './v2/two-factor';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  user_id: number;
  /**
   * Uuid do usuário logado (lote 2, Execução 027 — TASK-FE-805). O backend
   * já devolve `uuid` em `/auth/me` (ver `auth-service.ts`), mas este campo
   * nunca havia sido capturado no front — adicionado para permitir a grid de
   * Usuários esconder ações de linha (Redefinir Senha/Desativar conta) na
   * própria linha do usuário autenticado, sem inventar/mockar o dado.
   */
  uuid: string;
  email: string;
  username: string;
  /**
   * URL pública da foto do usuário (Execução 071, TASK-071-FE-02, SRF-071-12).
   * Vem de `profile.photo_url` (`GET /auth/me`, contrato API §4 — aditivo,
   * mesma regra de `ProfileResource.photo_url`). `null` sem foto — o
   * consumidor cai no fallback de iniciais (`Avatar.Fallback`), nunca em
   * outro placeholder (DEF-09 resolvido).
   */
  photoUrl: string | null;
}

// Re-export tipos de permissões V2 para compatibilidade
export type { EndpointPermission as Permission, UserTeam as Team, UserTier, UserProfileV2 };

// Resposta completa do usuário da API /auth/me (versão simplificada para compatibilidade)
export interface UserProfile extends Partial<UserProfileV2> {
  id?: number;
  user_id: number;
  email: string;
  username: string;
  external_user?: number | boolean;
  created_at?: string;
  last_updated_at?: string;
  updated_at?: string;
  login_count?: number;
  queue_prio?: number;
  deleted?: number | boolean;
  deleted_at?: string | null;
  tier_id?: number;
  tier?: UserTier;
  teams?: UserTeam[];
  country?: string;
  region?: string;
  language?: string;
  assigned_models?: Array<{ model_name: string; model_alias: string }>;
  assigned_agents?: string[];
  assigned_agents_count?: number;
}

// Tokens retornados no login
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Resposta do login: data.user + data.tokens
export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data: LoginResponse | UserProfile | RefreshTokenResponse;
  statusCode: number;
}

export interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  statusCode: number;
}

// ============================================
// RECUPERAÇÃO DE SENHA
// ============================================

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
