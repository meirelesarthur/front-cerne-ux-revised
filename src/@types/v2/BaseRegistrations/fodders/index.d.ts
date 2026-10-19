// src/@types/v2/BaseRegistrations/fodders/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo FORRAGEM (Fodder) — API v1 do backend Laravel GB.Cerne.
// TASK-FD-FE-01 (fundação de dados + listagem + exclusão bloqueada).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /fodders            → data: FodderListItem[], meta REAL
//                                 (`ApiResponse::paginated`, 10/página default,
//                                 ordenado por `description` asc).
//   GET    /fodders/{uuid}     → data: FodderData (mesmo shape flat do índice).
//   POST   /fodders            → payload FodderPayload (create).
//   PUT/PATCH /fodders/{uuid}  → payload FodderPayload — SEMPRE os 2 campos
//                                 (description/is_enabled), nunca delta —
//                                 `FodderRequest::rules()` não diferencia por
//                                 verbo (Fodder-contrato.md §4.4).
//   DELETE /fodders/{uuid}     → 204; 422 estruturado (`errors.in_use.grazings`)
//                                 se em uso por `Grazing` (Fodder-contrato.md
//                                 §4.6/DA-FD-04).
//
// `Fodder` é o cadastro mais simples do domínio Pecuária: só `description` +
// `is_enabled` — SEM FK, SEM campo derivado (`kg_ms_ha` não reproposto,
// DA-FD-09). Binding por `uuid`; `id` sequencial NUNCA exposto.
//
// SEM FILTRO (DA-FD-11, decisão do dono) — a listagem só pagina. O backend
// IGNORA silenciosamente `?search=`/`?is_enabled=`, então o front NUNCA os
// declara/envia (declarar criaria falsa expectativa de que funcionam,
// diferente de `IdentificationTypeFilterForm`, que declara os 2 campos porque
// lá o backend de fato os aceita). NÃO criar `FodderFilterForm` — os params
// da listagem usam só `PaginationQueryParams` (`page`/`per_page`).
//
// Fonte: `Fodder-contrato.md` (API) + `Fodder-FrontEnd-contrato.md` (tela),
// TASK-FD-FE-01.
// -----------------------------------------------------------------------------

// ============================================
// FODDER (resposta da API)
// ============================================

export interface FodderListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

// Mesmo shape flat do `FodderListItem` — o Resource é literalmente só estes 3
// campos (`uuid`/`description`/`is_enabled`), sem relacionamento aninhado.
export type FodderData = FodderListItem;

// ============================================
// REQUEST TYPES
// ============================================

// Payload de escrita (`POST`/`PUT /fodders`) — os 2 campos SEMPRE presentes
// nos dois verbos (`FodderRequest::rules()` não diferencia por verbo —
// full-resource-replace). `is_enabled` via coerção explícita `!!valor` no
// consumidor (NUNCA `|| undefined`/`|| false` — `false` é valor legítimo,
// item 19 do checklist).
export interface FodderPayload {
  description: string;
  is_enabled: boolean;
}

// ============================================
// REACT HOOK FORM (consumido pela Tarefa irmã TASK-FD-FE-02)
// ============================================

export interface FodderForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface FoddersListEnvelope {
  success: boolean;
  message: string;
  data: FodderListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// Sem filtro (DA-FD-11) — NÃO declarar `search`/`is_enabled` aqui. O tipo de
// params da listagem só tem `page`/`per_page` — ver `PaginationQueryParams`
// (`@/@types/pagination`), consumido diretamente pelo service, sem um
// `FodderFilterForm` intermediário.

// ============================================
// EXCLUSÃO BLOQUEADA (422 estruturado — guarda de FK `grazings`)
// ============================================

// Shape confirmado por leitura do contrato de API (`DeleteFodderAction`,
// `Fodder-contrato.md` §4.6/DA-FD-04) — mapa `Record<string, number>`, mesma
// família de Action de `ParameterWeight`/`Marker`/`AdditionalInfo`/
// `NatureOperation`. Hoje só 1 chave possível (`grazings`), mas iterado via
// `Object.entries()` (nunca `.map()` de array) para não quebrar se uma 2ª FK
// for adicionada no futuro.
export interface FodderInUseError {
  errors: { in_use: Record<string, number> };
}
