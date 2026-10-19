// src/services/v2/RequestQuotations/request-quotation-public-service.ts
// -----------------------------------------------------------------------------
// Client HTTP DEDICADO + service do formulário PÚBLICO do fornecedor (hash,
// RequestQuotation — esteira 97-Esteiras/035, TASK-CQ-FE-10). Materializa a
// Opção 1 do gate DEC-CQ-04/DEC-CQ-07 (roteiro frontend §6.1, já decidida
// pelo dono): rota pública NA MESMA SPA, mas com um client HTTP ISOLADO do
// client autenticado da aplicação (`@/services/api` → `axiosInstanceV2`,
// `@/services/api-instances`).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (auditável por grep/lint de import, mirror a
// exigência do roteiro §6.1/Aceite da Tarefa) — este arquivo NUNCA importa:
//   - `@/services/api` / `@/services/api-instances` (client autenticado —
//     `withCredentials`, `X-Farm-Id` via `useFarmStore`/localStorage,
//     interceptor de resposta que redireciona para `/login` em 401)
//   - `@/contexts/AuthContext`, `@/hooks/useAuth`, `@/stores/*Farm*`
// A instância `publicApi` abaixo é construída do zero, com `axios.create()`
// PRÓPRIO — SEM `withCredentials`/`withXSRFToken` (o endpoint público não usa
// cookie de sessão nem CSRF, roteiro de API §9.1: "rota `api`, sem sessão/
// cookie") e SEM QUALQUER interceptor (nem de request, nem de response) — um
// 401/403 de outra aba/requisição da MESMA sessão do navegador NUNCA pode
// afetar esta página (risco real documentado no roteiro §6.1, não hipotético,
// já que o interceptor do client autenticado é registrado na INSTÂNCIA, não
// por rota).
//
// ⚠️ CONTRATO CONFIRMADO por leitura direta do código real (`api_root`,
// branch `feature/refactor-request-quotation-for-api`):
//   GET  /api/v1/public/request-quotations/{hash}   → PublicRequestQuotationData
//   POST /api/v1/public/request-quotations/{hash}   → multipart/form-data
//        (upload de arquivo condicional a `requires_file`), NUNCA PUT — o
//        Form Request/rota real usam POST puro, sem method spoofing.
//
// ⚠️ `API_URL` (`VITE_API_PHP_BACK_URL`) JÁ INCLUI `/api/v1` — os paths do
// código são relativos (`/public/request-quotations/{hash}`), NUNCA repetindo
// `/api/v1` (bug corrigido: duplicava `/api/v1/api/v1/...` → 404; mesmo fix
// de `budget-public-service.ts`).
// Middleware `throttle:quotation-public` (10 req/min por IP, roteiro API
// §9/TASK-CQ-API-11) — 429 tratado pelo CHAMADOR (`index.tsx`/
// `RequestQuotationPublicForm.tsx`), nunca retry automático aqui (retry
// automático contra um rate-limit dedicado seria contraproducente).
//
// Envelope de erro real (`ApiResponse::error`) tem `errors`/`meta`, DIFERENTE
// do `Response<T>` usado pelo resto da SPA (`notifications`/`statusCode`) —
// por isso os tipos aqui vêm de `PublicApiErrorBody` (mesmo arquivo de tipos
// do módulo), nunca de `@/@types/response-api`.
// -----------------------------------------------------------------------------

import axios from 'axios';

import { API_TIMEOUT, API_URL } from '@/config/env';

import type {
  PublicRequestQuotationData,
  PublicRequestQuotationSubmissionPayload,
} from '@/@types/v2/RequestQuotations';

// Envelope de SUCESSO real (`ApiResponse::success`) — `data` tipado por
// endpoint, `errors`/`meta` sempre `null`/ausentes no caminho feliz.
interface PublicApiSuccessBody<T> {
  success: boolean;
  message?: string | null;
  data: T;
}

// Client HTTP 100% ISOLADO — ver nota de cabeçalho. NUNCA exportado para uso
// genérico (escopo fechado a este arquivo); qualquer novo endpoint público
// futuro deve ganhar seu PRÓPRIO client dedicado, nunca importar este.
const publicApi = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

async function getPublicRequestQuotationByHash(
  hash: string
): Promise<PublicApiSuccessBody<PublicRequestQuotationData>> {
  const { data } = await publicApi.get<PublicApiSuccessBody<PublicRequestQuotationData>>(
    `/public/request-quotations/${hash}`
  );
  return data;
}

// `buildPublicSubmissionFormData` — mirror `buildRequestPurchaseFormData`
// (`request-purchase-service.ts`): arrays serializados com notação de índice
// `campo[i][chave]` (convenção Laravel para multipart/form-data). `quantity`
// do item NUNCA é enviada (aceita-e-descartada pelo Form Request real — ver
// nota em `@/@types/v2/RequestQuotations`, `PublicRequestQuotationItemPayload`).
function buildPublicSubmissionFormData(payload: PublicRequestQuotationSubmissionPayload): FormData {
  const fd = new FormData();

  fd.append('reponsible', payload.reponsible);
  fd.append('expiration_date', payload.expiration_date);
  fd.append('total_value', String(payload.total_value));

  payload.items.forEach((item, index) => {
    fd.append(`items[${index}][request_item_uuid]`, item.request_item_uuid);
    fd.append(`items[${index}][unitary_value]`, String(item.unitary_value));
    fd.append(`items[${index}][brand]`, item.brand);
    if (item.observation) fd.append(`items[${index}][observation]`, item.observation);
  });

  payload.payments.forEach((paymentRow, index) => {
    fd.append(`payments[${index}][payment_method]`, String(paymentRow.payment_method));
    fd.append(`payments[${index}][installments]`, String(paymentRow.installments));
    fd.append(`payments[${index}][interval]`, String(paymentRow.interval));
    fd.append(`payments[${index}][amount]`, String(paymentRow.amount));
    fd.append(`payments[${index}][total]`, String(paymentRow.total));
  });

  if (payload.file) fd.append('file', payload.file);

  return fd;
}

async function submitPublicRequestQuotation(
  hash: string,
  payload: PublicRequestQuotationSubmissionPayload
): Promise<PublicApiSuccessBody<null>> {
  const fd = buildPublicSubmissionFormData(payload);
  const { data } = await publicApi.post<PublicApiSuccessBody<null>>(
    `/public/request-quotations/${hash}`,
    fd
  );
  return data;
}

export { getPublicRequestQuotationByHash, submitPublicRequestQuotation };
