// src/@types/v2/CategoryMatrices/category-matrix.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ESTÁGIO REPRODUTIVO (`CategoryMatrix` — nome técnico
// preservado do legado/API, "Estágio Reprodutivo" no domínio de negócio).
// Cadastros Base > Pecuária.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /category-matrices            → data: CategoryMatrixListItem[],
//                                            PAGINAÇÃO REAL (meta.current_page/
//                                            last_page/per_page/total) —
//                                            divergência do precedente mais
//                                            próximo (Espécies, que NUNCA
//                                            pagina). Confirmado em
//                                            `CategoryMatrixController::index()`
//                                            (`ApiResponse::paginated()`).
//   GET    /category-matrices/{uuid}      → data: CategoryMatrixData
//   POST   /category-matrices             → payload CategoryMatrixPayload (create)
//   PUT    /category-matrices/{uuid}       → payload CategoryMatrixPayload
//                                            (update — SEMPRE completo, nunca
//                                            delta; `CategoryMatrixRequest`
//                                            exige os 3 campos em ambos os
//                                            verbos, TASK-CATYMT-02)
//   DELETE /category-matrices/{uuid}      → 204; 422 estruturado com mensagem
//                                            de negócio real se em uso por FK
//                                            (`DeleteCategoryMatrixAction`
//                                            intercepta `QueryException` 23503)
//
// Tabela GLOBAL, sem `farm_id`/tenant (DA-01 do contrato) — rota SEM
// middleware `farm.context`, Model sem `HasFarmTenantScope`.
//
// Fonte: `CategoryMatrix-contrato.md` (Ciclo 4, APROVADO 2026-06-25) +
// `CategoryMatrixController`/`CategoryMatrixRequest`/`CategoryMatrixResource`/
// `CategoryMatrixRepository`/`CategoryMatrixFilterData` (`api_root`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// CATEGORY MATRIX (resposta da API — listagem)
// ============================================

export interface CategoryMatrixListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  specie: { uuid: string; description: string } | null;
}

// ============================================
// CATEGORY MATRIX DETAIL / FORM (TASK-CATYMT-02)
// ============================================

// `GET /category-matrices/{uuid}` — `CategoryMatrixResource`, `specie` sempre
// presente porque o Repository faz `with(['specie'])` em `findByUuidOrFail`.
export interface CategoryMatrixData {
  uuid: string;
  description: string;
  is_enabled: boolean;
  specie: { uuid: string; description: string } | null;
  created_at: string;
  updated_at: string;
}

// Payload de escrita (`POST`/`PUT /category-matrices`) — os 3 campos são
// `required` tanto no `store` quanto no `update` (`CategoryMatrixRequest::rules()`
// sem bloco condicional por verbo) — SEMPRE completo, nunca delta de
// `dirtyFields` (mesma recorrência de `TASK-ESP-FIX-PAYLOAD`/Cultivation).
export interface CategoryMatrixPayload {
  description: string;
  is_enabled: boolean;
  specie_uuid: string; // obrigatório — backend rejeita null/ausente (422)
}

// React Hook Form — `specie_uuid` guarda o Option INTEIRO
// (`SelectAsyncPaginate`), convertido para `specie_uuid: string` só no
// submit (nunca `null` no payload final — campo obrigatório).
export interface CategoryMatrixForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  specie_uuid: Option<string> | null;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — PAGINAÇÃO REAL)
// ============================================

export interface CategoryMatricesListEnvelope {
  success: boolean;
  message: string;
  data: CategoryMatrixListItem[];
  errors: Record<string, string[]> | null;
  meta: { current_page: number; last_page: number; per_page: number; total: number } | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

// ============================================
// OPTIONS (Estágio Reprodutivo, TASK-FE-884 — Animal-contrato.md §15)
// ============================================

/** `CategoryMatrixOptionResource` (api_root) — uuid+label (`label` =
 * `description`). Substitui `CategoryMatrixResource` completo no endpoint
 * `active()`, SEM gate `catymt_view` (removido do `only:` do Controller). */
export interface CategoryMatrixOptionItem {
  uuid: string;
  label: string;
}

/** FLAT (`ApiResponse::success`, `meta` sempre `null`) — `active()` aceita
 * `specie_uuid` opcional (filtro server-side, preservado 1:1 do endpoint
 * anterior). */
export interface CategoryMatrixActiveListEnvelope {
  success: boolean;
  message: string;
  data: CategoryMatrixOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface CategoryMatrixFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: 'true' | 'false';
  /** Filtro SERVER-SIDE por Espécie — vai como `specie_uuid` na querystring real. */
  specie_uuid?: string;
  /** Display-only — reidrata o `SelectAsyncPaginate` do filtro ao reabrir o
   *  drawer (o `paginatedQuery.filter` persistido guarda só o `specie_uuid`
   *  cru, não o `label`/description da Espécie escolhida). NUNCA enviado à
   *  API — ver `listCategoryMatrices` em `category-matrix-service.ts`. */
  specie_label?: string;
}
