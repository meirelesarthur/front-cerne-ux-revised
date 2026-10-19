// src/@types/v2/Configuracoes/apps/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Aplicativos" (App — versões de release de app móvel) — API
// v1 do backend Laravel GB.Cerne (TASK-APP-FE-01, contrato `App-contrato.md`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /apps                      → data: AppData[] + meta de paginação
//                                        (ApiResponse::paginated), filtro
//                                        opcional `platform`/`version`
//                                        (WHERE exato, App-contrato.md Seção 1,
//                                        `AppRepository::listWithFilters`)
//   GET    /apps/{uuid}                → data: AppData
//   POST   /apps                       → payload CreateAppRequest (todos os
//                                        5 campos obrigatórios, mirror legado)
//   PUT/PATCH /apps/{uuid}              → payload UpdateAppRequest (campos
//                                        opcionais — `sometimes` no backend,
//                                        App-contrato.md Seção 6)
//   DELETE /apps/{uuid}                 → 204 (sem guarda de FK — nada
//                                        referencia `apps.id`)
//
// `App` é catálogo GLOBAL (sem `farm_id`/`tenant_id`, App-contrato.md Seção 4)
// — o header `X-Farm-Id` continua sendo enviado pelo interceptor axios global
// (`src/services/api.ts`), mas o backend não o usa para este recurso.
//
// `release_date`/`deadline`: o backend serializa via `AppResource`
// (`->release_date?->toDateString()`) — string `Y-m-d` PURA, nunca ISO com
// hora. `AppData` aqui tipa os 2 campos como `string` (não `Date`) por esse
// motivo; o schema (`app-schema.ts`, `fv.date()`) exige o mesmo formato na
// escrita.
//
// Sem enum em `platform`/`version` (DA-APP-02, decisão do dono: texto livre
// nos dois, fidelidade ao legado) e sem regra de unicidade (DA-APP-03) — NÃO
// introduzir validação client-side de duplicidade de `platform`+`version`.
// -----------------------------------------------------------------------------

// ============================================
// APP (resposta da API)
// ============================================

export interface AppData {
  uuid: string;
  platform: string;
  version: string;
  description: string;
  /** String `Y-m-d` pura (AppResource::toDateString()) — nunca ISO com hora. */
  release_date: string;
  /** String `Y-m-d` pura (AppResource::toDateString()) — nunca ISO com hora. */
  deadline: string;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface AppsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AppsListEnvelope {
  success: boolean;
  message: string;
  data: AppData[];
  errors: Record<string, string[]> | null;
  meta: AppsApiPaginationMeta | null;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface AppForm {
  platform: string;
  version: string;
  description: string;
  /** Controlado por `<Input type="date">` — string `Y-m-d`, nunca `Date`. */
  release_date: string;
  /** Controlado por `<Input type="date">` — string `Y-m-d`, nunca `Date`. */
  deadline: string;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================
// Sem lookup, sem select assíncrono — só `platform`/`version` (Input texto).
// O backend faz WHERE exato (não `contains`), App-contrato.md Seção 1
// (`AppRepository::listWithFilters`).

export interface AppFilterForm {
  platform?: string;
  version?: string;
}

export interface AppFilterRequest {
  platform?: string;
  version?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

/** Todos os campos obrigatórios — mirror do legado (App-contrato.md Seção 1). */
export interface CreateAppRequest {
  platform: string;
  version: string;
  description: string;
  release_date: string;
  deadline: string;
}

/** Todos os campos opcionais — `sometimes` no backend (App-contrato.md Seção 6). */
export interface UpdateAppRequest {
  platform?: string;
  version?: string;
  description?: string;
  release_date?: string;
  deadline?: string;
}
