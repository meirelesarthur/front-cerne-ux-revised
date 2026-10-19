// src/@types/v2/Vaccines/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de VACINAS (Vaccine — Cadastros Base / Pecuária). Mirror de
// @types/v2/Breeds/breed.d.ts, COM UMA DIFERENÇA CENTRAL: `specie_uuid` aqui
// é OPCIONAL (nullable — Vaccine-contrato.md §6/§12, D2), NÃO obrigatório
// como em Breed. O Select assíncrono de Espécie permite salvar sem seleção.
//
//   GET    /api/v1/vaccines          → data: VaccineListItem[] + meta: paginação
//                                       REAL (ApiResponse::paginated), aceita
//                                       page/per_page + filtros search/
//                                       is_enabled/specie_uuid.
//   GET    /api/v1/vaccines/{uuid}   → data: VaccineData
//   POST   /api/v1/vaccines          → payload VaccinePayload (specie_uuid
//                                       OPCIONAL — D2)
//   PUT    /api/v1/vaccines/{uuid}   → payload VaccinePayload — `VaccineRequest`
//                                       usa `sometimes` no update, mas o front
//                                       envia o payload SEMPRE completo (mesmo
//                                       padrão de Breed/PaymentTerm).
//   DELETE /api/v1/vaccines/{uuid}   → 204; exclusão física, SEM guarda de FK
//                                       (D5 — cascata real confirmada no pivô
//                                       item_sanitary_vaccines).
//
// `specie` é `{ uuid, description } | null` — NUNCA `specie_id`/`id` cru
// (D4, uuid-only).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// VACCINE (resposta da API)
// ============================================

export interface VaccineSpecieRef {
  uuid: string;
  description: string;
}

export interface VaccineListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  /** `null` quando a Vacina não tem Espécie associada (D2 — campo opcional). */
  specie: VaccineSpecieRef | null;
}

// `show` devolve o mesmo shape de `index` (VaccineResource não acrescenta
// campos exclusivos de detalhe).
export type VaccineData = VaccineListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface VaccinesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface VaccinesListEnvelope {
  success: boolean;
  message: string;
  data: VaccineListItem[];
  errors: Record<string, string[]> | null;
  meta: VaccinesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface VaccinePayload {
  description: string;
  is_enabled: boolean;
  /** OPCIONAL (D2 — diverge de BreedPayload.specie_uuid, que é obrigatório). */
  specie_uuid: string | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface VaccineFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  /** Filtro SERVER-SIDE — enviado como `specie_uuid` na querystring de `/vaccines`. */
  specie_uuid?: string;
  /**
   * DISPLAY-ONLY (mesmo padrão de `BreedFilterForm.specie_label`) — label da
   * Espécie selecionada, persistido só para re-hidratar o
   * `SelectAsyncPaginate` do drawer com o NOME em vez do uuid cru. NÃO
   * enviado à API.
   */
  specie_label?: string;
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface VaccineForm {
  description: string;
  is_enabled: boolean;
  /**
   * Componente é `SelectAsyncPaginate` (busca paginada por `listSpecies`) —
   * guarda o par `{ label, value }` completo (`Option`), não a uuid crua.
   * OPCIONAL — pode ficar `null` (D2, diverge de `BreedForm.specie_uuid`,
   * que nunca é `null` no payload final).
   */
  specie_uuid: Option<string> | null;
}
