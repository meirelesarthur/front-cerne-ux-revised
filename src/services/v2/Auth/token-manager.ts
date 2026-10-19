// ============================================
// Token Manager - Gerenciamento centralizado de tokens
// ============================================
// Responsável por:
// - Renovação proativa de tokens ANTES da expiração
// - Fila de renovação para evitar chamadas concorrentes (race condition)
// - Detecção de retorno de abas em background
// - Armazenamento e tracking do tempo de expiração

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_PHP_BACK_URL || 'http://localhost:3000/api/v2';

// ============================================
// CONSTANTES
// ============================================

/** Chave do localStorage para armazenar o timestamp de expiração do token */
const TOKEN_EXPIRES_AT_KEY = 'app-token-expires-at';

/**
 * Porcentagem do tempo de vida do token em que a renovação proativa será agendada.
 * 0.75 = renovar quando 75% do tempo tiver passado (faltando 25% para expirar)
 */
const PROACTIVE_REFRESH_THRESHOLD = 0.75;

/**
 * Margem de segurança em ms antes da expiração para considerar o token como "expirando em breve".
 * Usado na verificação de visibilidade da aba.
 */
const EXPIRING_SOON_THRESHOLD_MS = 120 * 1000; // 2 minutos

/**
 * Tempo mínimo em ms para agendar renovação proativa.
 * Evita agendamentos muito curtos.
 */
const MIN_REFRESH_DELAY_MS = 10 * 1000; // 10 segundos

// ============================================
// ESTADO INTERNO
// ============================================

/** Promise de renovação em andamento (para fila de concorrência) */
let refreshPromise: Promise<string | null> | null = null;

/** Timer da renovação proativa */
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

/** Flag de inicialização do listener de visibilidade */
let visibilityListenerInitialized = false;

// ============================================
// STORAGE HELPERS (internos)
// ============================================

function getTokenExpiresAt(): number {
  const value = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  return value ? Number(value) : 0;
}

function saveTokenExpiresAt(expiresInSeconds: number): void {
  const expiresAt = Date.now() + (expiresInSeconds * 1000);
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(expiresAt));
}

function clearTokenExpiry(): void {
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
}

// ============================================
// TOKEN STATUS
// ============================================

/**
 * Verifica se o token está próximo de expirar
 * @param thresholdMs - Margem em ms (padrão: 2 minutos)
 */
export function isTokenExpiringSoon(thresholdMs: number = EXPIRING_SOON_THRESHOLD_MS): boolean {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - thresholdMs;
}

/**
 * Verifica se o token já expirou
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return false;
  return Date.now() >= expiresAt;
}

/**
 * Retorna os milissegundos restantes até a expiração do token
 */
export function getTokenTimeRemaining(): number {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - Date.now());
}

// ============================================
// SALVAMENTO DE TOKENS COM EXPIRAÇÃO
// ============================================

/**
 * Salva tokens e agenda renovação proativa.
 * DEVE ser chamado sempre que novos tokens são recebidos (login, refresh, 2FA).
 *
 * @param accessToken - Access token JWT
 * @param refreshToken - Refresh token
 * @param expiresIn - Tempo de vida do access token em segundos
 */
export function saveTokensWithExpiry(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): void {
  // Salvar tokens no localStorage
  localStorage.setItem('app-token', accessToken);
  localStorage.setItem('app-refresh-token', refreshToken);

  // Salvar timestamp de expiração
  saveTokenExpiresAt(expiresIn);

  // Agendar renovação proativa
  scheduleProactiveRefresh(expiresIn);

  // Inicializar listener de visibilidade (idempotente)
  initVisibilityListener();

  console.log(
    `🔑 [TokenManager] Tokens salvos. Expira em ${expiresIn}s (${Math.round(expiresIn / 60)}min)`,
  );
}

// ============================================
// RENOVAÇÃO DE TOKEN (Com Fila de Concorrência)
// ============================================

