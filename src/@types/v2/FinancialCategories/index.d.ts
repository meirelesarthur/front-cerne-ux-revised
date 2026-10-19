// src/@types/v2/FinancialCategories/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CATEGORIAS FINANCEIRAS — API v1 do backend Laravel
// GB.Cerne. Nasceu ENXUTO (TASK-PA-03b/TASK-PA-16), só para popular o
// multi-select de `category_uuids` do formulário de Plano de Contas — TASK-FE-310
// (execução 023) ESTENDE para o CRUD completo (tela de gestão própria,
// `01-Arquitetura_e_Contratos/FinancialCategory/FinancialCategory-Gestao-Contrato`),
// sem duplicar/recriar o arquivo (preserva os comentários de proveniência
// original abaixo, só acrescenta).
//
// GAP-FE-100 (aceito, Opção A — v1): `/financial-categories` e
// `/financial-categories/tree` só expõem profundidade 2 (grupo global) e 3
// (folha do tenant) — não há como a tela alcançar nível 0/1.
// GAP-FE-103 (RESOLVIDO, TASK-FE-315, execução 023): `TASK-BE-350` estendeu
// `FinancialCategoryApiRepository::findByUuidOrFail()` (eager-load de
// `centers`) e `FinancialCategoryResource::toArray()` (`centers[].uuid/code/
// description`, `whenLoaded`) — mesmo padrão espelhado de
// `CostCenterResource.categories[]` (ponta inversa da mesma relação N:N).
// `FinancialCategoryDetail.centers` passa a existir e o formulário
// (TASK-FE-312/315) usa o `CheckboxListField` de Centros de Custo já
// PERSISTIDO (prefill real + `center_uuids` sempre no payload).
// -----------------------------------------------------------------------------

import type { CostCenterRef } from '@/@types/v2/CostCenters';

