// src/services/v2/Budgets/budget-public-service.ts
// -----------------------------------------------------------------------------
// Client HTTP DEDICADO + service da página PÚBLICA de aprovação por hash
// (Budget — Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01
// fundação, consumido pela tela em TASK-BG-FE-06). Mirror ESTRUTURAL COMPLETO
// de `request-quotation-public-service.ts` — exigência EXPLÍCITA de
// `budgets-frontend-contract.md §5.5`: "isolamento obrigatório (mirror
// Public/RequestQuotation/index.tsx) — nenhum import de AuthContext/useAuth/
// store de farm/services/api autenticado".
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (auditável por grep/lint de import) — este
// arquivo NUNCA importa:
//   - `@/services/api` / `@/services/api-instances` (client autenticado —
//     `withCredentials`, `X-Farm-Id`, interceptor de resposta que redireciona
//     para `/login` em 401)
//   - `@/contexts/AuthContext`, `@/hooks/useAuth`, `@/stores/*Farm*`
// A instância `publicApi` abaixo é construída do zero com `axios.create()`
// PRÓPRIO — SEM `withCredentials` (rota pública, sem sessão/cookie,
// `budgets-api-contract.md §4.2`) e SEM QUALQUER interceptor — um 401/403 de
// outra aba/requisição da MESMA sessão do navegador NUNCA pode afetar esta
// página (mesmo risco documentado no precedente `RequestQuotation`).
//
// Contrato confirmado (`budgets-api-contract.md §4.2`):
//   GET /api/v1/public/budgets/{hash}   → PublicBudgetData (ou "Respondido"
//                                          se `status > 2`, CB-52)
//   PUT /api/v1/public/budgets/{hash}   → PublicBudgetAnswerPayload
//
// ⚠️ `API_URL` (`@/config/env`, = `VITE_API_PHP_BACK_URL`) JÁ INCLUI o
// prefixo `/api/v1` — os paths abaixo são relativos a partir daí (só
// `/public/budgets/{hash}`), NUNCA repetindo `/api/v1` (bug corrigido:
// duplicava para `/api/v1/api/v1/public/budgets/{hash}` → 404).
//                                          `{ answer, payment_uuid }`, JSON
//                                          puro (SEM multipart — diferente do
//                                          irmão RequestQuotation, que tem
//                                          upload condicional; Budget não
//                                          tem campo de arquivo na resposta
//                                          pública).
//
// Rate limit (`budgets-frontend-contract.md §7`): throttle equivalente a
// `throttle:quotation-public` ainda não confirmado no contrato de API —
// 429 tratado DEFENSIVAMENTE pelo CHAMADOR (`BudgetPublicPage`,
// TASK-BG-FE-06), nunca retry automático aqui.
// -----------------------------------------------------------------------------

import axios from 'axios';

import { API_TIMEOUT, API_URL } from '@/config/env';

import type { PublicBudgetAnswerPayload, PublicBudgetData } from '@/@types/v2/Budgets';

// Envelope de SUCESSO real (`ApiResponse::success`) — `data` tipado por
// endpoint, mirror `PublicApiSuccessBody` de `request-quotation-public-service.ts`.
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

async function getPublicBudgetByHash(
  hash: string
): Promise<PublicApiSuccessBody<PublicBudgetData>> {
  const { data } = await publicApi.get<PublicApiSuccessBody<PublicBudgetData>>(
    `/public/budgets/${hash}`
  );
  return data;
}

async function answerPublicBudget(
  hash: string,
  payload: PublicBudgetAnswerPayload
): Promise<PublicApiSuccessBody<null>> {
  const { data } = await publicApi.put<PublicApiSuccessBody<null>>(
    `/public/budgets/${hash}`,
    payload
  );
  return data;
}

export { answerPublicBudget, getPublicBudgetByHash };
