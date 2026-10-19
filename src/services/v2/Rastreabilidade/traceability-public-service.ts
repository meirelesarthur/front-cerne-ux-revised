// src/services/v2/Rastreabilidade/traceability-public-service.ts
// -----------------------------------------------------------------------------
// Client HTTP DEDICADO + service da página PÚBLICA de rastreio (consumidor
// final, sem login — F-067, `97-Esteiras/058`, TASK-TR-PUB-FE-01, fundação).
// Mirror ESTRUTURAL COMPLETO de `@/services/v2/Budgets/budget-public-service.ts`
// / `@/services/v2/RequestQuotations/request-quotation-public-service.ts` —
// exigência EXPLÍCITA do task-packet e de `CONTRATO-TELA-F067-rastreio-publico.md
// ## 3` (isolamento obrigatório, gate 6.1).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (auditável por grep/lint de import) — este
// arquivo NUNCA importa:
//   - `@/services/api` / `@/services/api-instances` (client autenticado —
//     `withCredentials`, `X-Farm-Id`, interceptor de resposta que redireciona
//     para `/login` em 401)
//   - `@/contexts/AuthContext`, `@/hooks/useAuth`, `@/stores/*Farm*`
// A instância `publicApi` abaixo é construída do zero com `axios.create()`
// PRÓPRIO — SEM `withCredentials` (rota pública, sem sessão/cookie/Sanctum,
// `CONTRATO-DESTINO-F067-rastreio-publico.md ## 1`: fora do grupo
// `['auth:sanctum','user.active','throttle:api']`, sem `farm.context`, sem
// `permission:`) e SEM QUALQUER interceptor — um visitante com sessão de
// staff aberta em OUTRA aba nunca pode ter aquela sessão afetada por esta
// página, nem esta página pode vazar dado de farm-scope indevido.
//
// Contrato confirmado (`CONTRATO-DESTINO-F067-rastreio-publico.md ## 1`/`## 4`
// — endpoint ENTREGUE E VALIDADO, TASK-TR-PUB-01):
//   GET /api/v1/public/traceability/{code}   → PublicTraceabilityData
//   (`{code}` é PATH PARAM da API — mirror exato do contrato; distinto da
//   URL da PÁGINA em si, que usa `?code=` como querystring, `## 3` do
//   contrato de tela — a página lê o code da querystring e o repassa como
//   path param nesta chamada).
//
// ⚠️ SEM parâmetro de idioma na requisição — a API NÃO localiza, devolve
// SEMPRE as 3 variantes (`name_pt/en/es`, `description_pt/en/es`) no mesmo
// payload; a escolha de idioma é 100% client-side (`## 4.3`/`## 6` do
// contrato de tela), sem `Accept-Language`, sem refetch ao trocar idioma
// (idioma FORA da query-key, `## 2` do contrato de tela).
//
// ⚠️ `API_URL` (`@/config/env`, = `VITE_API_PHP_BACK_URL`) JÁ INCLUI o
// prefixo `/api/v1` — o path abaixo é relativo a partir daí (só
// `/public/traceability/{code}`), NUNCA repetindo `/api/v1`.
//
// Rate limit dedicado (`throttle:traceability-public`,
// `CONTRATO-DESTINO-F067-rastreio-publico.md ## 2.5`): 429 tratado
// DEFENSIVAMENTE pelo CHAMADOR (página, TASK-TR-PUB-FE-02+), nunca retry
// automático aqui.
// -----------------------------------------------------------------------------

import axios from 'axios';

import { API_TIMEOUT, API_URL } from '@/config/env';

import type { PublicTraceabilityData } from '@/@types/v2/Rastreabilidade/rastreio-publico';

// Envelope de SUCESSO real (`ApiResponse::success`) — `data` tipado por
// endpoint, mirror `PublicApiSuccessBody` de `budget-public-service.ts`.
interface PublicApiSuccessBody<T> {
  success: boolean;
  message?: string | null;
  data: T;
}

// Client HTTP 100% ISOLADO — ver nota de cabeçalho. NUNCA exportado para uso
// genérico; qualquer novo endpoint público futuro deve ganhar seu PRÓPRIO
// client dedicado, nunca importar este.
const publicApi = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

async function getPublicTraceabilityByCode(
  code: string
): Promise<PublicApiSuccessBody<PublicTraceabilityData>> {
  const { data } = await publicApi.get<PublicApiSuccessBody<PublicTraceabilityData>>(
    `/public/traceability/${code}`
  );
  return data;
}

export { getPublicTraceabilityByCode };
