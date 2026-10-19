// src/@types/v2/CostCenters/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CENTROS DE CUSTO — API v1 do backend Laravel GB.Cerne.
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /cost-centers            → data: CostCenterListItem[] + meta (paginação FIXA 50/página, sem per_page)
//   GET    /cost-centers/{uuid}     → data: CostCenterDetail (inclui categories/apportionments)
//   POST   /cost-centers            → payload CostCenterPayload (parent_uuid aceito só aqui)
//   PUT    /cost-centers/{uuid}     → payload CostCenterPayload (parent_uuid PROIBIDO — imutável após criar)
//   DELETE /cost-centers/{uuid}     → 204 (falha com message de negócio se referenciado — FK RESTRICT)
//
// Fonte: Model/Request/Resource/Enums de `GB.Cerne.Api` batidos linha a linha
// nesta rodada de planejamento (TASK-FE-001). NÃO usar `centrosCusto.types.ts`
// do design system como fonte de tipo — diverge em `type` (2 valores reais,
// não as 3 do mock) e em outros pontos documentados na Tarefa.
//
// DEC-005 — Autorização por Item: flags `can_edit`, `can_delete`, `can_create_descendant`
// (vide GAP-BE-032 — contrato final no `CostCenterResource` do backend; estas 3 flags
// são a ÚNICA fonte de verdade para ações condicionais em TASK-FE-013/014/015).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// COST CENTER (resposta da API)
// ============================================

export interface CostCenterRef {
  uuid: string;
  code: string;
  description: string;
  /**
   * TASK — presente só no envelope de `/cost-centers/options/global`
   * (`CostCenterOptionResource`, `is_root: is_null(parent_id)`). Campo
   * ADITIVO/OPCIONAL — os demais consumidores de `CostCenterRef` (parent
   * de `CostCenterListItem`/`CostCenterDetail`, `/cost-centers/options`
   * padrão etc.) continuam sem essa chave, sem quebra de tipo.
   */
  is_root?: boolean;
}

export interface CostCenterApportionmentRef extends CostCenterRef {
  percentage: number;
}

export interface CostCenterListItem {
  uuid: string;
  code: string;
  description: string;
  type: 'productive' | 'apportioned';
  type_label: string;
  /** 1=EXPENSE (Despesa) · 2=REVENUE (Receita) · 3=BOTH (Ambos). */
  condition: 1 | 2 | 3;
  condition_label: string;
  /** 1=SYNTHETIC (Sintético) · 2=ANALYTICAL (Analítico) — só saída, derivado por profundidade. */
  class: 1 | 2;
  class_label: string;
  is_enabled: boolean;
  /** "Apontamento" — não confundir com `apportionments` (rateio). */
  allow_pointing: boolean;
  /** DEC-005 — autorização POR ITEM (não confundir com a permissão genérica `costcenters_edit`). Fonte de verdade 100% backend. */
  can_edit: boolean;
  /** DEC-005 — idem, para exclusão. */
  can_delete: boolean;
  /**
   * DEC-005 — o usuário autenticado pode cadastrar um descendente direto (1 nível)
   * deste item. Só verdadeiro para sintéticos elegíveis (vinculados ao tenant do
   * contratante, ou qualquer sintético para Gestor_Plataf) — a UI NUNCA recalcula
   * esta regra a partir de `class`/vínculo; só consome o booleano.
   */
  can_create_descendant: boolean;
  /** Centro-pai (só uuid/code/description) — null se for raiz (Sintético). */
  parent: CostCenterRef | null;
}

