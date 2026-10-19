// src/@types/v2/Breeds/breed.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de RAÇAS (Breeds — Cadastros Base). Contrato atualizado por
// TASK-BREED-FRONT-PAG (paginação real da API de Breeds, corrigida em paralelo
// no backend):
//   app/Http/Controllers/Api/V1/BreedController.php
//   app/Http/Requests/Api/V1/BreedRequest.php
//   app/Http/Resources/V1/BreedResource.php
//   app/Data/BreedFilterData.php
//
//   GET    /api/v1/breeds          → data: BreedListItem[] + meta: paginação
//                                     REAL (ApiResponse::paginated), aceita
//                                     page/per_page + filtro specie_uuid —
//                                     mesmo shape de meta de CostCenters.
//   GET    /api/v1/breeds/{uuid}   → data: BreedData
//   POST   /api/v1/breeds          → payload BreedPayload
//   PUT    /api/v1/breeds/{uuid}   → payload BreedPayload — `BreedRequest::rules()`
//                                     NÃO diferencia store/update por método (só
//                                     `authorize()` o faz): `description`,
//                                     `is_enabled` e `specie_uuid` são `required`
//                                     em AMBOS os verbos. Por isso o payload de
//                                     update é SEMPRE completo (description +
//                                     is_enabled + specie_uuid), nunca um delta
//                                     parcial de `dirtyFields` — ver nota em
//                                     `CreateOrUpdateRaca.tsx`.
//   DELETE /api/v1/breeds/{uuid}   → 204; SEM checagem de dependentes
//                                     (`Breed` não usa SoftDeletes — exclusão
//                                     DEFINITIVA/irreversível).
//
// `specie` é `{ uuid, description } | null` — NUNCA `specie_id`/`id` sequencial
// (Resource pós TASK-CONF-12, Cenário B). O filtro de Espécie na listagem
// agora é SERVER-SIDE (`specie_uuid` na querystring de `/breeds` — TASK-BREED-
// FRONT-PAG), nunca `specie_id`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// BREED (resposta da API)
// ============================================

export interface BreedSpecieRef {
  uuid: string;
  description: string;
}

export interface BreedListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  specie: BreedSpecieRef | null;
}

// `show` devolve o mesmo shape de `index` (BreedResource não acrescenta
// campos exclusivos de detalhe) — mantido como alias nomeado para simetria
// com o restante do projeto (CostCenterDetail/RoleData) e para não acoplar
// a tela de formulário à forma exata de `BreedListItem`.
export interface BreedData extends BreedListItem {}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — TASK-BREED-FRONT-PAG)
// ============================================

// Mesmo shape de `CostCentersApiPaginationMeta` (meta padrão Laravel do projeto).
export interface BreedsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface BreedsListEnvelope {
  success: boolean;
  message: string;
  data: BreedListItem[];
  errors: Record<string, string[]> | null;
  meta: BreedsApiPaginationMeta | null;
}

// ============================================
// OPTIONS (lookup enxuto — GAP-FE-206, correção pós-E2E 2026-08-03)
// ============================================

// `GET /breeds/options` (`BreedOptionResource`, TASK-BE-885) — uuid+label,
// SEM `breeds_view`. Achado real desta correção: o `index()` (`/breeds`,
// usado por `listBreeds`) EXIGE `breeds_view` — 403 ("Sem opções") no Select
// de Raça do form de Animal para um operador de rebanho comum. `listBreeds`
// PERMANECE intocado (tela de administração `Racas/` continua usando o
// índice completo).
//
// TASK-BE-930 (fechamento do Gap reportado na correção anterior, confirmado
// por leitura direta do `api_root`, NÃO presumido) — `specie_uuid`
// (opcional) agora É aceito, restaura a narrowing server-side por Espécie
// (`BreedRepository::listOptions()` filtra via `whereHas('specie', ...)`
// quando presente). `BreedOptionResource` CONTINUA uuid+label — nenhum campo
// extra foi adicionado ao payload (confirmado, não presumido).
export interface BreedOptionItem {
  uuid: string;
  label: string;
}

export interface BreedsOptionsListEnvelope {
  success: boolean;
  message: string;
  data: BreedOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface BreedPayload {
  description: string;
  is_enabled: boolean;
  /** Obrigatório — backend rejeita (422) `null`/ausente. Nunca `specie_id`. */
  specie_uuid: string;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface BreedFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  /**
   * Filtro SERVER-SIDE (TASK-BREED-FRONT-PAG) — enviado como `specie_uuid` na
   * querystring de `/breeds`, junto com `page`/`per_page`. Só enviado quando
   * selecionado (`undefined` quando vazio, como os demais filtros).
   */
  specie_uuid?: string;
  /**
   * DISPLAY-ONLY (TASK-BREED-FILTER-FIX) — label da Espécie selecionada,
   * persistido só para re-hidratar o `SelectAsyncPaginate` do drawer com o
   * NOME em vez do uuid cru quando o filtro reabre. NÃO é enviado à API
   * (`useBreeds.tsx`/`breed-service.ts` repassam só `search`/`is_enabled`/
   * `specie_uuid` à querystring de `/breeds`).
   */
  specie_label?: string;
}

// ============================================
// REACT HOOK FORM (formulário create/edit — TASK-BREED-02)
// ============================================

export interface BreedForm {
  description: string;
  is_enabled: boolean;
  /**
   * Componente é `SelectAsyncPaginate` (busca paginada por `listSpecies`) —
   * por isso o campo guarda o par `{ label, value }` completo (`Option`), não
   * a uuid crua (mesma convenção de `parent_uuid` em
   * `CreateOrUpdateCentroCusto.tsx`). Conversão pro payload cru
   * (`specie_uuid: string`) só no submit. Obrigatório — nunca `null` no
   * payload final.
   */
  specie_uuid: Option<string> | null;
}
