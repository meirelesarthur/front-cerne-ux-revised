// src/@types/v2/RequestReceipts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Recebimentos" (RequestReceipt — Administrativo /
// Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-00). Fundação de dados —
// nenhuma lógica, só shapes. 4º hub da família `RequestPurchase` na SPA
// (mirror estrutural de `@/@types/v2/RequestPurchases`/`RequestAuthorizations`).
//
// Fonte: `CORE_WORKSPACE/97-Esteiras/040/CONTRATOS/arquitetura-frontend-
// recebimentos.md` §3/§5 (contrato por tela) + `arquitetura-api-recebimentos.md`
// §4 (contrato de endpoints).
//
// Recebimentos é um HUB DE EDIT-FLOWS (sem create/destroy) — não há
// `RequestReceiptForm`/`CreateRequestReceiptRequest` genérico único; cada
// tela de escrita (Confirmar/Financeiro/Finalizar) tem seu próprio par
// Form/Request, granular por endpoint.
//
// FKs/refs reaproveitados de `@/@types/v2/RequestPurchases` (mesmo domínio,
// Resource genuinamente compartilhado — `RequestResponsibleRef`/`FarmRef`/
// `RequestItemRow`) — NÃO duplicados aqui.
//
// `uuid` sempre nas query-keys/paths/payloads — nunca `id` sequencial (Lei do
// client API Cerne).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { FarmRef } from '@/@types/v2/Farms';
import type { RequestItemRow, RequestResponsibleRef } from '@/@types/v2/RequestPurchases';

// ============================================
// LISTAGEM (`GET /request-receipts`, TASK-RCB-FE-01 — LM-01..13)
// ============================================

