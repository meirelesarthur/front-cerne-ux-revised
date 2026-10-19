// src/@types/v2/DocumentTypes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de TIPO DOCUMENTO (DocumentType — Administrativo / Gestão
// Documentos). Mesma classe estrutural de `AccountingGrouper` (nested-set,
// `code` gerado no servidor, sem paginação real) — ver
// `[[DocumentType-contrato-tela]]` §2-3.
//
// Contrato (fonte: `01-Arquitetura_e_Contratos/DocumentType-contrato.md`,
// `APROVADO` 2026-08-13):
//   GET    /document-types           → SEM paginação — array COMPLETO, já
//                                       ordenado por `code`. SEM parâmetro de
//                                       busca (`search`) no backend — filtro
//                                       100% CLIENT-SIDE (ver useDocumentTypes.tsx).
//   GET    /document-types/{uuid}    → data: DocumentTypeDetail (mesmo
//                                       Resource do index).
//   GET    /document-types/options   → lookup dedicado do "Antecessor"
//                                       (DocumentTypeOption, TASK-DT-FE-02).
//   POST   /document-types           → payload DocumentTypePayload (TASK-DT-FE-02).
//   PUT    /document-types/{uuid}     → payload DocumentTypePayload (TASK-DT-FE-02;
//                                       diferente de AccountingGrouper, `parent_uuid`
//                                       É processado no update — ver GAP-DT-02).
//   DELETE /document-types/{uuid}     → 204; SEM 422 estruturado confirmado
//                                       (`errors.in_use[]`) — tratamento via
//                                       fallback genérico (extractApiFieldErrorMessage),
//                                       NÃO um diálogo dedicado nesta rodada
//                                       (ver "Diferenças reais" da TASK-DT-FE-01).
//
// `DocumentTypeResource` NÃO expõe `children_count` — como a API devolve a
// árvore inteira, `hasChildren` é calculado no cliente a partir de
// `parent_uuid` (ver `DocumentTypeTreeRow.tsx`/`index.tsx`).
//
// Esta Tarefa (TASK-DT-FE-01) cobre só os tipos de LISTAGEM/EXCLUSÃO.
// `DocumentTypePayload`/`DocumentTypeForm`/`DocumentTypeOption` completam este
// arquivo em TASK-DT-FE-02.
// -----------------------------------------------------------------------------

// ============================================
// DOCUMENT TYPE (resposta da API)
// ============================================

export interface DocumentTypeListItem {
  uuid: string;
  /** Gerado no servidor (DA-DT-06, máscara `DOCUTP`) — SÓ LEITURA, nunca no payload. */
  code: string;
  name: string;
  order: number;
  is_enabled: boolean;
  parent_uuid: string | null;
  /** Nível na árvore (nested set `depth`, via `withDepth()`) — 0-based, raiz = 0. */
  depth: number;
}

// GET /document-types/{uuid} devolve o mesmo Resource do index() — sem campos
// extras só-de-detalhe.
export type DocumentTypeDetail = DocumentTypeListItem;

// ============================================
// ENVELOPE (ApiResponse::success — SEM meta de paginação)
// ============================================

export interface DocumentTypesListEnvelope {
  success: boolean;
  message: string;
  data: DocumentTypeListItem[];
  errors: Record<string, string[]> | null;
  // SEM meta de paginação — `DocumentTypeRepositoryInterface::listAll()`
  // devolve `Collection`, não um paginator.
  meta: null;
}

// ============================================
// FILTRO (drawer da listagem — client-side apenas, TASK-DT-FE-01)
// ============================================

export interface DocumentTypeFilterForm {
  /** Client-side apenas — nome OU código, sem round-trip de rede (`GET /document-types` não aceita `search`). */
  search?: string;
}

// ============================================
// LOOKUP DO ANTECESSOR (TASK-DT-FE-02)
// ============================================

/**
 * `GET /document-types/options` — `DocumentTypeOptionResource`, estruturado
 * (uuid/code/name separados; o FRONT compõe o label `código — nome`). SEM
 * `order`/`parent_uuid`/`depth` — Resource enxuto, não serve para calcular a
 * sugestão de `order` (ver `CreateOrUpdateDocumentType.tsx`, que usa
 * `useDocumentTypesList()` para isso).
 */
export interface DocumentTypeOption {
  uuid: string;
  code: string;
  name: string;
}

// ============================================
// PAYLOAD DE ESCRITA (POST/PUT — TASK-DT-FE-02)
// ============================================

export interface DocumentTypePayload {
  name?: string;
  is_enabled?: boolean;
  order?: number;
  /**
   * Aceito em CREATE e UPDATE (diferente de `AccountingGrouperPayload`, que
   * só aceita no create) — reparenting é operação válida neste módulo
   * (`DocumentTypeRequest::rules()`, `GAP-DT-02`: o servidor NÃO recalcula
   * `code` ao reparentar, mas processa o campo normalmente).
   */
  parent_uuid?: string | null;
}

// ============================================
// FORM (react-hook-form — TASK-DT-FE-02)
// ============================================

export interface DocumentTypeForm {
  name: string;
  is_enabled: 'true' | 'false' | undefined;
  order: number;
  parent_uuid: string | null;
}
