// src/@types/v2/BaseRegistrations/serviceExpense/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de SERVIÇOS (ServiceExpense) — API v1 do backend Laravel
// GB.Cerne. Mirror de @types/v2/ReversalExpenses (mesma tabela física
// service_reversals, mesmo mecanismo Farm-scoped via HasFarmTenantScope), COM
// 3 CAMPOS EXCLUSIVOS (pay_team, has_commission, commission — D-S3 do
// ServiceExpense-contrato.md §4).
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /service-expenses          → data: ServiceExpenseListItem[] + meta
//                                        (paginação UNIVERSAL do contrato §6,
//                                        default 10)
//   GET    /service-expenses/{uuid}   → data: ServiceExpenseDetail (idêntico
//                                        ao index — sem agregação extra)
//   POST   /service-expenses          → payload ServiceExpensePayload
//   PUT    /service-expenses/{uuid}   → payload ServiceExpensePayload
//   DELETE /service-expenses/{uuid}   → 204, ou 422 (BusinessRuleException)
//                                        se houver vínculo FK real
//
// Fonte: ServiceExpense-contrato.md v1.1 §6/§7/§8 (APROVADO).
//
// O Resource NUNCA expõe `id`/`farm_id`/`status` (nome físico)/`type` — mas,
// diferente do irmão ReversalExpense, ESTE módulo expõe `pay_team`/
// `has_commission`/`commission` (D-S3, o oposto exato de D7/D8 do irmão).
//
// `value` (decimal(12,4)) E `commission` (decimal(12,2)) chegam como STRING
// decimal da API (ex.: "1234.5600"/"12.50") — mesmo mecanismo de cast
// Eloquent já documentado para `value` em ReversalExpense-contrato.md; por
// analogia direta, `commission` recebe o MESMO tratamento — Number(...)
// obrigatório antes de qualquer uso numérico (grid, input do form). Não
// presumir `number` nativo no JSON para nenhum dos dois.
// -----------------------------------------------------------------------------

// ============================================
// SERVICE EXPENSE (resposta da API)
// ============================================

export interface ServiceExpenseListItem {
  uuid: string;
  description: string;
  is_enabled: boolean;
  /** STRING decimal da API (ex.: "1234.5600") — Number(...) antes de usar. */
  value: string;
  use_kg: boolean;
  /** Exclusivo deste módulo (D-S3) — "Pagamento de Equipe". */
  pay_team: boolean;
  /** Exclusivo deste módulo (D-S3) — "Tem comissão". */
  has_commission: boolean;
  /** Exclusivo (D-S3) — "Comissão(%)". STRING decimal da API (ex.: "12.50")
   * — Number(...) antes de usar (mesmo tratamento de `value`). */
  commission: string;
}

// show === index no shape — alias estrutural (mesmo padrão de ReversalExpenseDetail).
export type ServiceExpenseDetail = ServiceExpenseListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ServiceExpensesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ServiceExpensesListEnvelope {
  success: boolean;
  message: string;
  data: ServiceExpenseListItem[];
  errors: Record<string, string[]> | null;
  meta: ServiceExpensesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface ServiceExpensePayload {
  description: string;
  is_enabled: boolean;
  /** Payload SEMPRE número puro. */
  value: number;
  use_kg: boolean;
  pay_team: boolean;
  has_commission: boolean;
  /** Payload SEMPRE número puro (mesmo tratamento de `value`). */
  commission: number;
  // farm_id/type: NUNCA — vem do FarmContext/Global Scope do backend (D1-S/D-S3).
}

// ============================================
// REACT HOOK FORM — `value`/`commission` são NUMBER no form.
// ============================================

export interface ServiceExpenseForm {
  uuid?: string;
  description: string;
  is_enabled: boolean;
  value: number;
  use_kg: boolean;
  pay_team: boolean;
  has_commission: boolean;
  commission: number;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface ServiceExpenseFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Status — Select estático Ativo/Inativo. Sem filtro para os 3 campos
   * exclusivos (contrato §7 não define filtro para eles). */
  is_enabled?: '' | 'true' | 'false';
}
