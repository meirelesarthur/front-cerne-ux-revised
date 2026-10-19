// src/@types/v2/BaseRegistrations/drinking-fountains/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Bebedouros (DrinkingFountain) — API v1 do backend Laravel
// GB.Cerne. Execução 029, TASK-FE-2300/2301/2302/2303. DELTA sobre `Trough`
// (Cochos, mesma anatomia): campo extra `length`/"Comprimento(cm)" (opcional)
// + rótulo de tela "Volume(L)" no lugar de "Área(Cm)" para a mesma coluna
// física `total_area` (decisão 100% de front, contrato-fe-bebedouros.md §3).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /drinking-fountains           → data: DrinkingFountainListItem[], meta REAL
//   GET    /drinking-fountains/{uuid}    → data: DrinkingFountainData (área/módulo/curral aninhados)
//   GET    /drinking-fountains/options   → data: DrinkingFountainOptions (áreas+módulos+currais)
//   POST   /drinking-fountains           → payload DrinkingFountainPayload (create)
//   PUT    /drinking-fountains/{uuid}    → payload DrinkingFountainPayload (update, payload SEMPRE
//                                           completo — mirror updateGrazing/updateFodder — EXCETO
//                                           `feedlot_corral_uuid`, que é Optional: omitido = mantém o
//                                           vínculo atual, `null` explícito = desvincula)
//   DELETE /drinking-fountains/{uuid}    → 204 (exclusão física, sem soft delete)
//
// `uuid` sempre; `id`/`farm_id`/`area_id`/`grazing_id` internos NUNCA
// expostos (contrato-bebedouros.md §11, `DrinkingFountainResource`).
// -----------------------------------------------------------------------------

// ============================================
// DRINKING FOUNTAIN (resposta da API)
// ============================================

export type DrinkingFountainType = 'A' | 'B';

export interface DrinkingFountainAreaRef {
  uuid: string;
  description: string;
}

export interface DrinkingFountainGrazingRef {
  uuid: string;
  description: string;
}

export interface DrinkingFountainFeedlotCorralRef {
  uuid: string;
  identification: string;
  name: string | null;
}

export interface DrinkingFountainListItem {
  uuid: string;
  code: string;
  description: string;
  type: DrinkingFountainType;
  type_label: string;
  total_area: number;
  /** "Comprimento(cm)" — opcional, `null` quando ausente (fiel ao legado, que
   *  nunca exigia o campo, D5-BEB). NUNCA tratar `null` como erro. */
  length: number | null;
  is_enabled: boolean;
  area: DrinkingFountainAreaRef | null;
  grazing: DrinkingFountainGrazingRef | null;
  feedlot_corral: DrinkingFountainFeedlotCorralRef | null;
  created_at?: string;
  updated_at?: string;
}

// Mesmo Resource do index()/show() (contrato de API §11) — reaproveitado.
export type DrinkingFountainData = DrinkingFountainListItem;

// ============================================
// PAYLOAD (escrita — POST/PUT)
// ============================================

export interface DrinkingFountainPayload {
  description: string;
  type: DrinkingFountainType;
  total_area: number;
  /** Opcional — `null`/ausente aceito sem erro (D5-BEB, `nullable|numeric|min:0`). */
  length?: number | null;
  is_enabled: boolean;
  area_uuid?: string | null;
  grazing_uuid?: string | null;
  /** Optional de verdade — OMITIR a chave = manter o vínculo atual (edição);
   *  `null` explícito = desvincular; uuid = associar/trocar. NUNCA confundir
   *  com os demais campos (payload completo) — ver `CreateOrUpdateDrinkingFountain.tsx`. */
  feedlot_corral_uuid?: string | null;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface DrinkingFountainForm {
  uuid?: string;
  type: DrinkingFountainType | '';
  description: string;
  total_area: number | null;
  length: number | null;
  area_uuid: string | null;
  grazing_uuid: string | null;
  feedlot_corral_uuid: string | null;
  is_enabled: boolean;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default,
// ordenado por `code desc`)
// ============================================

export interface DrinkingFountainsListEnvelope {
  success: boolean;
  message: string;
  data: DrinkingFountainListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  } | null;
}

// ============================================
// FILTRO (drawer da listagem) — só busca textual (contrato-fe-bebedouros.md
// §2, mirror `contrato-fe-cochos.md §2`: código/descrição/área/módulo).
// ============================================

export interface DrinkingFountainsFilterForm {
  search?: string;
}

// ============================================
// OPTIONS (`GET /drinking-fountains/options`) — endpoint agregador, substitui
// os 3 dropdowns (Área/Módulo Pastejo/Curral) — 1 única chamada (contrato de
// API §6).
// ============================================

export interface DrinkingFountainAreaOption {
  uuid: string;
  description: string;
  drinking_fountains_count: number;
}

export interface DrinkingFountainGrazingOption {
  uuid: string;
  description: string;
  drinking_fountains_count: number;
}

export interface DrinkingFountainFeedlotCorralOption {
  uuid: string;
  identification: string;
  name: string | null;
}

export interface DrinkingFountainOptions {
  areas: DrinkingFountainAreaOption[];
  grazings: DrinkingFountainGrazingOption[];
  feedlot_corrals: DrinkingFountainFeedlotCorralOption[];
}
