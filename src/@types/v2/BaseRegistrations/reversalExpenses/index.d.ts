// src/@types/v2/BaseRegistrations/reversalExpenses/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ESTORNO (ReversalExpense) — API v1 do backend Laravel
// GB.Cerne. Mirror de @types/v2/Warehouses (mesmo mecanismo Farm-scoped via
// HasFarmTenantScope, D1-A do contrato), COM UMA DIFERENÇA CENTRAL: `value`
// chega como STRING decimal ("1234.5600", cast decimal:4 serializado) —
// SEMPRE Number(...) antes de qualquer uso numérico (grid/MoneyInput).
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /reversal-expenses          → data: ReversalExpenseListItem[] + meta
//                                         (paginação UNIVERSAL do contrato §6,
//                                         default 10)
//   GET    /reversal-expenses/{uuid}   → data: ReversalExpenseDetail (idêntico
//                                         ao index — sem agregação extra)
//   POST   /reversal-expenses          → payload ReversalExpensePayload
//   PUT    /reversal-expenses/{uuid}   → payload ReversalExpensePayload
//   DELETE /reversal-expenses/{uuid}   → 204, ou 422 (BusinessRuleException)
//                                         se houver vínculo FK real
//
// Fonte: ReversalExpense-contrato.md v1.0 §6/§7/§7.1/§8 (APROVADO).
//
// O Resource NUNCA expõe `id`/`farm_id`/`status` (nome físico)/`type`/
// `pay_team`/`has_commission`/`commission` (D1/D7/D8 do contrato backend) —
// só `uuid`, `description`, `is_enabled`, `value`, `use_kg`.
// -----------------------------------------------------------------------------

// ============================================
// REVERSAL EXPENSE (resposta da API)
// ============================================

export interface ReversalExpenseListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  /** STRING decimal da API (ex.: "1234.5600") — Number(...) antes de usar. */
  value: string;
  use_kg: boolean;
}

// show === index no shape — alias estrutural (mesmo padrão de WarehouseDetail).
export type ReversalExpenseDetail = ReversalExpenseListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ReversalExpensesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ReversalExpensesListEnvelope {
  success: boolean;
  message: string;
  data: ReversalExpenseListItem[];
  errors: Record<string, string[]> | null;
  meta: ReversalExpensesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface ReversalExpensePayload {
  description: string;
  is_enabled: boolean;
  /** Payload SEMPRE número puro (MoneyInput.onValueChange já entrega number). */
  value: number;
  use_kg: boolean;
  // farm_id/type: NUNCA — vem do FarmContext/Global Scope do backend (D1/D1-A).
}

// ============================================
// REACT HOOK FORM — `value` é NUMBER no form (MoneyInput trabalha com number puro).
// ============================================

export interface ReversalExpenseForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  value: number;
  use_kg: boolean;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface ReversalExpenseFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Status — Select estático Ativo/Inativo. Sem filtro de `type` (campo nem exposto). */
  is_enabled?: '' | 'true' | 'false';
}
