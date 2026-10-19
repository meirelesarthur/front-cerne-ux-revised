export const API_URL = import.meta.env.VITE_API_PHP_BACK_URL || 'http://localhost:8080';
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'GB Cerne';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

// ---------------------------------------------------------------------------
// Modo de autenticação
// ---------------------------------------------------------------------------
// 'cookie' = Sanctum SPA stateful: sessão + CSRF, cookie HttpOnly enviado pelo
//   navegador (withCredentials). Exige front e backend no MESMO domínio/site.
// 'token'  = Bearer token: guardado no localStorage e enviado no header
//   Authorization. Funciona cross-domain (front e backend em domínios distintos).
//
// Default SEGURO: 'cookie' (comportamento atual do dev), a menos que
// VITE_AUTH_MODE seja explicitamente 'token' (produção cross-domain).
//
// ATENÇÃO — build Docker "build once, configure on runtime": o Vite inlina
// VITE_AUTH_MODE como LITERAL no bundle; na imagem de produção esse literal é o
// placeholder "__ENV_VITE_AUTH_MODE__", trocado pelo valor real só no START do
// container (docker/40-runtime-env.sh, via sed). Por isso o valor é lido de um
// OBJETO e a decisão é feita em RUNTIME: comparar `import.meta.env.VITE_AUTH_MODE`
// direto a um literal faria o esbuild DOBRAR a expressão em build-time e ELIMINAR
// o placeholder — o bundle ficaria preso em 'cookie' e o env do servidor seria
// ignorado. A leitura via propriedade de objeto não é constant-folded.
export type AuthMode = 'cookie' | 'token';

const authEnv = {
  mode: (import.meta.env.VITE_AUTH_MODE || 'cookie') as string,
};

export const AUTH_MODE: AuthMode = authEnv.mode === 'token' ? 'token' : 'cookie';

export const IS_TOKEN_AUTH = authEnv.mode === 'token';
export const IS_COOKIE_AUTH = !IS_TOKEN_AUTH;

/** Valor de X-Client-Type que sinaliza ao backend para emitir Bearer token ao SPA web. */
export const WEB_CLIENT_TYPE = 'web';

/** Chave do localStorage onde o access token é guardado (modo token). */
export const AUTH_TOKEN_STORAGE_KEY = 'app-token';

// ---------------------------------------------------------------------------
// Planos (PlanRole) — link de cadastro (GAP-FE-234)
// ---------------------------------------------------------------------------
// Sem destino público definido no stack novo ainda (ver `.env.example` e o
// Gap para o histórico completo). Default vazio — `DetalhePlanRole.tsx`
// (TASK-FE-2703) degrada para link relativo/placeholder sem quebrar a tela
// enquanto esta env var estiver vazia.
export const SIGNUP_BASE_URL = import.meta.env.VITE_SIGNUP_BASE_URL || '';

// ---------------------------------------------------------------------------
// Site (link "Ver Site", G-FE-01 — 97-Esteiras/061, TASK-SITE-06)
// ---------------------------------------------------------------------------
// A página pública `website/{slug}` continua servida pelo MONÓLITO legado
// (strangler fig) — a SPA nova ainda não tem equivalente nesta fatia.
// Nenhuma constante de URL do legado existia neste arquivo/`src/constants/`
// antes desta Tarefa (confirmado por grep). Mesma disciplina de degradação
// graciosa de `SIGNUP_BASE_URL`/GAP-FE-234: default vazio — `pages/Site/
// index.tsx` só renderiza o link "Ver Site" quando `published && slug &&`
// esta env var estiverem todos presentes; sem valor configurado, o link
// simplesmente não aparece (comportamento aceitável — o link é "opcional" no
// próprio task-packet, não um bug).
export const LEGACY_PUBLIC_BASE_URL = import.meta.env.VITE_LEGACY_PUBLIC_BASE_URL || '';