export interface RequestReceiptListItem {
  uuid: string;
  code: string | null;
  type: string;
  type_label: string;
  status: number;
  status_label: string;
  request_date: string;
  description: string;
  nfe: string | null;
  /** Rótulo de duração pronto ("Hoje"/"N dias"), calculado server-side —
   *  mirror `RequestPurchaseListItem.duration_label`. */
  duration_label: string;
  /** Solicitante (autor da solicitação). */
  user: RequestResponsibleRef;
  /** Responsável atual — opcional/ausente quando ninguém assumiu ainda
   *  (idempotência negativa de `receive`), mesma disciplina defensiva do
   *  resto da família. */
  responsible?: RequestResponsibleRef | null;
  farm: FarmRef;
  /** `GREATEST(movement.created_at, purchase.updated_at)` — calculado
   *  server-side (§3, extensão do Repository de listagem). */
  updated_on: string;
  /** Já tem financeiro gerado (T-081-API-04). "Lançado" na tela = `has_financial`
   *  OU status 9 (legado, LM-12). */
  has_financial: boolean;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface RequestReceiptsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface RequestReceiptsListEnvelope {
  success: boolean;
  message: string;
  data: RequestReceiptListItem[];
  errors: Record<string, string[]> | null;
  meta: RequestReceiptsApiPaginationMeta | null;
}

// ============================================
// FILTRO (FM-01..08, Contrato B)
// ============================================

export interface RequestReceiptFilterForm {
  search?: string;
  status?: number;
  start_date?: string;
  end_date?: string;
  user_uuid?: string;
  user_label?: string;
  farm_uuid?: string;
  farm_label?: string;
  type?: string;
  responsible_uuid?: string;
  responsible_label?: string;
}

export interface RequestReceiptFilterRequest extends RequestReceiptFilterForm {}

/** Colunas ordenáveis da lista (`sort` da API; `direction` asc|desc). */
export type RequestReceiptSort = 'code' | 'request_date' | 'duration' | 'updated_on';

// ============================================
// CONFIRMAR RECEBIMENTO (`GET/PUT /request-receipts/{uuid}`, TASK-RCB-FE-02)
// ============================================

/** `1` = recebimento Total (fecha status→8, libera responsible), `2` =
 *  Parcial (mantém status 7) — BR-01/IG-01, CLM-11/12. */
export type ConfirmReceiptCompletion = 1 | 2;

/** Anexo dinâmico de leitura (Confirmar Recebimento) — só o que já foi
 *  sincronizado nesta confirmação (boundary reuse `SyncRequestPurchase
 *  AttachmentsAction`). */
export interface RequestReceiptAttachmentRow {
  uuid: string;
  name: string;
  file_url: string | null;
}

export interface RequestReceiptData {
  uuid: string;
  code: string | null;
  type: string;
  type_label: string;
  status: number;
  status_label: string;
  request_date: string;
  description: string;
  nfe: string | null;
  receipt_date: string | null;
  /** Data que o Confirmar abre (hoje; T-081-API-05). Só vem neste GET. */
  receipt_date_suggested?: string | null;
  receipt_note: string | null;
  responsible?: RequestResponsibleRef | null;
  /** Fazenda da solicitação (centros de custo do rateio são os dela). */
  farm?: FarmRef | null;
  /** Itens autorizados — mirror `RequestItemRow` (uuid/status/delivery_date
   *  já no shape correto para o subregistro chaveado por uuid, CLM-13). */
  items: RequestItemRow[];
  attachments?: RequestReceiptAttachmentRow[];
  updated_at: string;
}

/** Item do payload de confirmação — CHAVEADO POR UUID (CLM-13 corrigido),
 *  NUNCA por índice/posição. */
export interface ConfirmReceiptItemPayload {
  uuid: string;
  status: 'P' | 'E' | 'C';
  delivery_date: string;
}

/** Anexo do payload de confirmação — `{name, file}`, sem `attachment_uuid`
 *  (contrato de tela §5.3 — anexos novos adicionados nesta confirmação, não
 *  um sync completo de anexos pré-existentes). */
export interface ConfirmReceiptAttachmentPayload {
  name: string;
  file: File;
}

export interface ConfirmReceiptRequest {
  nfe: string;
  purchase_status: ConfirmReceiptCompletion;
  receipt_date: string;
  receipt_note?: string | null;
  items: ConfirmReceiptItemPayload[];
  attachments?: ConfirmReceiptAttachmentPayload[];
}

// FORM (react-hook-form)

export interface ConfirmReceiptItemFormRow {
  uuid: string;
  description: string | null;
  quantity: number | null;
  status: Option<'P' | 'E' | 'C'>;
  delivery_date: string | null;
}

export interface ConfirmReceiptAttachmentFormRow {
  name: string;
  file: File | null;
}

export interface ConfirmReceiptForm {
  code: string | null;
  responsible: string | null;
  receipt_date: string | null;
  nfe: string;
  purchase_status: Option<ConfirmReceiptCompletion> | null;
  receipt_note: string;
  items: ConfirmReceiptItemFormRow[];
  attachments: ConfirmReceiptAttachmentFormRow[];
}

// ============================================
// GERAR FINANCEIRO (`GET/POST /request-receipts/{uuid}/financial`,
// TASK-RCB-FE-03)
// ============================================

export interface RequestReceiptFinancialContext {
  uuid: string;
  code: string | null;
  responsible?: RequestResponsibleRef | null;
  receipt_date: string | null;
  nfe: string | null;
  receipt_note: string | null;
  /** Valor sugerido do título — server-authoritative (`quotation.total_value`
   *  ou `sum(items.amount)`, CLM-17; T-081-API-05). */
  vl_total_suggested: number;
  /** `true` só no tipo D (Diária), o único em que o Valor Total é editável. */
  vl_total_editable?: boolean;
  type: string;
  type_label?: string;
  /** Há congelamento ativo no mês corrente (informativo; a guarda real roda no
   *  POST, por mês de cada parcela, com a mensagem do legado). */
  freeze_active_current_month?: boolean;
  /** Fazenda da solicitação (T-081-API-11); `null` quando indisponível — o rateio
   *  fica sem filtro de fazenda e a API valida no POST. */
  farm?: FarmRef | null;
}

/** Linha do rateio no payload do contrato (`categories[]`). */
export interface RequestReceiptRatioPayload {
  category_uuid: string;
  center_uuid: string;
  plan_account_uuid?: string | null;
  area_uuid?: string | null;
  harvest_uuid?: string | null;
  value: number;
}

/** Payload do POST de Gerar Financeiro — chaves do contrato da API
 *  (EXEC-API-05 §4). Só o tipo D envia `vl_total`. */
export interface GenerateFinancialRequest {
  number: string;
  type_uuid: string;
  proprietary_uuid?: string | null;
  provider_uuid: string;
  fiscal_document: boolean;
  note: string;
  /** Só aceito (e obrigatório) no tipo D; nos demais a API usa o sugerido. */
  vl_total?: number;
  date_installments: string[];
  value_installments: number[];
  categories: RequestReceiptRatioPayload[];
}

// FORM (react-hook-form)

export interface RequestReceiptInstallmentFormRow {
  due_date: string | null;
  value: number | null;
}

export interface RequestReceiptRatioFormRow {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  plan_account_uuid: Option<string> | null;
  value: number | null;
  percent: number | null;
}

export interface GenerateFinancialForm {
  code: string | null;
  responsible: string | null;
  receipt_date: string | null;
  nfe: string | null;
  receipt_note: string | null;
  vl_total: number | null;
  financial_number: string;
  financial_type_id: Option<string> | null;
  financial_proprietary_id: Option<string> | null;
  financial_provider_id: Option<string> | null;
  financial_note: string;
  has_input: Option<0 | 1> | null;
  input_value: number | null;
  input_date: string | null;
  qtd_installments: number | null;
  first_installment: string | null;
  int_installments: number | null;
  fiscal_document: Option<boolean> | null;
  installments: RequestReceiptInstallmentFormRow[];
  ratio: RequestReceiptRatioFormRow[];
}

// ============================================
// FINALIZAR PEDIDO / INFORMAR PAGAMENTO
// (`GET/PUT /request-receipts/{uuid}/inform-payment`, TASK-RCB-FE-04)
// ============================================

export interface RequestReceiptInformPaymentContext {
  uuid: string;
  code: string | null;
  /** Proposto pelo servidor — o front pré-popula, mas o campo permanece
   *  editável (CLM-14/CLM-35). */
  nfe: string | null;
  final_date: string | null;
}

export interface FinalizeReceiptRequest {
  final_date: string;
  status: number;
  nfe: string;
  finalization_note?: string | null;
}

export interface FinalizeReceiptForm {
  code: string | null;
  final_date: string | null;
  status: Option<number> | null;
  nfe: string;
  finalization_note: string;
}

// Reexport de conveniência (mirror `RequestPurchases/index.d.ts`).
export type { Option };
