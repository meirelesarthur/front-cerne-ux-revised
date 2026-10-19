// src/@types/v2/CategoryTypes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de TIPOS DE CATEGORIA (CategoryType) — API v1 do backend
// Laravel GB.Cerne.
//
// Dois consumidores:
//   (1) TASK-CTY-01/02 — CRUD completo da tela de Tipos de Categoria (grid +
//       form): listagem, exclusão, detalhe, criação e atualização.
//   (2) TASK-FE-310/312 — select `type_uuid` do formulário de Categoria
//       Financeira (`SelectAsyncPaginate`), consumo ENXUTO só-leitura.
//
// Contrato confirmado por leitura direta do código (`api_root`,
// CategoryTypeController/Request/Resource/Data/FilterData/Repository):
//   GET    /category-types            → data: CategoryTypeRef[] + meta REAL
//                                        de paginação (ApiResponse::
//                                        paginated()) — ATENÇÃO: `per_page`
//                                        é ENVIADO mas IGNORADO pelo backend
//                                        hoje (`CategoryTypeRepository::
//                                        listPaginated()` usa `->paginate(15)`
//                                        fixo — Risco 2 da ficha da Tarefa).
//   DELETE /category-types/{uuid}      → 204; hoje SEM guarda de FK
//                                        (`financial_categories.type_id`
//                                        `ON DELETE RESTRICT`) — pode devolver
//                                        500 cru em vez de 422 estruturado
//                                        quando em uso (Risco 1 da ficha).
//
// Fonte: `CategoryTypeResource.php` (backend) — `{uuid, description,
// is_enabled, created_at, updated_at}`. SEM `code` — não expõe sequencial
// gerado no servidor (diferente de LowReason/TypeTitle). Dado mestre GLOBAL —
// rota fora do grupo `farm.context`, sem `farm_id`/`tenant_id`, sem
// `FarmTenantScope` no Model.
// -----------------------------------------------------------------------------

// ============================================
// CATEGORY TYPE (resposta da API)
// ============================================

// Shape REAL do recurso (`CategoryTypeResource`) — usado pelo select de
// Categoria Financeira (TASK-FE-310/312).
export interface CategoryTypeRef {
  uuid: string;
  description: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// `CategoryTypeListItem` é alias de `CategoryTypeRef` — mesmo recurso, dois
// nomes por causa dos dois consumidores (grid CRUD de TASK-CTY-01/02 e select
// de TASK-FE-310/312) que já importam nomes diferentes. Unificados pela mesma
// forma para não duplicar/desalinhar o contrato.
export type CategoryTypeListItem = CategoryTypeRef;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface CategoryTypesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number; // sempre 15 hoje, independente do `per_page` enviado — Risco 2
  total: number;
  from: number | null;
  to: number | null;
}

export interface CategoryTypesListEnvelope {
  success: boolean;
  message: string;
  data: CategoryTypeListItem[];
  errors: Record<string, string[]> | null;
  meta: CategoryTypesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem — TASK-CTY-01)
// ============================================

export interface CategoryTypeFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  // SEM filtro extra (diferente de LowReason, que também filtra `do_movement`) —
  // CategoryTypeFilterData só tem `search`/`isEnabled`.
}

// ============================================
// CATEGORY TYPE DETAIL / FORM (TASK-CTY-02)
// ============================================

// `GET /category-types/{uuid}` — mesmo shape flat de `CategoryTypeListItem`
// (sem relação aninhada, diferente de Species/CostCenter) — `CategoryTypeResource`
// não tem campo só-de-detalhe extra.
export type CategoryTypeData = CategoryTypeListItem;

// Valores do formulário (react-hook-form) — mesmos 2 campos do payload,
// `uuid` opcional só para o `reset()` do `fillForm` em modo edição.
export interface CategoryTypeForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
}

// Payload de escrita (`POST`/`PUT /category-types`) — `CategoryTypeRequest::
// rules()` NÃO distingue verbo: `description`/`is_enabled` são `required` em
// AMBOS (store e update) — full-resource-replace, mesma regra de
// Especies/TypeTitle/PlanAccount. NUNCA gatear estes 2 campos por
// `dirtyFields` no PUT (ver `tryPersistCategoryType` em
// `CreateOrUpdateTipoDeCategoria.tsx`). SEM `code` — não existe neste recurso.
export interface CategoryTypePayload {
  description: string;
  is_enabled: boolean;
}
