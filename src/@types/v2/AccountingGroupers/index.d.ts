// src/@types/v2/AccountingGroupers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de AGRUPADORES CONTÁBEIS (AccountingGrouper — Cadastros
// Base / Financeiros, domínio DRE). NÃO é `Grouper` (agrupador de ESTOQUE,
// `src/@types/v2/Groupers`, rota `/api/v1/groupers`) — módulos IRMÃOS, ambos
// nested-set (`kalnoy/nestedset`), mas domínios/permissões/rotas distintos
// (TASK-ACG-01, "Armadilha de identidade").
//
// Contrato (fonte: código real — AccountingGrouperController/Request/
// Resource/Repository/Actions, sem `.md` de contrato dedicado):
//   GET    /api/v1/accounting-groupers          → SEM paginação — devolve a
//                                                  árvore INTEIRA (Collection,
//                                                  `ApiResponse::success()`,
//                                                  nunca `::paginated()`),
//                                                  já ordenada por
//                                                  depth/nested-set
//                                                  (`withDepth()`+
//                                                  `defaultOrder()`). Único
//                                                  filtro real: `search`
//                                                  (name OU code, ILIKE).
//   GET    /api/v1/accounting-groupers/{uuid}   → data: AccountingGrouperDetail
//                                                  (mesmo Resource do index).
//   POST   /api/v1/accounting-groupers          → payload AccountingGrouperPayload
//                                                  (`parent_uuid` só aqui).
//   PUT    /api/v1/accounting-groupers/{uuid}    → payload AccountingGrouperPayload
//                                                  — `parent_uuid` NUNCA é
//                                                  processado pelo backend no
//                                                  update (`AccountingGrouperRequest.php:24`,
//                                                  `UpdateAccountingGrouperAction.php:23-28`)
//                                                  — nunca enviado (TASK-ACG-02).
//   DELETE /api/v1/accounting-groupers/{uuid}    → 204; 422 estruturado
//                                                  `errors.in_use[]` se houver
//                                                  filhos e/ou
//                                                  `FinancialCategory`
//                                                  vinculada
//                                                  (`CheckAccountingGrouperDependenciesAction`).
//
// `AccountingGrouperResource` NÃO expõe `children_count` (diferente de
// `Grouper`) — como a API devolve a árvore inteira, `hasChildren` é
// calculado no cliente com 100% de confiabilidade a partir de `parent_uuid`
// (ver `AccountingGrouperTreeRow.tsx`/`index.tsx`).
// -----------------------------------------------------------------------------

// ============================================
// ACCOUNTING GROUPER (resposta da API)
// ============================================

export interface AccountingGrouperListItem {
  uuid: string;
  /** Gerado no servidor pela máscara GROUPF (nested-set) — SÓ LEITURA, nunca no payload. */
  code: string;
  name: string;
  is_enabled: boolean;
  order: number;
  /** Nível na árvore (nested set `depth`) — 0-based, raiz = 0. */
  depth: number;
  /** SÓ é enviado no payload de CREATE — no update é sempre ignorado pelo backend (ver TASK-ACG-02). */
  parent_uuid: string | null;
}

// GET /accounting-groupers/{uuid} devolve o mesmo Resource do index() — sem
// campos extras só-de-detalhe.
export type AccountingGrouperDetail = AccountingGrouperListItem;

// ============================================
// ENVELOPE (ApiResponse::success — SEM meta de paginação)
// ============================================

export interface AccountingGroupersListEnvelope {
  success: boolean;
  message: string;
  data: AccountingGrouperListItem[];
  errors: Record<string, string[]> | null;
  // SEM meta de paginação — `ApiResponse::success()`, não `::paginated()`.
  meta: null;
}

// ============================================
// EXCLUSÃO BLOQUEADA (422 `errors.in_use[]` — CheckAccountingGrouperDependenciesAction)
// ============================================

export interface AccountingGrouperInUseError {
  success: false;
  message: string;
  errors: {
    in_use: Array<{ resource: string; table: string; count: number }>;
  };
}

// ============================================
// REQUEST TYPES (TASK-ACG-02)
// ============================================

// `parent_uuid` — SÓ usado no create (raiz opcional ou descendente); nunca
// enviado no update (o backend nunca processa a chave nesse verbo, ver nota
// de topo do arquivo).
export interface AccountingGrouperPayload {
  name: string;
  is_enabled: boolean;
  order: number;
  parent_uuid?: string;
}

// ============================================
// FILTRO (drawer da listagem — TASK-ACG-01)
// ============================================

export interface AccountingGrouperFilterForm {
  /** Busca por `name` OU `code` (param `search` do backend, ILIKE). */
  search?: string;
}

// ============================================
// REACT HOOK FORM (formulário create/edit — TASK-ACG-02)
// ============================================

export interface AccountingGrouperForm {
  name: string;
  /** Convenção do projeto (ver GrouperForm/LowReasonForm): form guarda STRING crua, conversão p/ boolean só no submit. */
  is_enabled: 'true' | 'false' | undefined;
  order: number;
  /** Pai selecionado (uuid) ou `null` (raiz). Só é EDITÁVEL em criar-raiz — sempre read-only em criar-descendente/edição. */
  parent_uuid: string | null;
}
