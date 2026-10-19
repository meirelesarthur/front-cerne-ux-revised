// src/@types/v2/Cities/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CIDADES (City) — API v1 do backend Laravel GB.Cerne.
// Catálogo GLOBAL, somente-leitura (`apiResource(...)->only(['index','show'])`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /api/v1/cities          → data: CityListItem[], meta REAL (paginação
//                                  Laravel, 50/página FIXO — diferente de States,
//                                  que não pagina). Filtros (`CityFilterData`,
//                                  query params em snake_case): `search` (ILIKE em
//                                  `title`), `state_uuid` (cascata Estado→Cidade,
//                                  `whereHas('state', uuid)`). `status` NÃO é
//                                  aceito nesta Tarefa (fora de escopo — ver TASK-FE-023).
//   GET /api/v1/cities/{uuid}   → data: CityData (mesmo shape, sem consumidor
//                                  nesta Tarefa — reservado para uso futuro).
//
// Fonte: `City-contrato.md` + leitura direta de `CityController`/`CityRepository`/
// `CityFilterData`/`CityResource` (api_root, branch feature/refactor-cities-states-for-api),
// batidos em TASK-FE-021.
// -----------------------------------------------------------------------------

import type { StateListItem } from '@/@types/v2/States';

// ============================================
// CITY (resposta da API)
// ============================================

export interface CityListItem {
  uuid: string;
  title: string;
  slug: string;
  iso: number;
  iso_ddd: number | null;
  status: number | null;
  status_label: string;
  population: number;
  lat: string;
  long: string;
  income_per_capita: string;
  /** Sempre carregado (`with('state')` no Repository) — nunca null na prática, mas o Resource não garante contratualmente. */
  state: StateListItem | null;
}

/** Mesmo shape de CityListItem — reservado para GET /cities/{uuid}, sem consumidor nesta Tarefa. */
export type CityData = CityListItem;

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 50/página fixo)
// ============================================

export interface CitiesListEnvelope {
  success: boolean;
  message: string;
  data: CityListItem[];
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

// ============================================
// FILTRO
// ============================================

export interface CityFilterForm {
  /** Busca por `title` (param `search`). */
  search?: string;
  /** Cascata Estado→Cidade (param `state_uuid`, snake_case exigido pelo backend). NÃO confundir com `stateUuid` (nome da prop no CityFilterData PHP — o mapper converte). */
  state_uuid?: string;
}
