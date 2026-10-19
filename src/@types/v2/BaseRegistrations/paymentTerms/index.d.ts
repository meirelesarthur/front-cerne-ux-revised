// src/@types/v2/BaseRegistrations/paymentTerms/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CONDIÇÃO DE PAGAMENTO (PaymentTerm) — API v1 do backend
// Laravel GB.Cerne. Mirror de @types/v2/TypeTitles, COM UMA DIFERENÇA CENTRAL:
// `type` aqui é SLUG STRING ('compra'|'venda'|'ambos'), NÃO enum int — o
// Select do formulário envia o valor DIRETO ao payload, sem Number(...).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }),
// confirmado por leitura direta de PaymentTermController/Resource/Request
// (api_root), PaymentTerm-contrato.md v1.0 §12/§13:
//   GET    /payment-terms          → data: PaymentTermListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total).
//   GET    /payment-terms/{uuid}   → data: PaymentTermDetail (mesmo shape flat).
//   POST   /payment-terms          → payload PaymentTermPayload (create).
//   PUT    /payment-terms/{uuid}   → payload PaymentTermPayload — SEMPRE os 5
//                                     campos (description/condition/type/
//                                     is_enabled/out_day), nunca delta
//                                     (PaymentTermRequest::rules() não
//                                     distingue verbo — full-resource-replace).
//   DELETE /payment-terms/{uuid}   → 204; 422 estruturado (BusinessRuleException)
//                                     se em uso em invoices/transfers — mensagem
//                                     real "Condição de Pagamento está em uso e
//                                     não pode ser excluída."
//
// `type` é o Enum PaymentTermType (backend) exposto/aceito como SLUG STRING
// ('compra'|'venda'|'ambos') — DIFERENTE de TypeTitle.type/.factor (que são
// ENUM INT). `type_label` vem PRONTO do Resource — não recriar o mapeamento
// Compra/Venda/Ambos no client.
//
// `out_day`: boolean migrado como está (D3 do contrato backend) — sem
// semântica de negócio conhecida além da exibição.
//
// `PaymentTerm` é tenant-scoped com fallback global (D1 do contrato backend,
// clone de OperationTenantScope) — o interceptor axios global já anexa
// X-Farm-Id automaticamente quando há fazenda ativa, nenhuma ação extra aqui.
// -----------------------------------------------------------------------------

// ============================================
// PAYMENT TERM (resposta da API)
// ============================================

export type PaymentTermTypeSlug = 'compra' | 'venda' | 'ambos';

export interface PaymentTermListItem {
  uuid: string;
  description: string;
  /** Lista de dias separada por vírgula, ex. "10,20,30". Fiel ao legado. */
  condition: string;
  type: PaymentTermTypeSlug;
  /** Rótulo pronto do Resource — "Compra" | "Venda" | "Ambos". */
  type_label: string;
  is_enabled: boolean;
  /** Migrado como está (D3) — sem semântica de negócio conhecida além da exibição. */
  out_day: boolean;
}

// GET /payment-terms/{uuid} devolve o mesmo Resource, sem campos extras só-de-detalhe.
export type PaymentTermDetail = PaymentTermListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface PaymentTermsListEnvelope {
  success: boolean;
  message: string;
  data: PaymentTermListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface PaymentTermPayload {
  description: string;
  condition: string;
  type: PaymentTermTypeSlug;
  is_enabled: boolean;
  out_day: boolean;
}

// ============================================
// REACT HOOK FORM
// ============================================
// `type` guarda a SLUG diretamente (string) — sem estado intermediário
// numérico (diferente de TypeTitleForm.type/factor, que guardam '1'|'2'|'3'
// e convertem para Number(...) só no payload).

export interface PaymentTermForm {
  uuid?: string;
  description: string;
  condition: string;
  type: PaymentTermTypeSlug | '';
  is_enabled: boolean;
  out_day: boolean;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface PaymentTermFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Tipo — Select estático Compra(compra)/Venda(venda)/Ambos(ambos). */
  type?: PaymentTermTypeSlug;
  /** Status — Select estático Ativo/Inativo. */
  is_enabled?: 'true' | 'false';
}
