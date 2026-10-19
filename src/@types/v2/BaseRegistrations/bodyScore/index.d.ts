// src/@types/v2/BaseRegistrations/bodyScore/index.d.ts
// Tipos do módulo de Escore Corporal (BodyScore) — API v1 do backend Laravel
// GB.Cerne. Mirror estrutural de `diagnosisPregnancy/index.d.ts` (mesmo par
// description/is_enabled) + FK de Espécie via `specie_uuid`/`specie` (mirror
// `breed.d.ts`, único precedente do projeto com `SelectAsyncPaginate`
// portalizado para Espécie). Contrato: `BodyScore-contrato.md ## 3`/`## 4`.

import type { Option } from '@/@types/option';

// ============================================
// BODY SCORE (resposta da API)
// ============================================

export interface BodyScoreListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  specie_uuid: string | null;
  specie: { uuid: string; description: string } | null;
  created_at?: string;
  updated_at?: string;
}

// Mesmo Resource do index() e do show() (contrato §3) — reaproveitado em vez
// de duplicado (mirror `DiagnosisPregnancyData`).
export type BodyScoreData = BodyScoreListItem;

// ============================================
// PAYLOAD (escrita — POST/PUT)
// ============================================

export interface BodyScorePayload {
  description?: string;
  is_enabled?: boolean;
  specie_uuid?: string | null;
}

// ============================================
// FORM (React Hook Form)
// ============================================

export interface BodyScoreForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  /**
   * Componente é `SelectAsyncPaginate` (busca paginada por `listSpecies`) —
   * o campo guarda o par `{ label, value }` completo (`Option`), não a uuid
   * crua (mesma convenção de `specie_uuid` em `BreedForm`). Conversão pro
   * payload cru (`specie_uuid: string | null`) só no submit.
   */
  specie_uuid: Option<string> | null;
}

// ============================================
// ENVELOPE (ApiResponse::success — SEM paginação, contrato §3)
// ============================================

export interface BodyScoresListEnvelope {
  success: boolean;
  message: string;
  data: BodyScoreListItem[];
  errors: Record<string, string[]> | null;
  meta: null; // `index()` usa ApiResponse::success — NUNCA paginado.
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface BodyScoresFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Filtro SERVER-SIDE — enviado como `specie_uuid` na querystring de `/body-scores` (contrato §3). */
  specie_uuid?: string;
  /**
   * DISPLAY-ONLY — nunca enviado à API; só re-hidrata o label do
   * `SelectAsyncPaginate` no drawer (mirror `BreedFilterForm.specie_label`).
   */
  specie_label?: string;
}
