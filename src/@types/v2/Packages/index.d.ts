// src/@types/v2/Packages/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de EMBALAGENS (Package — Cadastros Base / Estrutura,
// execução 025). Mirror estrutural de Kind (TASK-FE-460)/Measurement
// (TASK-FE-053), FK única com adaptador de paginação real. Contrato:
// Package-contrato.md (backend APROVADO, TASK-BE-520..523) +
// Package-Frontend-Contrato.md (v1.1).
//
//   GET    /api/v1/product-packages          → paginação REAL (per_page
//                                               default backend 10, teto
//                                               100), ordenado description
//                                               asc (fixo, sem sort no front)
//   GET    /api/v1/product-packages/{uuid}   → data: PackageData
//   POST   /api/v1/product-packages          → payload PackagePayload
//   PUT    /api/v1/product-packages/{uuid}   → payload PackagePayload,
//                                               SEMPRE completo (Request não
//                                               diferencia por verbo)
//   DELETE /api/v1/product-packages/{uuid}   → 422 se Produto vinculado
//
// CORREÇÃO (TASK-FE-522, achado na execução): o Contrato de Tela v1.1 §1
// INFERIA um objeto `measurement` aninhado (`{ uuid, name, description }`),
// por analogia com `KindResource.category` — inferência feita ANTES do
// `PackageResource` real existir ("Resource ainda não escrito" no contrato).
// Lido `app/Http/Resources/V1/PackageResource.php` no fork da API (já
// implementado e validado pelo Tester, 27 testes): o shape real é FLAT —
// `measurement_uuid` (string|null) + `measurement_name` (string|null) — SEM
// objeto aninhado, SEM `measurement_description`. Também `size` é serializado
// como `(float) $this->size` (Resource explícito) — chega como NUMBER, não
// string, apesar do cast Eloquent ser `decimal:2`. Tipos abaixo corrigidos
// para bater com o Resource real; listagem (`index.tsx`, TASK-FE-521) e
// formulário (`CreateOrUpdateEmbalagem.tsx`, TASK-FE-522) ajustados juntos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// PACKAGE (resposta da API)
// ============================================

export interface PackageListItem {
  uuid: string;
  description: string;
  /** decimal(8,2) — Resource serializa `(float) $this->size`: chega como number. */
  size: number;
  /** FK flat (Resource real não aninha objeto `measurement`). */
  measurement_uuid: string | null;
  /** Nome/sigla da Unidade de Medida — já resolvido pelo Resource, sem 2º fetch. */
  measurement_name: string | null;
  created_at: string;
  updated_at: string;
}

// `show` devolve o mesmo shape de `index` — alias por simetria com o resto do projeto (KindData/BreedData).
export interface PackageData extends PackageListItem {}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PackagesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PackagesListEnvelope {
  success: boolean;
  message: string;
  data: PackageListItem[];
  errors: Record<string, string[]> | null;
  meta: PackagesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface PackagePayload {
  description: string;
  /** Enviado como number — o backend aceita numeric (não string mascarada). */
  size: number;
  measurement_uuid: string;
}

export interface PackageFilterForm {
  /** Busca por `description` (param `search`, ILIKE). */
  search?: string;
  /** Filtro SERVER-SIDE — enviado como `measurement_uuid` na querystring. */
  measurement_uuid?: string;
  /**
   * DISPLAY-ONLY — label da Unidade de Medida selecionada, persistido só
   * para re-hidratar o SelectAsyncPaginate do drawer com o NOME em vez do
   * uuid cru quando o filtro reabre. NUNCA enviado à API. Mesmo padrão de
   * `KindFilterForm.category_label`.
   */
  measurement_label?: string;
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface PackageForm {
  description: string;
  /** NumberInput controlado — number | null enquanto vazio. */
  size: number | null;
  /**
   * Componente é SelectAsyncPaginate (busca paginada por listMeasurements)
   * — por isso o campo guarda o par { label, value } completo (Option),
   * não a uuid crua. Conversão pro payload cru só no submit. Obrigatório
   * — nunca null no payload final.
   */
  measurement_uuid: Option<string> | null;
}

// ============================================
// GET /product-packages/options (TASK-BE-508, aditivo TASK-FE-504) — lookup
// ENXUTO consumido pelo `CheckboxListField` de `product_package_uuids` do
// formulário de Produtos (Aba 2, vínculo M2M titularidade em Produtos,
// `TASK-BE-506`/`GAP-BE-230`). Resource dedicado (`PackageOptionResource`,
// uuid+description+size), SEM gate de `product-packages_view`. FLAT
// (`ApiResponse::success`, `meta` sempre `null` — catálogo tenant-scoped
// pequeno, 161 linhas totais, Product-contrato.md §17.2).
// ============================================

export interface PackageOption {
  uuid: string;
  description: string;
  size: number;
}

export interface PackageOptionsListEnvelope {
  success: boolean;
  message: string;
  data: PackageOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
