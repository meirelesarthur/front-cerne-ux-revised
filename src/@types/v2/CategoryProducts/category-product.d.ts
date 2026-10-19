// src/@types/v2/CategoryProducts/category-product.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CATEGORIAS DE PRODUTO (CategoryProduct — Cadastros Base).
// Contrato investigado em `01-Arquitetura_e_Contratos/CategoryProduct-contrato.md`
// (ciclo 3, APROVADO 2026-07-10) — TASK-CP-FE-01 (listagem/filtro/exclusão) +
// TASK-CP-FE-02 (formulário).
//
//   GET    /api/v1/category-products          → data: CategoryProductListItem[]
//                                                + meta: paginação REAL
//                                                (ApiResponse::paginated).
//   GET    /api/v1/category-products/{uuid}   → data: CategoryProductDetail
//   POST   /api/v1/category-products          → payload CategoryProductPayload
//   PUT    /api/v1/category-products/{uuid}   → payload CategoryProductPayload
//                                                (SEMPRE completo —
//                                                `CategoryProductRequest::rules()`
//                                                é full-resource; só
//                                                `financial_category_uuid` é
//                                                `nullable`, nunca `sometimes`).
//   DELETE /api/v1/category-products/{uuid}   → 204; guard de dependências
//                                                (`kinds()`/`products.category_id`)
//                                                — 422 com mensagem de negócio
//                                                real (`DeleteCategoryProductAction`).
//
// `CategoryProduct` é o 2º nível de uma hierarquia `GroupProduct →
// CategoryProduct → Kind`, mas NÃO tem `parent_id` próprio — grid FLAT (achado
// #1/§"Complexidade" de TASK-CP-FE-01). Cadastro GLOBAL (não tenant-scoped) —
// mesmo racional de `Bank`/`ProductGroup`: o header `X-Farm-Id` continua sendo
// propagado automaticamente pelo interceptor axios (`src/services/api.ts`)
// em toda request, mas o backend simplesmente o ignora para este recurso —
// nenhum tratamento especial é necessário aqui (mesmo padrão observado em
// `product-group-service.ts`/`bank-service.ts`, que também nada fazem quanto
// a isso).
//
// Divergência de slug de permissão (DEC-006 — achado #1 de TASK-CP-FE-01): o
// contrato de API `APROVADO` decidiu `category_products_*` (DA-CP-08, NOVO,
// com underscore), mas o catálogo JÁ EXISTENTE do front só cataloga
// `categoryproducts_*` (legado, `permissionsCatalog.json:169-172`, SEM
// underscore) — o front usa o slug legado, PROIBIDO cunhar o novo. Divergência
// registrada, não resolvida aqui (não é responsabilidade destes tipos).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// CATEGORY PRODUCT (resposta da API)
// ============================================

export type CategoryProductTypeValue = 'INPUT' | 'EQUIPMENT' | 'PRODUCTION';

// TASK-CP-FE-FIX-02 — a API é ASSIMÉTRICA quanto à forma de `type`:
// `App\Enums\CategoryProductType` é um enum `int`-backed (INPUT=1,
// EQUIPMENT=2, PRODUCTION=3). O `CategoryProductResource` devolve o **nome**
// (`$this->resource->type->name`, ex.: "INPUT") no GET/listagem — por isso
// `CategoryProductTypeValue` (string) permanece correto para
// `CategoryProductListItem` acima (coluna de exibição da grid). Mas
// `CategoryProductRequest::rules()` valida `type` no POST/PUT com
// `Rule::enum(CategoryProductType::class)`, que para um enum `int`-backed
// exige o valor INTEIRO (1/2/3) — enviar o nome ("INPUT") no payload de
// escrita retorna 422 "The selected type is invalid". `CategoryProductTypeCode`
// é o tipo do valor que efetivamente viaja no payload de create/update.
//
// TASK-CP-FE-FIX-03 — correção do comentário anterior: o filtro da listagem
// (`CategoryProductFilterData`, spatie/laravel-data) NÃO aceita o nome —
// também é `int`-backed e exige o CÓDIGO (1/2/3), confirmado em homologação
// (filtro "Tipo" não filtrava nada quando o front enviava "INPUT"/"EQUIPMENT"/
// "PRODUCTION"). Por isso `CategoryProductFilterForm.type` abaixo usa
// `CategoryProductTypeCode`, não `CategoryProductTypeValue`.
export type CategoryProductTypeCode = 1 | 2 | 3;

