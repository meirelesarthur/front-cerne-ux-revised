// src/@types/v2/Rainfalls/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Pluviometria (Rainfall) — API v1 do backend
// Laravel GB.Cerne. Fonte: leitura direta de `RainfallResource.php`/
// `RainfallRequest.php`/`RainfallIndexRequest.php`/`ImportRainfallRequest.php`/
// `RainfallImportResultData.php` (execução 041, TASK-BE-041-PLV-01/02, RETROFIT
// GAP-BE-672) — ver `97-Esteiras/041/CONTRATOS/plano-front-pluviometria.md §4/§5`.
//
//   GET    /api/v1/rainfalls            → paginado (ApiResponse::paginated, meta REAL), rainfall_view
//   GET    /api/v1/rainfalls/{uuid}     → detalhe completo, rainfall_view
//   POST   /api/v1/rainfalls            → 201, rainfall_create
//   PUT    /api/v1/rainfalls/{uuid}     → 200, rainfall_edit
//   DELETE /api/v1/rainfalls/{uuid}     → 204 (hard delete transacional), rainfall_delete
//   GET    /api/v1/rainfalls/download   → blob (modelo .xlsx, 2 abas), rainfall_create
//   POST   /api/v1/rainfalls/import     → multipart, ABORT-ALL (422 errors.rows[] se inválido), rainfall_create
//
// `user` é SEMPRE readonly (nunca aceito no payload — o backend sempre
// sobrescreve com o usuário autenticado, DIV-010, arquitetural). `areas` usa o
// `uuid` já existente de `Area` — o pivot `area_rainfall` NÃO tem identidade
// própria exposta (GAP-BE-672, pivot puro, sem Model dedicado).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// RAINFALL (resposta da API — RainfallResource)
// ============================================

export interface RainfallUserRef {
  uuid: string;
  name: string;
}

export interface RainfallAreaRef {
  uuid: string;
  description: string;
}

export interface RainfallListItem {
  uuid: string;
  /** ISO `Y-m-d`. */
  date: string;
  /** `decimal(5,1)` — mm de chuva. */
  amount: number;
  /** Readonly — sempre reflete quem criou/editou por último (DIV-010). Nunca entra no payload. */
  user: RainfallUserRef;
  areas: RainfallAreaRef[];
  created_at: string;
  updated_at: string;
}

/** `show`/`store`/`update` devolvem o mesmo shape de `index` — sem subcadastro aninhado. */
export type RainfallDetail = RainfallListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface RainfallsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RainfallsListEnvelope {
  success: boolean;
  message: string;
  data: RainfallListItem[];
  errors: Record<string, string[]> | null;
  meta: RainfallsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (wire — RainfallRequest::rules()) — `user`/`farm_id` NUNCA
// entram aqui (o backend sempre resolve do contexto autenticado, DIV-010).
// ============================================

export interface CreateRainfallRequest {
  date: string;
  amount: number;
  /** uuids de `Area`. */
  areas: string[];
}

/** Update é full-replace no backend (`RainfallRequest` exige tudo sempre) — mesmo shape do create. */
export type UpdateRainfallRequest = CreateRainfallRequest;

// ============================================
// REACT HOOK FORM (TASK-FE-041-PLV-03)
// ============================================

export interface RainfallForm {
  date: string;
  /** `KgInput` — `string` durante a digitação, convertido para `number` no submit. */
  amount: number | string;
  /** `CheckboxListField` (Controller RHF) — uuids de `Area` selecionados. */
  areas: string[];
}

// ============================================
// FILTRO (drawer da listagem — RainfallFilterData)
// ============================================

export interface RainfallFilterForm {
  start_date?: string;
  end_date?: string;
}

export interface RainfallFilterRequest extends RainfallFilterForm {}

// ============================================
// OPTIONS — `GET /api/v1/areas/options` (D2 do plano API — reusa o endpoint
// genérico já existente, `is_enabled=true`), mirror EXATO
// `@types/v2/HarvestProduct/index.d.ts` (`AreaOptionItem`/`FlatOptionsEnvelope`).
// ============================================

export interface AreaOptionItem {
  uuid: string;
  description: string;
}

export interface FlatOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// IMPORTAÇÃO — `POST /api/v1/rainfalls/import` (ABORT-ALL,
// `RainfallImportResultData`) — mirror `PlanAccountImportResult`, SEM
// `preserved`/`created`/`updated` (só `created`, envelope de SUCESSO puro,
// linhas inválidas NUNCA chegam aqui — 422 `errors.rows[]` aborta tudo antes).
// ============================================

export interface RainfallImportResult {
  created: number;
}

// Alias de conveniência — usado pela tela ao converter `areas` do Resource
// (`RainfallAreaRef[]`) em `Option<string>[]` para o `CheckboxListField`.
export type RainfallAreaOption = Option<string>;
