// src/@types/v2/CategoryProducts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos MÍNIMOS do módulo de CATEGORIAS DE PRODUTO (CategoryProduct —
// Cadastros Base / Estrutura). `CategoryProduct` está migrado no backend, mas
// NÃO tem tela própria neste frontend ainda (fora de escopo desta execução,
// Kind-Frontend-Contrato.md §1) — só o endpoint `active` é consumido aqui,
// como Select de apoio do formulário/filtro de Classes (Kind).
//
//   GET /api/v1/category-products/active → data: CategoryProductRef[],
//     SEM paginação, `meta: null`, filtra `is_enabled=true`, ordenado por
//     `description` — mesmo padrão de `GET /species` (listSpecies).
// -----------------------------------------------------------------------------

export interface CategoryProductRef {
  uuid: string;
  description: string;
}

export interface CategoryProductsActiveEnvelope {
  success: boolean;
  message: string;
  data: CategoryProductRef[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// GET /category-products/options (TASK-BE-600, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de Categoria da cascata Grupo→
// Categoria→Classe (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`,
// TASK-FE-943/944) e para o submódulo de Classes (`Kind`, sem pai,
// TASK-FE-945). Resource DEDICADO — shape `{uuid,label}`, DIFERENTE de
// `CategoryProductListItem`/`CategoryProductRef` (`description`) — não
// reaproveitar. Aceita `group_uuid` opcional (filtro por Grupo pai,
// preserva a cascata — GAP-FE-161 ✅ RESOLVIDA; `whereHas`, sem
// `Rule::exists` — `group_uuid` inexistente devolve LISTA VAZIA, não 422).
// SEM gate de permissão. FLAT (`ApiResponse::success`, `meta` sempre
// `null`).
// ============================================

export interface CategoryProductOption {
  uuid: string;
  label: string;
}

export interface CategoryProductOptionsListEnvelope {
  success: boolean;
  message: string;
  data: CategoryProductOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