export interface FinancialCategoryRef {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// GET /financial-categories/options (TASK-BE-508, GAP-BE-040 Opção B) —
// lookup ENXUTO consumido pelo campo `financial_category_uuid` de Produtos
// (TASK-FE-504). Resource dedicado (`FinancialCategoryOptionResource`,
// uuid+code+description), SEM gate de `financialcategories_view` — mirror
// `CostCenterOptionResource`/`listCostCenterOptions`. PAGINADO (desvio
// deliberado, Product-contrato.md §17.2 — até ~840 linhas por tenant, mesma
// ordem de grandeza que já justificou a paginação de
// `CostCenterController::options()`), diferente dos outros 4 endpoints
// `/options` novos desta rodada (warehouses/addressings/product-packages/
// measurements — todos FLAT).
// ============================================

export interface FinancialCategoryOption {
  uuid: string;
  code: string;
  description: string;
}

export interface FinancialCategoryOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FinancialCategoryOptionsListEnvelope {
  success: boolean;
  message: string;
  data: FinancialCategoryOption[];
  errors: Record<string, string[]> | null;
  meta: FinancialCategoryOptionsApiPaginationMeta | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /api/v1/financial-categories)
// ============================================

export interface FinancialCategoriesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

// `data` é o Resource COMPLETO (`FinancialCategoryResource`), não o
// `FinancialCategoryRef` enxuto (3 campos) — o índice sempre devolveu o
// Resource inteiro (TASK-FE-310 só passou a MODELAR os campos extras, que já
// vinham do backend antes desta execução). `FinancialCategoryListItem` é
// superset de `FinancialCategoryRef` — consumidores que só leem
// `uuid`/`code`/`description` (`SelectAsyncPaginate.mapOptions`) continuam
// funcionando sem alteração.
export interface FinancialCategoriesListEnvelope {
  success: boolean;
  message: string;
  data: FinancialCategoryListItem[];
  errors: Record<string, string[]> | null;
  meta: FinancialCategoriesApiPaginationMeta | null;
}

// ============================================
// ÁRVORE (GET /api/v1/financial-categories/tree — TASK-PA-16)
// ============================================
// Endpoint novo, só-leitura, sem paginação — devolve a árvore INTEIRA
// (grupos Sintéticos globais + folhas Analíticas do tenant atual) numa única
// resposta, mesmo padrão de `GET /permissions/tree`. Ver
// `01-Arquitetura_e_Contratos/FinancialCategory-Tree-Addendum` (contrato) e
// `06-Tarefas_Backend/TASK-PA-15-BE-financialcategory-tree-endpoint` (Tester,
// ✅ CONCLUÍDO, SMOKE 5/5).

/** Classe da categoria: 1 = Sintético (grupo), 2 = Analítico (folha). */
export type FinancialCategoryTreeClass = 1 | 2;

/**
 * Nó da árvore — HOMOGÊNEO (mesmos campos em grupo e folha, `children`
 * sempre presente como array, vazio na folha). Diferente do nó heterogêneo
 * de `PermissionTreeNode` (`title/items` × `name/description/uuid`) — não
 * precisa de type-guard `isLeaf()`, usar `node.class === 2` (ou
 * `node.children.length === 0`) para distinguir folha de grupo.
 *
 * Grupos Sintéticos sem nenhuma folha do tenant atual aparecem com
 * `children: []` (paridade com o índice paginado, DoD confirmado pelo
 * Tester de `TASK-PA-15-BE`).
 *
 * TASK-FE-318/GAP-BE-112 — `can_edit`/`can_delete`: autorização POR NÓ
 * (não confundir com a permissão genérica `financialcategories_edit`/
 * `_delete`). Fonte de verdade 100% backend (`FinancialCategoryTreeResource`,
 * `TASK-BE-352`) — a UI NUNCA recalcula esta regra a partir de `tenant_id`/
 * `class`, só consome o booleano (mesma disciplina de `CostCenterListItem`).
 * DESVIO DELIBERADO vs. `CostCenterTreeNode` (que não tem essas flags,
 * propositalmente enxuto — lá a árvore é só um seletor auxiliar; aqui a
 * árvore é a listagem REAL/DEFAULT da tela, por isso precisa das flags).
 */
export interface FinancialCategoryTreeNode {
  uuid: string;
  code: string;
  description: string;
  class: FinancialCategoryTreeClass;
  class_label: string;
  is_enabled: boolean;
  can_edit: boolean;
  can_delete: boolean;
  children: FinancialCategoryTreeNode[];
}

// ============================================
// CRUD (TASK-FE-310, execução 023 — tela de gestão)
// ============================================

/** `classification` real do backend (`FinancialCategoryClassification`). */
export type FinancialCategoryClassification = 'N' | 'C' | 'O';

/**
 * Item da listagem paginada (`GET /financial-categories`, índice) — Resource
 * completo (`FinancialCategoryResource`), diferente do nó enxuto da árvore
 * (`FinancialCategoryTreeNode`, só 6 campos) e do `FinancialCategoryRef`
 * (só 3 campos, uso de multi-select). Mesmo recorte de profundidade do
 * índice (GAP-FE-100): só aparecem categorias de profundidade 2 (grupo
 * global) e 3 (folha do tenant atual).
 */
export interface FinancialCategoryListItem {
  uuid: string;
  code: string;
  description: string;
  /** 1 = Sintético (grupo) · 2 = Analítico (folha). */
  class: FinancialCategoryTreeClass;
  class_label: string;
  is_enabled: boolean;
  generates_obligation_or_right: boolean;
  classification: FinancialCategoryClassification | null;
  classification_label: string | null;
  /** Profundidade real na árvore nested-set (0-3) — só informativo aqui, a tela nunca recalcula. */
  depth: number | null;
  tenant_id: number | null;
  type_uuid: string | null;
  type: { uuid: string; description: string } | null;
  grouper_uuid: string | null;
  grouper: { uuid: string; name: string } | null;
  accounting_grouper_uuid: string | null;
  accounting_grouper: { uuid: string; name: string; code: string } | null;
  parent_uuid: string | null;
  /**
   * TASK-BE-971 (aditivo ao `FinancialCategoryResource`) — objeto do PAI
   * IMEDIATO, para exibição read-only do campo "Antecessor" (contrato
   * `_forms.blade.php`, `parent_id`, sempre readonly no legado) na tela de
   * edição (TASK-FE-1091). `null` para categorias RAIZ (`parent_uuid ===
   * null`); mesmo shape enxuto de `FinancialCategoryRef`. `parent_uuid`
   * (acima) continua a chave crua usada no payload — este campo é só
   * leitura/exibição.
   */
  parent?: FinancialCategoryRef | null;
  /**
   * TASK-FE-318/GAP-BE-112 — autorização POR ITEM (não confundir com a
   * permissão genérica `financialcategories_edit`). Fonte de verdade 100%
   * backend (`FinancialCategoryResource`, `TASK-BE-352`) — a UI NUNCA
   * recalcula esta regra a partir de `tenant_id`, só consome o booleano
   * (mirror de `CostCenterListItem.can_edit`).
   */
  can_edit: boolean;
  /** TASK-FE-318/GAP-BE-112 — idem, para exclusão. */
  can_delete: boolean;
}

/**
 * `GET /financial-categories/{uuid}` (show) — MESMO Resource do índice
 * (a restrição de profundidade do índice NÃO se aplica aqui, `applyTenancy`,
 * mais permissiva, contrato §3.3), mas só alcançável se o uuid já for
 * conhecido, ACRESCIDO de `centers` (só carregado em show/store/update —
 * mesmo recorte de `CostCenterDetail.categories` na ponta inversa).
 *
 * GAP-FE-103 (RESOLVIDO, TASK-BE-350) — `centers[]` agora é exposto pelo
 * backend (`FinancialCategoryApiRepository::findByUuidOrFail()` eager-load +
 * `FinancialCategoryResource::toArray()` `whenLoaded`). O formulário
 * (TASK-FE-312/315) usa `centers[].uuid` para o prefill real do
 * `CheckboxListField` de Centros de Custo.
 */
export interface FinancialCategoryDetail extends FinancialCategoryListItem {
  centers: CostCenterRef[];
}

// ============================================
// ENVELOPE DE DETALHE (ApiResponse::success — GET/POST/PUT /financial-categories)
// ============================================

export interface FinancialCategoryDetailEnvelope {
  success: boolean;
  message: string;
  data: FinancialCategoryDetail;
  errors: Record<string, string[]> | null;
}

// ============================================
// FILTRO (drawer da listagem — TASK-FE-311)
// ============================================
// SEM filtro por Tipo/Agrupador (contrato §3.1) — o backend espera
// `type_id`/`grouper_id` NUMÉRICOS internos, que o front nunca tem (só
// `type_uuid`/`grouper_uuid`). Omissão deliberada, não é regressão (não
// existia tela nenhuma antes desta execução).
export interface FinancialCategoryFilterForm {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  classification?: FinancialCategoryClassification | '';
}

// ============================================
// REQUEST TYPES (create/update — contrato §3.4/§3.5)
// ============================================

export interface FinancialCategoryPayload {
  description: string;
  is_enabled: boolean;
  type_uuid: string;
  grouper_uuid: string;
  generates_obligation_or_right: boolean;
  classification: FinancialCategoryClassification;
  /**
   * Só no CREATE — o backend rejeita no update (hierarquia imutável).
   * `string` no fluxo "criar filho" (`?parentUuid`); `null` explícito no
   * fluxo "criar raiz" (TASK-FE-1072, `FinancialCategoryRequest.parent_uuid`
   * é `nullable` — `GenerateFinancialCategoryCodeAction::generateForRoot()`
   * gera o código raiz e a categoria nasce Sintética, `class=1`).
   */
  parent_uuid?: string | null;
  accounting_grouper_uuid?: string | null;
  /**
   * TASK-FE-315 (GAP-FE-103 resolvido) — SEMPRE enviado no payload de
   * create/update (mesmo `[]`), nunca omitido por guarda de `dirtyFields`:
   * `StoreFinancialCategoryAction`/`UpdateFinancialCategoryAction` rodam
   * `syncCenters()` incondicionalmente a cada chamada (mesma semântica já
   * documentada para `category_uuids` em `CostCenterPayload`, contrato-irmão)
   * — omitir a chave desvincularia TODOS os Centros de Custo já associados.
   */
  center_uuids?: string[];
}

// ============================================
// REACT HOOK FORM (TASK-FE-312 — formulário criar/editar)
// ============================================

export interface FinancialCategoryForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  /** `SelectAsyncPaginate` guarda o par `{label, value}` completo (mesma convenção de Grouper/CostCenter). */
  type_uuid: import('@/@types/option').Option<string> | null;
  grouper_uuid: import('@/@types/option').Option<string> | null;
  generates_obligation_or_right: boolean;
  classification: FinancialCategoryClassification | undefined;
  accounting_grouper_uuid: import('@/@types/option').Option<string> | null;
  /**
   * TASK-FE-315 (GAP-FE-103 resolvido) — prefill real via
   * `FinancialCategoryDetail.centers[].uuid` (leitura, `TASK-BE-350`) e
   * SEMPRE incluído no payload de create/update (mesmo vazio, contrato §3.5)
   * — mesmo padrão de `CostCenterForm.category_uuids`.
   */
  center_uuids: string[];
}
