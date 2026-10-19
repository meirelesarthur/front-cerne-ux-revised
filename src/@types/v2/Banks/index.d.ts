// src/@types/v2/Banks/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de BANCOS (Bank — Cadastros Base / Financeiros). Contrato
// investigado diretamente em `api_root` (TASK-BANK-FE-01/TASK-BANK-FE-02):
//   app/Http/Controllers/Api/V1/BankController.php
//   app/Http/Requests/Api/V1/BankRequest.php
//   app/Http/Resources/V1/BankResource.php
//   app/Actions/Bank/*.php (5 Actions)
//
//   GET    /api/v1/banks          → data: BankListItem[], meta com paginação
//                                    REAL (TASK-BANK-API-PAG ✅ CONCLUÍDO —
//                                    `BankRepository::listWithFilters()` usa
//                                    `ApiResponse::paginated()` com
//                                    `LengthAwarePaginator` de verdade,
//                                    `search`/`page`/`per_page` consumidos
//                                    pelo backend). Mesmo shape de meta de
//                                    ProductGroups/Breeds — deixou de ser
//                                    `null` fixo.
//   GET    /api/v1/banks/{uuid}   → data: BankDetail (mesmo Resource do index)
//   POST   /api/v1/banks          → payload BankPayload (create)
//   PUT    /api/v1/banks/{uuid}   → payload BankPayload — `BankRequest::rules()`
//                                    exige `code` E `name` SEMPRE (full-
//                                    resource, sem PATCH parcial) — nunca um
//                                    `Partial<>` aqui.
//   DELETE /api/v1/banks/{uuid}   → 204; SEM guarda de FK em
//                                    `DeleteBankAction` (existe FK física real
//                                    `providers.bank_id → banks.id`) — hoje
//                                    pode surfacear um 500 genérico, não um
//                                    422 estruturado. `onError` do front é
//                                    GENÉRICO (ver bank-service.ts / index.tsx).
//
// Cadastro FLAT — 2 campos de texto só (`code`+`name`), sem nenhum Select de
// FK, sem booleano de status (`Bank` não tem `is_enabled`). Global (SEM
// `X-Farm-Id` — dado mestre fora de farm.context).
// -----------------------------------------------------------------------------

// ============================================
// BANK (resposta da API)
// ============================================

export interface BankListItem {
  uuid: string;
  code: string; // ~4 dígitos, ex. "001"
  name: string;
  info: string; // "{code}-{name}", já composto pelo BankResource — não recriar no client
}

// GET /banks/{uuid} — mesmo Resource do index()
export interface BankDetail {
  uuid: string;
  code: string;
  name: string;
  info: string; // display-only
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

// Mesmo shape de `ProductGroupsApiPaginationMeta`/`CostCentersApiPaginationMeta`
// (meta padrão Laravel do projeto).
export interface BanksApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface BanksListEnvelope {
  success: boolean;
  message: string;
  data: BankListItem[];
  errors: Record<string, string[]> | null;
  meta: BanksApiPaginationMeta | null;
}

// ============================================
// OPTIONS (GET /banks/options — GAP-BE-040 addendum, TASK-BE-356/
// TASK-FE-332) — lookup ENXUTO, SEM gate de `banks_view` (só
// auth:sanctum). `BankOptionResource` devolve `uuid`+`code`+`name` —
// SEM o `info` composto (`{code}-{name}`) do `BankResource` completo; o
// front monta o próprio label (mesmo template de `BankListItem.info`,
// confirmado em `BankResource::toArray()` do backend: `code.'-'.name`).
// NUNCA usar `listBanks`/`BankListItem` (CRUD completo, gated) neste
// select — mirror exato de `listCityOptions`/`CityListItem`.
// ============================================

export interface BankOptionItem {
  uuid: string;
  code: string;
  name: string;
}

export interface BankOptionsListEnvelope {
  success: boolean;
  message: string;
  data: BankOptionItem[];
  errors: Record<string, string[]> | null;
  meta: BanksApiPaginationMeta | null;
}

// ============================================
// FILTRO (busca — SEM drawer, Input direto no header, ver Decisão técnica #4
// da ficha TASK-BANK-FE-03)
// ============================================

export interface BankFilterForm {
  /** Busca por `code`/`name` (param `search` do backend). */
  search?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload SEMPRE completo (code + name) — `BankRequest` é full-resource tanto
// no POST quanto no PUT. Nunca usar `Partial<>` aqui.
export interface BankPayload {
  code: string;
  name: string;
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface BankForm {
  uuid?: string;
  code: string;
  name: string;
}
