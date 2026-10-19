// src/constants/api-error-codes.ts
// -----------------------------------------------------------------------------
// Códigos ESTÁVEIS que a API devolve no envelope de erro (`response.data.code`,
// aditivo ao shape `{success,message,data,errors,meta}` — ver
// `GB.Cerne.Api/app/Http/Responses/ApiResponse.php::error()`). O front decide a
// NATUREZA do erro pelo `code`, nunca parseando `message` (que vem só em PT e
// pode ser técnica).
//
// TASK-072-FE-10 (E1, gate G-FE-2): `FARM_CONTEXT_REQUIRED` — 403 dos
// middlewares `ResolveFarmContext`/`ResolveTenantContextOptional` quando não
// há fazenda ativa (header `X-Farm-Id` ausente). Constante espelhada de
// `ResolveFarmContext::MISSING_HEADER_CODE`.
//
// TASK-072-FE-05 (I5b): `CNPJ_LOOKUP_UNAVAILABLE` — 503 do proxy ReceitaWS
// (`GET /tenants/cnpj-lookup`) quando o provedor está fora; o form libera o
// preenchimento manual. Espelho de `CnpjLookupUnavailableException::CODE`.
//
// TASK-095-FE-R2-02 (P5 + D7): `RECORD_HAS_ACTIVE_LINKS` (422 de toda exclusão
// bloqueada por vínculos, `RecordHasActiveLinksException::CODE`) e
// `PURCHASE_CANCEL_HAS_WEIGHINGS` (422 do cancelar processamento de compra com
// pesagem). O front mostra a mensagem pela PRÓPRIA i18n, não pela `message`.
// -----------------------------------------------------------------------------

export const API_ERROR_CODES = {
  FARM_CONTEXT_REQUIRED: 'FARM_CONTEXT_REQUIRED',
  CNPJ_LOOKUP_UNAVAILABLE: 'CNPJ_LOOKUP_UNAVAILABLE',
  RECORD_HAS_ACTIVE_LINKS: 'RECORD_HAS_ACTIVE_LINKS',
  PURCHASE_CANCEL_HAS_WEIGHINGS: 'PURCHASE_CANCEL_HAS_WEIGHINGS',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// 095 — chaves de `errors` que NÃO são mensagens por campo: o 422 da exclusão em
// massa de animais devolve `errors.blocked_uuids` (lista de uuids) e
// `errors.blocked_uuids_truncated` (boolean). `extractApiFieldErrorMessage` as
// ignora para nunca exibir um uuid como texto de toast.
export const NON_FIELD_ERROR_KEYS = ['blocked_uuids', 'blocked_uuids_truncated'] as const;