/**
 * Renova o access token usando o refresh token.
 *
 * Implementa um padrão de fila (queue): se uma renovação já estiver em andamento,
 * chamadas subsequentes aguardam a mesma promise ao invés de criar
 * requisições duplicadas. Isso previne o race condition de múltiplos 401 simultâneos.
 *
 * @returns O novo access token ou null se a renovação falhar
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Se já existe uma renovação em andamento, retornar a mesma promise
  if (refreshPromise) {
    console.log('🔄 [TokenManager] Renovação já em andamento, aguardando...');
    return refreshPromise;
  }

  refreshPromise = executeRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// MOCK TEMPORÁRIO: auth está mockada (ver src/services/v2/Auth/auth-service.ts) e não
// existe backend real para /auth/refresh responder. Enquanto o mock estiver ativo, a
// renovação proativa gera token fake local em vez de bater rede (evita "Network Error"
// no console a cada ciclo de renovação). Reativar quando a auth real voltar — não
// depende de mudança no AuthContext, só remover este early return.
const TOKEN_REFRESH_DISABLED_MOCK_AUTH = true;

/**
 * Executa a chamada de renovação de token.
 * Usa uma instância axios LIMPA (sem interceptors) para evitar loops e dependências circulares.
 */
async function executeRefresh(): Promise<string | null> {
  try {
    const refreshTokenValue = localStorage.getItem('app-refresh-token');

    if (!refreshTokenValue) {
      console.warn('⚠️ [TokenManager] Sem refresh token disponível');
      return null;
    }

    if (TOKEN_REFRESH_DISABLED_MOCK_AUTH) {
      const fakeAccessToken = `mock-access-token-${Date.now()}`;
      const fakeRefreshToken = `mock-refresh-token-${Date.now()}`;
      await new Promise((resolve) => setTimeout(resolve, 200));
      saveTokensWithExpiry(fakeAccessToken, fakeRefreshToken, 3600);
      console.log('✅ [TokenManager] Token renovado (mock)');
      return fakeAccessToken;
    }

    console.log('🔄 [TokenManager] Renovando token...');

    // Usa axios limpo para evitar passar pelos interceptors da aplicação
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      { refresh_token: refreshTokenValue },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15s timeout
      },
    );

    if (response.data?.success && response.data?.data) {
      const { access_token, refresh_token, expires_in } = response.data.data;

      // Salvar novos tokens com expiração (também reagenda a renovação proativa)
      saveTokensWithExpiry(access_token, refresh_token, expires_in);

      console.log('✅ [TokenManager] Token renovado com sucesso');
      return access_token;
    }

    console.warn('⚠️ [TokenManager] Resposta inválida do refresh');
    return null;
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.message;
    console.error(`❌ [TokenManager] Falha ao renovar token: status=${status} msg=${message}`);
    return null;
  }
}

// ============================================
// RENOVAÇÃO PROATIVA (antes de expirar)
// ============================================

/**
 * Agenda a renovação proativa do token.
 * A renovação será executada quando PROACTIVE_REFRESH_THRESHOLD (75%) do tempo
 * de vida do token tiver passado, garantindo que o token seja renovado
 * ANTES de expirar.
 *
 * @param expiresInSeconds - Tempo de vida do token em segundos
 */
function scheduleProactiveRefresh(expiresInSeconds: number): void {
  // Limpar timer anterior
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  // Calcular quando renovar: no ponto de 75% do tempo de vida
  const refreshAfterMs = Math.max(
    expiresInSeconds * 1000 * PROACTIVE_REFRESH_THRESHOLD,
    MIN_REFRESH_DELAY_MS,
  );

  proactiveRefreshTimer = setTimeout(async () => {
    console.log('⏰ [TokenManager] Renovação proativa iniciada');

    const newToken = await refreshAccessToken();

    if (!newToken) {
      console.warn(
        '⚠️ [TokenManager] Renovação proativa falhou. O interceptor fará fallback no próximo 401.',
      );
      // Não fazemos logout aqui — o interceptor e o session validator tratam o 401
    }
  }, refreshAfterMs);

  const refreshAtDate = new Date(Date.now() + refreshAfterMs).toLocaleTimeString();
  console.log(
    `⏰ [TokenManager] Renovação proativa agendada para ${refreshAtDate} (em ${Math.round(refreshAfterMs / 1000)}s)`,
  );
}

