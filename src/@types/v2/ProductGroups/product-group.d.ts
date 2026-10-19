// src/@types/v2/ProductGroups/product-group.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de GRUPOS DE PRODUTO (ProductGroups — Cadastros Base).
// Contrato investigado diretamente em `api_root` (TASK-GRP-01/TASK-GRP-02):
//   app/Http/Controllers/Api/V1/GroupProductController.php
//   app/Http/Requests/Api/V1/GroupProductRequest.php
//   app/Actions/GroupProduct/DeleteGroupProductAction.php
//
//   GET    /api/v1/product-groups          → data: ProductGroupListItem[] +
//                                             meta: paginação REAL
//                                             (ApiResponse::paginated —
//                                             GroupProductRepository::
//                                             listWithFilters() usa
//                                             LengthAwarePaginator de
//                                             verdade), mesmo shape de meta de
//                                             CostCenters/Breeds.
//   GET    /api/v1/product-groups/{uuid}   → data: ProductGroupDetail
//   POST   /api/v1/product-groups          → payload ProductGroupPayload
//   PUT    /api/v1/product-groups/{uuid}   → payload ProductGroupPayload —
//                                             `GroupProductRequest::rules()`
//                                             exige `description` E
//                                             `is_enabled` SEMPRE (full-
//                                             resource, sem PATCH parcial) —
//                                             nunca um `Partial<>` aqui.
//   DELETE /api/v1/product-groups/{uuid}   → 204; guard de FK 422
//                                             (`BusinessRuleException`,
//                                             "Grupo de produto está em uso e
//                                             não pode ser excluído.") —
//                                             `GroupProduct` NÃO usa
//                                             SoftDeletes (exclusão
//                                             DEFINITIVA).
//
// Cadastro FLAT — sem nenhum Select de FK (mais simples que Breeds/
// CentroCusto). Divergência de slug de permissão (backend hoje
// `product_groups_*`, front `groupproducts_*`) registrada em DEC-006 — ver
// Tarefa TASK-GRP-01, não é responsabilidade destes tipos.
// -----------------------------------------------------------------------------

// ============================================
// PRODUCT GROUP (resposta da API)
// ============================================

export interface ProductGroupListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
}

export interface ProductGroupDetail extends ProductGroupListItem {
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

// Mesmo shape de `CostCentersApiPaginationMeta`/`BreedsApiPaginationMeta`
// (meta padrão Laravel do projeto).
export interface ProductGroupsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProductGroupsListEnvelope {
  success: boolean;
  message: string;
  data: ProductGroupListItem[];
  errors: Record<string, string[]> | null;
  meta: ProductGroupsApiPaginationMeta | null;
}

// ============================================
// GET /product-groups/options (TASK-BE-600, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de topo da cascata Grupo→Categoria→
// Classe (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`, TASK-FE-943/
// 944). Resource DEDICADO — shape `{uuid,label}`, DIFERENTE de
// `ProductGroupListItem` (`description`/`is_enabled`) — não reaproveitar.
// SEM gate de permissão (fecha o toast "Sem permissão" do drawer de filtro).
// FLAT (`ApiResponse::success`, `meta` sempre `null`, sem paginação real) —
// mirror estrutural de `MeasurementOption`/`MeasurementOptionsListEnvelope`
// (Measurements/index.d.ts), adaptado ao shape `label` real do Resource.
// ============================================

export interface ProductGroupOption {
  uuid: string;
  label: string;
}

export interface ProductGroupOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ProductGroupOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload SEMPRE completo (description + is_enabled) — `GroupProductRequest`
// é full-resource tanto no POST quanto no PUT. Nunca usar `Partial<>` aqui.
export interface ProductGroupPayload {
  description: string;
  is_enabled: boolean;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface ProductGroupFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface ProductGroupForm {
  description: string;
  /**
   * Componente é `Select` (Ativo/Inativo — TASK-GRP-02, seção "Componentes"),
   * não um `Switch` (diferente de Breeds/CentroCusto). Mesma convenção do
   * campo `condition` de `CreateOrUpdateCentroCusto.tsx`: o FORM guarda a
   * STRING crua ('true'/'false'), não o par `{label,value}` — a conversão
   * Option↔string acontece só no render do `Select` (`options.find()`/
   * `onChange(opt?.value)`), nunca no shape do `useForm`. Convertido para
   * `boolean` puro só no submit (`ProductGroupPayload.is_enabled`).
   */
  is_enabled: 'true' | 'false' | undefined;
}
