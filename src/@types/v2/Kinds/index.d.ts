// src/@types/v2/Kinds/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CLASSES DE PRODUTO (Kind — Cadastros Base / Estrutura,
// execução 024, TASK-FE-460). 3º nível da hierarquia
// GroupProduct → CategoryProduct → Kind. Contrato confirmado por leitura direta
// do fork `GB.Cerne.Api` (backend já implementado e testado):
//   app/Http/Controllers/Api/V1/KindController.php
//   app/Http/Requests/Api/V1/KindRequest.php
//   app/Http/Resources/V1/KindResource.php
//
//   GET    /api/v1/kinds          → data: KindListItem[], meta: paginação REAL
//                                    (ApiResponse::paginated, `per_page` default
//                                    backend 15 — o FRONT sempre envia 10)
//   GET    /api/v1/kinds/{uuid}   → data: KindData
//   POST   /api/v1/kinds          → payload KindPayload
//   PUT    /api/v1/kinds/{uuid}   → payload KindPayload (SEMPRE completo —
//                                    `KindRequest::rules()` NÃO diferencia
//                                    store/update por método, mesma nota de
//                                    `BreedPayload`)
//   DELETE /api/v1/kinds/{uuid}   → 204; 422 (`BusinessRuleException`) se
//                                    houver produtos vinculados
//                                    (`products.kind_id`)
//
// `category` é `{ uuid, description } | null` — NUNCA `category_id`/`id`
// sequencial (Resource confirmado por leitura direta). FK de Categoria é
// SEMPRE `category_uuid` (payload, filtro, resposta aninhada) — nunca
// `category_id` no contrato de front (Kind-Frontend-Contrato.md §1).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// KIND (resposta da API)
// ============================================

export interface KindCategoryRef {
  uuid: string;
  description: string;
}

export interface KindListItem {
  uuid: string;
  name: string;
  is_enabled: boolean;
  category: KindCategoryRef | null;
  created_at: string;
  updated_at: string;
}

// `show` devolve o mesmo shape de `index` (KindResource não acrescenta campos
// exclusivos de detalhe) — alias nomeado por simetria com o restante do
// projeto (BreedData/FarmDetail).
export interface KindData extends KindListItem {}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

// Mesmo shape de `BreedsApiPaginationMeta` (meta padrão Laravel do projeto).
export interface KindsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface KindsListEnvelope {
  success: boolean;
  message: string;
  data: KindListItem[];
  errors: Record<string, string[]> | null;
  meta: KindsApiPaginationMeta | null;
}

// ============================================
// GET /kinds/options (TASK-BE-601, aditivo TASK-FE-942) — lookup ENXUTO para
// o `SelectAsyncPaginate` de Classe da cascata Grupo→Categoria→Classe
// (`FilterSideCatalogo.tsx`/`CreateOrUpdateProduto.tsx`, TASK-FE-943/944) e
// para `ProdutoEstoqueFinanceiroTab.tsx` (TASK-FE-947). Resource DEDICADO —
// shape `{uuid,label}`, DIFERENTE de `KindListItem` (`name`/`category`) —
// não reaproveitar. Aceita `category_uuid` opcional (filtro por Categoria
// pai, preserva a cascata — GAP-FE-161 ✅ RESOLVIDA; `whereHas`, sem
// `Rule::exists` — `category_uuid` inexistente devolve LISTA VAZIA, não
// 422). SEM gate de permissão. FLAT (`ApiResponse::success`, `meta` sempre
// `null`).
// ============================================

export interface KindOption {
  uuid: string;
  label: string;
}

export interface KindOptionsListEnvelope {
  success: boolean;
  message: string;
  data: KindOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface KindPayload {
  name: string;
  is_enabled: boolean;
  /** Obrigatório — backend rejeita (422) `null`/ausente. Nunca `category_id`. */
  category_uuid: string;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface KindFilterForm {
  /** Busca por `name` (param `search` do backend). */
  search?: string;
  /** Filtro SERVER-SIDE — enviado como `category_uuid` na querystring de `/kinds`. */
  category_uuid?: string;
  /**
   * DISPLAY-ONLY (BUG-FE — E2E feature 024) — label da Categoria
   * selecionada, persistido só para re-hidratar o `SelectAsyncPaginate` do
   * drawer com o NOME em vez do uuid cru quando o filtro reabre. NÃO é
   * enviado à API (`useKinds.tsx`/`kind-service.ts` repassam só `search`/
   * `is_enabled`/`category_uuid` à querystring de `/kinds`). Mesmo padrão de
   * `BreedFilterForm.specie_label`.
   */
  category_label?: string;
  /**
   * `KindIndexRequest` (regra `boolean`) só aceita `1,0,'1','0',true,false`
   * reais — `'true'/'false'` (strings) são REJEITADAS (422) e o grid nunca
   * filtra (BUG-FE — E2E feature 024). Contrato de front usa `'1'`/`'0'`.
   */
  is_enabled?: '' | '1' | '0';
}

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

export interface KindForm {
  name: string;
  is_enabled: boolean;
  /**
   * Componente é `SelectAsyncPaginate` (busca paginada por
   * `listActiveCategoryProducts`) — por isso o campo guarda o par
   * `{ label, value }` completo (`Option`), não a uuid crua (mesma convenção
   * de `specie_uuid` em `BreedForm`). Conversão pro payload cru
   * (`category_uuid: string`) só no submit. Obrigatório — nunca `null` no
   * payload final.
   */
  category_uuid: Option<string> | null;
}