// `categories`/`apportionments` só vêm preenchidos em `show`/`store`/`update`
// (o `index`/listagem só faz eager-load de `parent`) — por isso NÃO fazem
// parte de `CostCenterListItem`, só de `CostCenterDetail`.
export interface CostCenterDetail extends CostCenterListItem {
  categories: CostCenterRef[];
  apportionments: CostCenterApportionmentRef[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface CostCentersApiPaginationMeta {
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

export interface CostCentersListEnvelope {
  success: boolean;
  message: string;
  data: CostCenterListItem[];
  errors: Record<string, string[]> | null;
  meta: CostCentersApiPaginationMeta | null;
}

// ============================================
// OPTIONS (GET /cost-centers/options — GAP-BE-040 addendum, TASK-BE-355/
// TASK-FE-332) — lookup ENXUTO sem gate de `costcenters_view`, mesma
// tenancy híbrida de `/cost-centers` (farm.context.optional). Resource
// dedicado (`CostCenterOptionResource`) devolve só `uuid`+`code`+
// `description` — mesmo shape de `CostCenterRef`, reaproveitado aqui (não
// criar um tipo `CostCenterOptionItem` redundante). NUNCA usar
// `listCostCenters`/`CostCenterListItem` (CRUD completo, gated) neste
// select — mirror exato de `listCityOptions`/`CityListItem`.
// ============================================

export interface CostCenterOptionsListEnvelope {
  success: boolean;
  message: string;
  data: CostCenterRef[];
  errors: Record<string, string[]> | null;
  meta: CostCentersApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CostCenterPayload {
  description: string;
  condition: 1 | 2 | 3;
  is_enabled: boolean;
  type?: 'productive' | 'apportioned';
  allow_pointing?: boolean;
  /** Só no CREATE — o backend rejeita (`prohibited`) este campo no UPDATE. */
  parent_uuid?: string | null;
  /**
   * TASK-FE-314 (execução 023) — `CostCenterRequest` passou a aceitar
   * `category_uuids: string[]` (TASK-BE-341/commit `8203b8815`, GAP-FE-102
   * resolvido), resolvendo uuid→id na própria Action. SEMPRE enviado no
   * UPDATE, mesmo vazio — `UpdateCostCenterAction`/`SyncCostCenterCategoriesAction`
   * rodam incondicionalmente a cada update (mesma semântica já documentada
   * para `center_uuids` em `FinancialCategoryRequest`, contrato-irmão):
   * omitir a chave desvincularia TODAS as categorias já associadas.
   */
  category_uuids?: string[];
  apportionments?: { cost_center_uuid: string; percentage: number }[];
}

// ============================================
// REACT HOOK FORM (TASK-FE-003 — campos centrais)
// ============================================

export interface CostCenterForm {
  uuid?: string;
  description: string;
  /**
   * STRING no formulário — mesma convenção de `CostCenterFilterForm.type`/
   * `is_enabled` (o componente `Select` trabalha com valores string; a
   * conversão para o `number` real do payload acontece só no submit da tela).
   */
  condition?: '1' | '2' | '3';
  is_enabled: boolean;
  allow_pointing?: boolean;
  type?: 'productive' | 'apportioned';
  /**
   * Componente é `SelectAsyncPaginate` (busca paginada, sem lista fechada) —
   * por isso o campo guarda o par `{ label, value }` completo (`Option`), não
   * a uuid crua (mesma convenção interna de `FilterSideCentroCusto.tsx`).
   * Conversão pro payload cru (`parent_uuid: string | null`) só no submit.
   * Só é editável no CREATE — em edição vem populado (via `data.parent`) e
   * `disabled`.
   */
  parent_uuid: Option<string> | null;
  /**
   * Tipado desde já (Lei 2 — Orquestração de Formulário) mesmo a UI de
   * seleção só entrando em TASK-FE-004 — evita retrabalho de tipos entre as
   * duas tarefas. NUNCA populado a partir do servidor e NUNCA enviado no
   * payload por esta tarefa (ver nota em `CreateOrUpdateCentroCusto.tsx`).
   */
  apportionments: { cost_center_uuid: string; percentage: number }[];
  /**
   * TASK-FE-314 (execução 023) — uuids das Categorias Financeiras vinculadas
   * (`CheckboxListField`). Populado em edição a partir de
   * `costCenterData.categories.map(c => c.uuid)`; SEMPRE enviado no payload
   * de update (mesmo vazio — ver `CostCenterPayload.category_uuids`).
   */
  category_uuids: string[];
}

// ============================================
// ÁRVORE (GET /api/v1/cost-centers/tree — TASK-BE-351/TASK-FE-317)
// ============================================
// Endpoint novo, só-leitura, sem paginação — mirror exato de
// `GET /financial-categories/tree` (mesmo nó homogêneo de 6 campos). Devolve
// a árvore INTEIRA (grupos Sintéticos globais + folhas Analíticas do tenant
// atual) numa única resposta, para consumo do `CategoryTreeSelector`
// (`CreateOrUpdateFinancialCategory.tsx`, campo "Centros de Custo
// vinculados").

/** Classe do centro de custo: 1 = Sintético (grupo), 2 = Analítico (folha). */
export type CostCenterTreeClass = 1 | 2;

/**
 * Nó da árvore — HOMOGÊNEO (mesmos 6 campos em grupo e folha, `children`
 * sempre presente como array, vazio na folha). Estruturalmente idêntico a
 * `FinancialCategoryTreeNode` e compatível com `CategoryTreeSelectorNode`
 * (`CategoryTreeSelector.tsx`, TASK-FE-317) — nenhum `extends` necessário
 * (TypeScript estrutural).
 */
export interface CostCenterTreeNode {
  uuid: string;
  code: string;
  description: string;
  class: CostCenterTreeClass;
  class_label: string;
  is_enabled: boolean;
  children: CostCenterTreeNode[];
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface CostCenterFilterForm {
  /** Busca por código/descrição (param `search` do backend, ILIKE). */
  search?: string;
  /** 2 valores reais — NÃO as 3 opções (Produtivo/Improdutivo/Administrativo) do mock de UX. */
  type?: 'productive' | 'apportioned' | '';
  is_enabled?: '' | 'true' | 'false';
}
