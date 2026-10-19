// src/@types/v2/Cultivation/cultivation.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CULTURA/VARIEDADE (Cultivation) — API v1 do backend
// Laravel GB.Cerne.
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta } —
// Cultivation-contrato.md Seção 7):
//   GET    /cultivations/tree     → data: CultivationTreeNode[] (árvore completa,
//                                    não-paginada, tenant-scoped, todos os status)
//   GET    /cultivations/active   → data: CultivationTreeNode[] (raízes + filhos
//                                    habilitados, 1 nível — DA-CV-09, TASK-CV-04b)
//   GET    /cultivations/{uuid}   → data: CultivationData (TASK-CV-04b)
//   POST   /cultivations          → data: CultivationData (TASK-CV-04b)
//   PUT    /cultivations/{uuid}   → data: CultivationData (TASK-CV-04b)
//   DELETE /cultivations/{uuid}   → 204; 422 flat com `message` se houver vínculo
//                                    (toast genérico via `useRequest`, TASK-095-FE-05)
//
// `type` é COMPUTADO pela API (parent_id === null ? "cultura" : "variedade")
// — nunca persistido, nunca enviado de volta em nenhum payload de escrita
// (Cultivation-contrato.md Seção 4, Resource).
// -----------------------------------------------------------------------------

// ============================================
// LISTAGEM PAGINADA (`GET /cultivations`, aditivo TASK-FE-500 — consumido
// como catálogo de apoio/Select pelo módulo de Produtos, `listCultivations`
// em `cultivation-service.ts`). Rota `index()` já existe no backend
// (`CultivationController::index`, `ApiResponse::paginated`) — só não tinha
// função de frontend ainda (o módulo próprio de Cultivation usa `/tree`/
// `/active`). Sem `parent`/`children` (relações não eager-loaded no `index()`).
// ============================================

export interface CultivationListItem {
  uuid: string;
  name: string;
  is_enabled: boolean;
  /** Computado pela API — nunca enviar de volta em payload de escrita. */
  type: 'cultura' | 'variedade';
  created_at?: string;
  updated_at?: string;
}

export interface CultivationsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CultivationsListEnvelope {
  success: boolean;
  message: string;
  data: CultivationListItem[];
  errors: Record<string, string[]> | null;
  meta: CultivationsApiPaginationMeta | null;
}

// ============================================
// GET /cultivations/options (TASK-BE-600/601, aditivo TASK-FE-942) — lookup
// ENXUTO para o `SelectAsyncPaginate` de `cultivation_uuid`
// (`ProdutoEstoqueFinanceiroTab.tsx`, TASK-FE-947). Resource DEDICADO —
// shape `{uuid,label}`, DIFERENTE de `CultivationListItem` (`name`/`type`) —
// não reaproveitar. Catálogo PLANO, sem cascata (só `search`). SEM gate de
// permissão. FLAT (`ApiResponse::success`, `meta` sempre `null`).
// ============================================

export interface CultivationOption {
  uuid: string;
  label: string;
}

export interface CultivationOptionsListEnvelope {
  success: boolean;
  message: string;
  data: CultivationOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface CultivationTreeNode {
  uuid: string;
  name: string;
  is_enabled: boolean;
  /** Computado pela API — nunca enviar de volta em payload de escrita. */
  type: "cultura" | "variedade";
  /** Presente só em nós "cultura" (raiz) — MAX_DEPTH=2, nunca aninhado além de 1 nível. */
  children?: CultivationTreeNode[];
}

// ============================================
// FILTRO (busca client-side por nome — /tree não é paginado)
// ============================================

export interface CultivationFilterForm {
  search?: string;
}

// ============================================
// FORMULÁRIO (TASK-CV-04b — criar/editar Cultura/Variedade)
// ============================================

/** Referência mínima ao pai — Cultivation-contrato.md Seção 4 (Resource): o
 *  GET de detalhe expõe `parent` ANINHADO (objeto ou `null`), NUNCA um
 *  `parent_uuid` plano — diferente do payload de escrita (`CultivationRequest`),
 *  que usa `parent_uuid` escalar. Não confundir os dois shapes. */
export interface CultivationParentRef {
  uuid: string;
  name: string;
}

/** `GET /cultivations/{uuid}` — shape de leitura (`CultivationResource`). */
export interface CultivationData {
  uuid: string;
  name: string;
  is_enabled: boolean;
  /** Computado pela API — nunca enviar de volta em payload de escrita. */
  type: "cultura" | "variedade";
  /** `null` = é uma Cultura-raiz. Preenchido = é uma Variedade. */
  parent: CultivationParentRef | null;
  children?: CultivationTreeNode[];
  created_at?: string;
  updated_at?: string;
}

/** `POST /cultivations` — payload de criação. `type` NUNCA é enviado (é
 *  computado pela API a partir de `parent_uuid`). */
export interface CreateCultivationRequest {
  name: string;
  is_enabled: boolean;
  /** `null`/omitido = cria uma Cultura-raiz. Preenchido = cria uma Variedade. */
  parent_uuid?: string | null;
}

/** `PUT /cultivations/{uuid}` — payload de atualização. Full-resource-replace
 *  (`CultivationRequest` — `name`/`is_enabled` são `required` em todo PUT);
 *  `parent_uuid` também é sempre enviado (não é `prohibited` no update como
 *  em `CentroCusto`/`PlanAccount` — reparentar é caso de uso válido, e a
 *  chave omitida é tratada pelo backend como `null` explícito, zerando a
 *  hierarquia se não enviada). Nenhum campo é opcional neste payload —
 *  ver `CreateOrUpdateCultivation.tsx`, `tryPersistCultivation`. */
export interface UpdateCultivationRequest {
  name: string;
  is_enabled: boolean;
  parent_uuid: string | null;
}

/** Estado do `react-hook-form` (`parent_uuid` como string vazia = sem pai,
 *  nunca `null` diretamente no form — convertido na hora do payload). */
export interface CultivationForm {
  name: string;
  is_enabled: boolean;
  parent_uuid: string;
}
