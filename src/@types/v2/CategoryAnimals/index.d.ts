// src/@types/v2/CategoryAnimals/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CATEGORIAS ANIMAIS (CategoryAnimal — Cadastros Base /
// Pecuários, execução 025, TASK-FE-540). Backend já 100% migrado e
// conformante — contrato confirmado em
// `CategoryAnimal-Frontend-Contrato.md` §1 + Addendum Backend paralelo
// (paginação real via `TASK-BE-540`, teto de `start_month`/`end_month`
// removido via `TASK-BE-541`):
//   app/Http/Controllers/Api/V1/CategoryAnimalController.php
//   app/Http/Requests/Api/V1/CategoryAnimalRequest.php
//   app/Http/Resources/V1/CategoryAnimalResource.php
//   app/Data/CategoryAnimalFilterData.php
//
//   GET    /api/v1/category-animals          → data: CategoryAnimalListItem[],
//                                               meta: paginação REAL
//                                               (ApiResponse::paginated),
//                                               filtros search/specie_uuid
//                                               (decisão do Maestro sobre
//                                               GAP-FE-150 — Opção A, NÃO
//                                               `specie_id`)/gender/is_enabled.
//   GET    /api/v1/category-animals/{uuid}   → data: CategoryAnimalData
//   POST   /api/v1/category-animals          → payload CategoryAnimalPayload
//   PUT    /api/v1/category-animals/{uuid}   → payload CategoryAnimalPayload
//                                               (`CategoryAnimalRequest::rules()`
//                                               NÃO diferencia store/update por
//                                               método, mesma nota de
//                                               `BreedPayload`/`KindPayload`)
//   DELETE /api/v1/category-animals/{uuid}   → 204; SEM guarda de FK
//                                               estruturada confirmada
//                                               (`GAP-BE-253` no backend,
//                                               tratar com `onError` genérico
//                                               do `useRequest`) — exclusão
//                                               DEFINITIVA (sem SoftDeletes).
//
// `specie` é `{ uuid, description } | null` — NUNCA `specie_id`/`id`
// sequencial (mesma convenção de `BreedSpecieRef`/`KindCategoryRef`).
//
// `descriptive`/`vl_residual` NÃO são campos de formulário — ausentes do
// form Blade legado, o backend auto-preenche (`prepareForValidation()`).
// Por isso ficam SÓ em `CategoryAnimalData` (tipo de LEITURA), nunca em
// `CategoryAnimalPayload`/`CategoryAnimalForm` — omitir COMPLETAMENTE do
// payload de escrita (Doc Bruta regra 3, contrato §1).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// GENDER (enum M|F|A, coluna `gender` da tabela `category_animals`)
// ============================================

export type CategoryAnimalGender = 'M' | 'F' | 'A';

// ============================================
// CATEGORY ANIMAL (resposta da API)
// ============================================

export interface CategoryAnimalSpecieRef {
  uuid: string;
  description: string;
}

export interface CategoryAnimalListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  specie: CategoryAnimalSpecieRef | null;
  gender: CategoryAnimalGender;
  gender_label: string;
  start_month: number | null;
  end_month: number | null;
  next_category_uuid: string | null;
  product_uuid: string | null;
  is_reproductive: boolean;
}

// `show` devolve o mesmo shape de `index` + `descriptive`/`vl_residual`
// (`CategoryAnimalResource`, mesmo Resource para os dois verbos) — mantido
// como extensão nomeada para simetria com `BreedData`/`KindData`.
export interface CategoryAnimalData extends CategoryAnimalListItem {
  /** Só LEITURA — backend auto-preenche (`description` quando ausente). NUNCA no form/payload. */
  descriptive: string;
  /** Só LEITURA — backend auto-preenche (`false` por padrão). NUNCA no form/payload. */
  vl_residual: boolean;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — TASK-BE-540)
// ============================================

// Mesmo shape de `BreedsApiPaginationMeta`/`KindsApiPaginationMeta` (meta
// padrão Laravel do projeto).
export interface CategoryAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CategoryAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: CategoryAnimalListItem[];
  errors: Record<string, string[]> | null;
  meta: CategoryAnimalsApiPaginationMeta | null;
}

// ============================================
// OPTIONS (lookup enxuto — GAP-FE-206, correção pós-E2E 2026-08-03)
// ============================================

