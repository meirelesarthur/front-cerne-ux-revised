// -----------------------------------------------------------------------------
// Auth Service — API v1 do backend Laravel GB.Cerne (autenticação híbrida).
//
// O modo é escolhido por VITE_AUTH_MODE (ver src/config/env.ts):
//
// COOKIE (Sanctum SPA stateful, mesmo domínio): NÃO há token Bearer. O login
//   cria uma sessão e o backend devolve um cookie HttpOnly; o navegador o reenvia
//   sozinho (withCredentials). O CSRF é obtido em GET /sanctum/csrf-cookie antes
//   do POST de login — o axios então envia o header X-XSRF-TOKEN.
//
// TOKEN (Bearer, cross-domain): o login manda X-Client-Type: web, o backend
//   devolve `token` no corpo, guardamos no localStorage e o enviamos no header
//   Authorization (interceptor em api.ts). Sem CSRF/cookie.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   POST /auth/login  → data: { user:{uuid,name,email}, farms, active_farm_uuid, token }
//                       (token: null no modo cookie; string JWT-like no modo token)
//   GET  /auth/me     → data: { uuid, name, email, photo, lang, roles[], permissions[] }
//   POST /auth/logout → encerra a sessão (cookie) ou revoga o token (Bearer).
// -----------------------------------------------------------------------------

import axios from 'axios';

import type {
    LoginCredentials,
    LoginResponse,
    UserProfile,
} from '@/@types/auth';
import type { Response } from '@/@types/response-api';
import type { VerifyEmailResponse, ResendVerificationResponse } from '@/@types/v2/Auth/email-verification';
import { AUTH_TOKEN_STORAGE_KEY, IS_TOKEN_AUTH, WEB_CLIENT_TYPE } from '@/config/env';
import api from '@/services/api';

// ============================================
// CSRF (Sanctum SPA)
// ============================================

/** Origem (protocolo+host+porta) do backend — o CSRF fica na RAIZ, fora de /api/v1. */
const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_PHP_BACK_URL as string).origin;
  } catch {
    return '';
  }
})();

let csrfInitialized = false;

/**
 * Garante o cookie XSRF-TOKEN antes de requisições que alteram estado (login).
 * Idempotente: só bate na rede na primeira vez (ou com `force=true`, ex.: após
 * um 419 CSRF token mismatch).
 *
 * No modo TOKEN (Bearer) é um no-op: não há sessão nem CSRF — a autenticação
 * trafega no header Authorization, não em cookie.
 */
export async function ensureCsrfCookie(force = false): Promise<void> {
  if (IS_TOKEN_AUTH) return;
  if (csrfInitialized && !force) return;
  await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true });
  csrfInitialized = true;
}

// ============================================
// TYPES
// ============================================

export interface SessionData {
  id: number;
  ip_address: string;
  user_agent: string;
  device_type?: string;
  browser?: string;
  os?: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
  location?: string;
}

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * POST /api/v1/auth/login
 * - Modo COOKIE: garante o CSRF e autentica por cookie de sessão (token: null).
 * - Modo TOKEN: envia X-Client-Type: web para o backend emitir um Bearer token,
 *   retornado em `data.token` (o AuthContext o persiste via saveAccessToken).
 * Retorna { user, farms, active_farm_uuid, token } no envelope ApiResponse.
 */
export async function login(credentials: LoginCredentials) {
  await ensureCsrfCookie(); // no-op no modo token

  const config = IS_TOKEN_AUTH
    ? { headers: { 'X-Client-Type': WEB_CLIENT_TYPE } }
    : undefined;

  return api.V2.post<Response<LoginResponse>>(
    '/auth/login',
    {
      email: credentials.email,
      password: credentials.password,
    },
    config,
  );
}

/**
 * POST /api/v2/auth/register
 * Registra novo usuário
 */
export async function register(data: {
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  country: string;
  region: string;
  language: string;
  referral_code?: string;
}) {
  return await api.V2.post<Response<any>>('/auth/register', data);
}

/**
 * POST /api/v1/auth/logout
 * Encerra a sessão no backend (invalida o cookie) e limpa o estado local.
 * Limpa o storage mesmo se a chamada falhar (ex.: já deslogado / offline).
 */
export async function logout() {
  try {
    await api.V2.post('/auth/logout');
  } finally {
    clearAuthStorage();
  }
}

// ============================================
// PERFIL DO USUÁRIO
// ============================================

/**
 * GET /api/v1/auth/me
 * Perfil do usuário autenticado (sessão via cookie): uuid, name, email, photo,
 * lang, roles[] e permissions[]. Usado para hidratar o AuthContext.
 */
export async function getUserProfile() {
  return api.V2.get<Response<UserProfile>>('/auth/me');
}