// ============================================
// VISIBILIDADE DA ABA (Tab Focus)
// ============================================

/**
 * Inicializa o listener de visibilidade da aba.
 * Quando o usuário volta para a aba após tê-la em background por muito tempo
 * (onde timers podem ter sido throttled pelo browser), verifica se o token
 * precisa ser renovado imediatamente.
 */
function initVisibilityListener(): void {
  if (visibilityListenerInitialized) return;
  visibilityListenerInitialized = true;

  document.addEventListener('visibilitychange', handleVisibilityChange);
  console.log('👁️ [TokenManager] Listener de visibilidade inicializado');
}

async function handleVisibilityChange(): Promise<void> {
  if (document.visibilityState !== 'visible') return;

  const accessToken = localStorage.getItem('app-token');
  if (!accessToken) return; // Não está logado

  // Se o token já expirou ou está prestes a expirar, renovar imediatamente
  if (isTokenExpired() || isTokenExpiringSoon()) {
    console.log('👁️ [TokenManager] Aba voltou ao foco — token expirado/expirando, renovando...');

    const newToken = await refreshAccessToken();

    if (!newToken) {
      console.warn('⚠️ [TokenManager] Falha ao renovar token ao voltar para aba');
      // Não forçamos logout — o próximo request receberá 401 e o interceptor/session validator trata
    }
  } else {
    const remaining = getTokenTimeRemaining();
    console.log(
      `👁️ [TokenManager] Aba voltou ao foco — token válido (${Math.round(remaining / 1000)}s restantes)`,
    );
  }
}

// ============================================
// INICIALIZAÇÃO E LIMPEZA
// ============================================

/**
 * Inicializa o token manager com base nos tokens já armazenados.
 * Deve ser chamado ao carregar a aplicação (após verifySession confirmar sessão válida).
 *
 * Restaura o agendamento de renovação proativa com base no expires_at salvo.
 * Se o token já estiver expirado, tenta renovar imediatamente.
 */
export function initTokenManager(): void {
  const expiresAt = getTokenExpiresAt();
  const accessToken = localStorage.getItem('app-token');

  if (!accessToken || !expiresAt) {
    // Sem token ou sem expiry salvo — nada a fazer.
    // O próximo refresh (via interceptor) salvará a expiry e ativará o proactive refresh.
    return;
  }

  const remainingMs = expiresAt - Date.now();

  if (remainingMs <= 0) {
    // Token já expirou — renovar imediatamente
    console.log('🔄 [TokenManager] Token expirado na inicialização, renovando...');
    refreshAccessToken();
  } else {
    // Token ainda válido — agendar renovação proativa para metade do tempo restante
    // (diferente do threshold de 75% usado no login, pois aqui pode já ter passado parte do tempo)
    const refreshDelayMs = Math.max(remainingMs * 0.5, MIN_REFRESH_DELAY_MS);

    if (proactiveRefreshTimer) {
      clearTimeout(proactiveRefreshTimer);
    }

    proactiveRefreshTimer = setTimeout(async () => {
      console.log('⏰ [TokenManager] Renovação proativa (re-init) iniciada');
      await refreshAccessToken();
    }, refreshDelayMs);

    console.log(
      `🔑 [TokenManager] Inicializado. Token válido por mais ${Math.round(remainingMs / 1000)}s. ` +
        `Renovação em ${Math.round(refreshDelayMs / 1000)}s`,
    );
  }

  initVisibilityListener();
}

/**
 * Para a renovação proativa e limpa o estado interno do token manager.
 * DEVE ser chamado no logout para evitar timers órfãos.
 */
export function stopTokenManager(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  refreshPromise = null;
  clearTokenExpiry();

  console.log('🛑 [TokenManager] Parado');
}