// `GET /category-animals/options` (`CategoryAnimalOptionResource`,
// TASK-BE-605/GAP-BE-040 Opção B) — SEM `categoryanimals_view`. Achado real
// desta correção: o `index()` (`/category-animals`, usado por
// `listCategoryAnimals`) EXIGE `categoryanimals_view` — 403 ("Sem opções")
// no Select de Categoria do form/filtro de Animal para um operador de
// rebanho comum. `listCategoryAnimals` PERMANECE intocado (tela de
// administração `CategoriasAnimais/` continua usando o índice completo).
//
// TASK-BE-930 (fechamento dos 2 Gaps reportados na correção anterior,
// confirmado por leitura direta do `api_root`, NÃO presumido):
// 1) `is_reproductive` agora É exposto — `gender === Gender::FEMALE`, MESMO
//    cálculo de `CategoryAnimalResource::toArray()` (`gender` é `char(1)`
//    com default, nunca `null`). O GET dedicado gateado
//    (`GET /category-animals/{uuid}`, `resolveCategoryAnimalMeta`) foi
//    REMOVIDO do front — não é mais necessário.
// 2) `specie_uuid` (opcional) agora É aceito — restaura a narrowing
//    server-side por Espécie (`CategoryAnimalRepository::listOptions()`
//    filtra via `whereHas('specie', ...)` quando presente).
//
// round-5 (correção do dono) — `requires_reproductive_status` (RN-6,
// round-4) REMOVIDO: gateava o campo "Status Reprodutivo"
// (`reproductive_status`), extinto do card de Processamento. `is_reproductive`
// (`gender === Gender::FEMALE`) é o único flag remanescente — consumido por
// `CreateOrUpdateAnimal.tsx`/`animal-schema.ts` E agora também por
// `ProcessingAnimalRow.tsx` (governa a obrigatoriedade de "Estágio
// Reprodutivo"/`category_matrice_uuid`).
export interface CategoryAnimalOptionItem {
  uuid: string;
  label: string;
  is_reproductive: boolean;
}

export interface CategoryAnimalsOptionsListEnvelope {
  success: boolean;
  message: string;
  data: CategoryAnimalOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

// SEM `descriptive`/`vl_residual` — omitidos, o backend auto-preenche (ver
// cabeçalho do arquivo). Payload SEMPRE completo em create E update (mesma
// decisão de `Breed`/`Kind` — `CategoryAnimalRequest::rules()` não
// diferencia por verbo além de `authorize()`).
export interface CategoryAnimalPayload {
  description: string;
  is_enabled: boolean;
  /** Obrigatório — backend rejeita (422) `null`/ausente. Nunca `specie_id`. */
  specie_uuid: string;
  /** Self-referencing (evolução de categoria) — nullable, opcional. */
  next_category_uuid: string | null;
  /** FK cross-feature (Produtos, `TASK-FE-543`) — nullable, opcional. */
  product_uuid: string | null;
  /** `min:0`, SEM teto (pós `TASK-BE-541` — não replicar `between:0,12`). */
  start_month: number | null;
  end_month: number | null;
  gender: CategoryAnimalGender;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface CategoryAnimalFilterForm {
  /** Busca por `description`/`descriptive` (param `search` do backend, ILIKE). */
  search?: string;
  /**
   * Filtro SERVER-SIDE por Espécie — decisão do Maestro sobre `GAP-FE-150`:
   * o backend (`TASK-BE-542`, paralelo) aceita `specie_uuid` na querystring
   * de `/category-animals` (mirror `listBreeds`/`TASK-BREED-FRONT-PAG`),
   * NUNCA `specie_id` int (não expor id interno no front).
   */
  specie_uuid?: string;
  /**
   * DISPLAY-ONLY (mirror `BreedFilterForm.specie_label`/
   * `KindFilterForm.category_label`) — label da Espécie selecionada,
   * persistido só para re-hidratar o `SelectAsyncPaginate` do drawer com o
   * NOME em vez do uuid cru quando o filtro reabre. NÃO é enviado à API.
   */
  specie_label?: string;
  gender?: CategoryAnimalGender | '';
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// REACT HOOK FORM (formulário create/edit — TASK-FE-542/543)
// ============================================

export interface CategoryAnimalForm {
  description: string;
  is_enabled: boolean;
  /**
   * `SelectAsyncPaginate` (busca paginada por `listSpecies`) — o campo
   * guarda o par `{ label, value }` completo (`Option`), não a uuid crua
   * (mesma convenção de `specie_uuid` em `BreedForm`). Conversão pro payload
   * cru (`specie_uuid: string`) só no submit.
   */
  specie_uuid: Option<string> | null;
  /**
   * `SelectAsyncPaginate` self-referencing (busca no próprio
   * `listCategoryAnimals`) — nullable, opcional.
   */
  next_category_uuid: Option<string> | null;
  /**
   * `SelectAsyncPaginate` contra o serviço de Produtos (dependência cruzada,
   * `TASK-FE-543`) — nullable, opcional.
   */
  product_uuid: Option<string> | null;
  /** Saída do `NumberInput` compartilhado (`decimalPlaces={0}`) — `number | null`. */
  start_month: number | null;
  end_month: number | null;
  gender: CategoryAnimalGender;
}