/**
 * PUT /api/v1/me/favorites — replace-set idempotente (GAP-BE-023).
 * Envia o CONJUNTO COMPLETO de rotas favoritas (inclusive rotas legadas
 * desconhecidas pela SPA, que devem ser preservadas pelo chamador).
 */
export async function updateFavorites(routes: string[]) {
  return api.V2.put<Response<{ favorites: string[] }>>('/me/favorites', {
    favorites: routes,
  });
}

/**
 * PATCH /api/v2/auth/email
 * Altera email do usuário
 */
export async function updateEmail(email: string) {
  const { data } = await api.V2.patch<Response<any>>('/auth/email', { email });
  return data;
}

/**
 * PATCH /api/v2/auth/username
 * Altera username do usuário
 */
export async function updateUsername(username: string) {
  const { data } = await api.V2.patch<Response<any>>('/auth/username', { username });
  return data;
}

/**
 * POST /api/v2/auth/forgot-password
 * Solicita recuperação de senha
 */
export async function forgotPassword(email: string) {
  return await api.V2.post<Response<any>>('/auth/forgot-password', { email });
}

/**
 * DELETE /api/v2/auth/account
 * Deleta conta do usuário
 */
export async function deleteAccount() {
  const { data } = await api.V2.delete('/auth/account');
  return data;
}

// ============================================
// SESSÕES
// ============================================

/** Mapeia dados brutos da API para SessionData do frontend */
function mapSessionFromApi(raw: any): SessionData {
  const userdata = raw.userdata || {};
  return {
    id: raw.id,
    ip_address: userdata.ip || raw.ip_address || '',
    user_agent: userdata.user_agent || raw.user_agent || '',
    device_type: raw.device_type,
    browser: raw.browser,
    os: raw.os,
    is_current: raw.is_current ?? false,
    last_activity: raw.creation_date || raw.last_activity || raw.created_at || '',
    created_at: raw.creation_date || raw.created_at || '',
    location: raw.location,
  };
}

/**
 * GET /api/v2/auth/sessions
 * Obtém histórico de sessões (resposta paginada da API)
 */
export async function getSessions(): Promise<Response<SessionData[]>> {
  const { data } = await api.V2.get<Response<any>>('/auth/sessions');
  const items = data.data?.items || data.data || [];
  const sessions = Array.isArray(items) ? items.map(mapSessionFromApi) : [];
  return { ...data, data: sessions };
}

/**
 * GET /api/v2/auth/sessions-active
 * Obtém sessões ativas (resposta paginada da API)
 */
export async function getActiveSessions(): Promise<Response<SessionData[]>> {
  const { data } = await api.V2.get<Response<any>>('/auth/sessions-active');
  const items = data.data?.items || data.data || [];
  const sessions = Array.isArray(items) ? items.map(mapSessionFromApi) : [];
  return { ...data, data: sessions };
}

/**
 * DELETE /api/v2/auth/session
 * Deleta uma sessão específica
 */
export async function deleteSession(sessionId: number) {
  const { data } = await api.V2.delete('/auth/session', {
    data: { session_id: sessionId },
  });
  return data;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

/**
 * Limpa dados de autenticação do localStorage
 */
export function clearAuthStorage() {
  localStorage.removeItem('app-token');
  localStorage.removeItem('app-refresh-token');
  localStorage.removeItem('app-user');
  localStorage.removeItem('app-permissions');
  localStorage.removeItem('app-token-expires-at');
  localStorage.removeItem('app-user-profile');
  localStorage.removeItem('app-active-farm');
}

/**
 * Salva tokens no localStorage
 */
export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('app-token', accessToken);
  localStorage.setItem('app-refresh-token', refreshToken);
}

/**
 * Salva o access token (Bearer) no localStorage — modo token.
 */
export function saveAccessToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

/**
 * Obtém access token do localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

/**
 * Obtém refresh token do localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('app-refresh-token');
}

/**
 * Salva dados do usuário no localStorage
 */
export function saveUser(user: any) {
  localStorage.setItem('app-user', JSON.stringify(user));
}

/**
 * Obtém usuário do localStorage
 */
export function getStoredUser() {
  const userStr = localStorage.getItem('app-user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Verifica se usuário está autenticado (tem token)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ============================================
// VERIFICAÇÃO DE EMAIL
// ============================================

/**
 * GET /api/v2/auth/verify-email?token={token}
 * Confirma o email do usuário usando o token enviado por email.
 */
export async function verifyEmail(token: string) {
  const { data } = await api.V2.get<Response<VerifyEmailResponse>>(
    '/auth/verify-email',
    { token }
  );
  return data;
}

/**
 * POST /api/v2/auth/resend-verification
 * Reenvia o email de verificação para o usuário autenticado.
 * Rate limit: 1 por minuto.
 */
export async function resendVerificationEmail() {
  const { data } = await api.V2.post<Response<ResendVerificationResponse>>(
    '/auth/resend-verification'
  );
  return data;
}
