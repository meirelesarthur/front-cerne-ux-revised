// src/services/v2/Site/site-public-service.ts
// -----------------------------------------------------------------------------
// Client HTTP DEDICADO + service da página PÚBLICA do Site (visitante final,
// sem login — 97-Esteiras/061, TASK-SITE-09, fundação). Mirror ESTRUTURAL
// COMPLETO de `@/services/v2/Rastreabilidade/traceability-public-service.ts`
// — exigência EXPLÍCITA do roteiro (`03-roteiro-execucao-frontend-site-
// publico.md`, TASK-SITE-09, "ISOLAMENTO OBRIGATÓRIO", mesmo gate 6.1 de
// F-067/RequestQuotation/Budget).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (auditável por grep/lint de import) — este
// arquivo NUNCA importa:
//   - `@/services/api` / `@/services/api-instances` (client autenticado —
//     `withCredentials`, `X-Farm-Id`, interceptor de resposta que redireciona
//     para `/login` em 401)
//   - `@/contexts/AuthContext`, `@/hooks/useAuth`, store de farm (Zustand)
// A instância `publicApi` abaixo é construída do zero com `axios.create()`
// PRÓPRIO — SEM `withCredentials` (rota pública, sem sessão/cookie/Sanctum,
// `061/CONTRATOS/05-ARQUITETURA-endpoint-publico-site.md ## 4`: rota FORA de
// `auth:sanctum`/`farm.context`, sem `permission:`) e SEM QUALQUER
// interceptor — um visitante com sessão de staff aberta em OUTRA aba nunca
// pode ter aquela sessão afetada por esta página, nem esta página pode
// vazar dado de farm-scope indevido.
//
// Contrato confirmado (`061/CONTRATOS/05-ARQUITETURA-endpoint-publico-site.md
// ## 3`/`## 4` — endpoint ENTREGUE, `SitePublicController@show`,
// `routes/api.php` bloco `public`/`throttle:site-public`):
//   GET /api/v1/public/site/{slug}   → PublicSiteData
//   (`{slug}` é PATH PARAM da API — mirror exato do contrato; a rota da
//   PÁGINA em si também usa `/site/:slug` como path param, decisão do
//   front-architect, `05-CONTRATO-TELA-pagina-publica-site.md`
//   "Leitura do dev" item 1 — distinto de `/rastreio?code=`, que usa
//   querystring por constraint de compatibilidade que não existe aqui).
//
// ⚠️ `API_URL` (`@/config/env`, = `VITE_API_PHP_BACK_URL`) JÁ INCLUI o
// prefixo `/api/v1` — o path abaixo é relativo a partir daí (só
// `/public/site/{slug}`), NUNCA repetindo `/api/v1`.
//
// Rate limit dedicado (`throttle:site-public`, 10/min por IP — bucket
// PRÓPRIO, nunca compartilha contador com `throttle:api`/`traceability-
// public`): 429 tratado DEFENSIVAMENTE pelo CHAMADOR (página, TASK-SITE-10+),
// nunca retry automático aqui.
// -----------------------------------------------------------------------------

import axios from 'axios';

import { API_TIMEOUT, API_URL } from '@/config/env';

import type { PublicSiteData } from '@/@types/v2/Site/publico';

// Envelope de SUCESSO real (`ApiResponse::success`) — `data` tipado por
// endpoint, mirror `PublicApiSuccessBody` de `traceability-public-service.ts`.
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

async function getPublicSite(slug: string): Promise<PublicApiSuccessBody<PublicSiteData>> {
  const { data } = await publicApi.get<PublicApiSuccessBody<PublicSiteData>>(
    `/public/site/${slug}`
  );
  return data;
}

export { getPublicSite };
