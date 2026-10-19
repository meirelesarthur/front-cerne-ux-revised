import axios, { AxiosInstance } from 'axios';

import { IS_COOKIE_AUTH } from '@/config/env';
import { installDevMocks } from '@/mocks/dev-api';

const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

/**
 * Flags de credencial dependem do modo de autenticação (ver src/config/env.ts):
 *
 * Modo COOKIE (Sanctum SPA, mesmo domínio):
 * - `withCredentials: true` faz o navegador enviar/receber o cookie de sessão
 *   HttpOnly e o cookie `XSRF-TOKEN` em toda requisição.
 * - `withXSRFToken: true` é OBRIGATÓRIO no axios >= 1.6: por segurança, o axios
 *   parou de anexar o header `X-XSRF-TOKEN` automaticamente em requisições
 *   CROSS-ORIGIN (front :5173 → API :8080 são origens distintas). Sem esta flag,
 *   o axios lê o cookie XSRF-TOKEN mas NÃO envia o header → o VerifyCsrfToken do
 *   Laravel vê CSRF ausente e o login falha. Com ela, o header vai junto.
 *
 * Modo TOKEN (Bearer, cross-domain):
 * - Não há cookie: a autenticação vai no header `Authorization: Bearer` (setado
 *   no interceptor de request em api.ts). `withCredentials`/`withXSRFToken` ficam
 *   `false` — não há cookie de sessão nem CSRF para trafegar entre domínios.
 */
const axiosInstanceV2: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_PHP_BACK_URL,
  timeout,
  withCredentials: IS_COOKIE_AUTH,
  withXSRFToken: IS_COOKIE_AUTH,
  headers: {
    Accept: 'application/json',
  },
});

const axiosInstanceCHAT: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ALEEX_BACK_URL,
  timeout,
  withCredentials: IS_COOKIE_AUTH,
  withXSRFToken: IS_COOKIE_AUTH,
  headers: {
    Accept: 'application/json',
  },
});

installDevMocks(axiosInstanceV2); // DEV ONLY (VITE_DEV_MOCKS) — ver src/mocks/dev-api

export {
  axiosInstanceV2,
  axiosInstanceCHAT,
};