export interface CategoryProductGroupRef {
  uuid: string;
  description: string;
}

export interface CategoryProductFinancialCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

export interface CategoryProductListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  type: CategoryProductTypeValue;
  /** Rótulo pronto do Resource ("Insumos"/"Máquinas"/"Produção") — usar direto na coluna da grid. */
  type_label: string;
  group: CategoryProductGroupRef;
  /** `whenLoaded`/`null` no Resource — nem toda Categoria tem Categoria Financeira vinculada. */
  financial_category: CategoryProductFinancialCategoryRef | null;
}

export interface CategoryProductDetail extends CategoryProductListItem {
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface CategoryProductsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CategoryProductsListEnvelope {
  success: boolean;
  message: string;
  data: CategoryProductListItem[];
  errors: Record<string, string[]> | null;
  meta: CategoryProductsApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload SEMPRE completo (description+is_enabled+type+group_uuid) —
// `CategoryProductRequest` é full-resource tanto no POST quanto no PUT.
// `financial_category_uuid` é o ÚNICO campo `nullable` — sempre presente no
// payload como `string` OU `null` explícito, nunca omitido/`undefined`.
// Nunca usar `Partial<>` aqui.
export interface CategoryProductPayload {
  description: string;
  is_enabled: boolean;
  /** Sempre o CÓDIGO inteiro (1/2/3) do enum backed — ver nota em `CategoryProductTypeCode`. Nunca o nome ("INPUT"). */
  type: CategoryProductTypeCode;
  group_uuid: string;
  financial_category_uuid: string | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface CategoryProductFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Server-side — vai na querystring de `/category-products`. */
  group_uuid?: string;
  /** DISPLAY-ONLY (mesmo padrão de `BreedFilterForm.specie_label`) — nunca enviado à API, só para re-hidratar o Select assíncrono sem novo fetch. */
  group_label?: string;
  /** TASK-CP-FE-FIX-03 — CÓDIGO inteiro (1/2/3), não o nome (`CategoryProductTypeValue`). Ver nota em `CategoryProductTypeCode`. */
  type?: CategoryProductTypeCode;
  /** TASK-CP-FE-FIX-03 — Ativo=1/Inativo=0 (backend tem `#[WithCast(bool)]`, string `'true'`/`'false'` era interpretada incorretamente). Omitido (`undefined`) quando nenhum status selecionado — NUNCA usar `||` para essa checagem no submit, `0` (Inativo) é falsy em JS. */
  is_enabled?: 0 | 1;
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface CategoryProductForm {
  description: string;
  /** Guarda o Option { label, value } inteiro (Select Ativo/Inativo). Convertido para boolean puro só no payload (`data.is_enabled?.value === 'true'`). */
  is_enabled: Option<string> | null;
  /** Select estático (Insumos/Máquinas/Produção) — options hardcoded no componente, não vem de uma API. Value é o CÓDIGO inteiro (1/2/3), não o nome — ver `CategoryProductTypeCode`. */
  type: Option<CategoryProductTypeCode> | null;
  /** SelectAsyncPaginate OBRIGATÓRIO — reaproveita `listProductGroups` (sem filtro de ativos, DA-CP-07). */
  group_uuid: Option<string> | null;
  /** SelectAsyncPaginate OPCIONAL — reaproveita `listFinancialCategories`, label `code — description`. */
  financial_category_uuid: Option<string> | null;
}
