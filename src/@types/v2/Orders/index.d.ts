// src/@types/v2/Orders/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Pedidos" (Order/OrderItem — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-01 — fundação). Mirror estrutural de
// `@/@types/v2/Budgets` (módulo análogo direto: itens + parcelas + selects
// cliente/produto, submit atômico), cruzado com leitura DIRETA de
// `CONTRATOS/contrato-api-pedidos.md` (§2/§3, CONTRATO_AUTOAPROVADO) e
// `CONTRATOS/CONTRATO-TELA-PEDIDOS-F051.md` (§3/§4, FID-G3F).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /orders                    → data: OrderListItem[], meta paginação
//   GET  /orders/next-code          → data: { code: string }
//   GET  /orders/{uuid}             → data: OrderDetail (itens+parcelas)
//   POST /orders                    → payload CreateOrderRequest →
//                                      data: OrderDetail
//   PUT/PATCH /orders/{uuid}        → payload UpdateOrderRequest (diff
//                                      `olds[]` por linha de item)
//   DELETE /orders/{uuid}           → 204, sem body (cascade em order_items)
//   GET  /orders/{uuid}/report      → Blob (PDF, inline síncrono)
//
// DEC-PED-FE-ITENS (contrato de tela §6): itens/parcelas usam `useFieldArray`
// (RHF, em memória) serializados no ÚNICO payload atômico do store/update —
// NÃO Model C.4 (temp-store + bulkCreate). `olds[]` por linha de item
// substitui o diff nativo por uuid usado em Budgets (a API de Pedidos é a
// fonte — mirror exato do `OrderItemData`/`OrderRequest` reais, §3/§6 do
// contrato-api).
//
// `farm_id`/`user_id`/`tenant_id`/`status`(no create) NAO_APLICAVEL como
// input — resolvidos no servidor (contexto autenticado + `X-Farm-Id`),
// NUNCA no payload (contrato-api §6, invariante de tenant).
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS (backed — mirror `OrderStatus`/`OrderPaymentMethod` do backend)
// ============================================

/** `EmAberto=1`, `EmProcessamento=2`, `Finalizado=3`, `Cancelado=9`
 *  (contrato-api-pedidos.md §6) — os 4 valores fechados, preservados. */
export type OrderStatus = 1 | 2 | 3 | 9;

/** Catálogo SEFAZ (`App\Enums\BudgetPaymentMethod`, REUSADO — decisão menor
 *  do contrato-api §7 "forma de pagamento: default reusar
 *  `App\Enums\BudgetPaymentMethod`"), 14 chaves string fechadas — idêntico a
 *  `BudgetPaymentMethod` de `@/@types/v2/Budgets`. Tipo próprio aqui (não
 *  reimportado de Budgets) para manter os módulos independentes, mesmo
 *  catálogo de valores. */
export type OrderPaymentMethod =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '90'
  | '99';

// ============================================
// REFS ANINHADAS / RESOURCE (shape 1:1 com OrderResource/OrderDetailResource
// — contrato-api-pedidos.md §3)
// ============================================

export interface OrderStatusRef {
  value: OrderStatus;
  label: string;
  color: string;
}

export interface OrderClientRef {
  uuid: string;
  info: string;
}

export interface OrderUserRef {
  uuid: string;
  name: string | null;
}

export interface OrderProductRef {
  uuid: string;
  description: string;
  /** Só leitura — populada pela cascata produto→unidade no form
   *  (`OrderItemRow`, PED-FE-04). Nunca editável, nunca submetida. */
  measurement: string | null;
}

export interface OrderItemData {
  uuid: string;
  product: OrderProductRef;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface OrderInstallmentEntry {
  date_installment: string;
  value_installment: number;
}

/** `installment_details` (JSON persistido) — cronograma editável +
 *  metadados de entrada (CV-012/013/014, contrato-tela §6.2). */
export interface OrderInstallmentDetails {
  has_input: boolean;
  input_date: string | null;
  input_value: number | null;
  qtt_installments: number | null;
  first_installment: string | null;
  installment_interval: number | null;
  fiscal_document: boolean;
  installments: OrderInstallmentEntry[];
}

/** Resposta de `GET /orders` (índice) — LM-001..LM-010, granularidade de
 *  grid (mirror `BudgetListItem` quanto à omissão de itens/parcelas). */
export interface OrderListItem {
  uuid: string;
  code: string;
  date: string;
  status: OrderStatusRef;
  client: OrderClientRef;
  user: OrderUserRef;
  total: number;
  created_at: string;
}

/** `OrderDetailResource` (show/store/update — hidratação/round-trip,
 *  contrato-api-pedidos.md §3.2). */
export interface OrderDetail {
  uuid: string;
  code: string;
  date: string;
  status: OrderStatusRef;
  client: OrderClientRef;
  user: OrderUserRef;
  /** Presente só quando o Pedido nasceu de um Orçamento aprovado
   *  (PED-04, Budget→Order) — gancho display-only em `OrderDetalhe`
   *  (PED-FE-06). Nunca editável. */
  budget: { uuid: string } | null;
  subtotal: number;
  freight: number;
  discount: number;
  total: number;
  /** Fluxo manual grava `0.00` (paridade legada) — mantido no shape. */
  amount: number;
  note: string | null;
  payment_method: { value: OrderPaymentMethod; label: string } | null;
  installments: number;
  interval: number;
  due_date: string;
  installment_details: OrderInstallmentDetails | null;
  items: OrderItemData[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /orders)
// ============================================

export interface OrdersApiPaginationMeta {
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

export interface OrdersListEnvelope {
  success: boolean;
  message: string;
  data: OrderListItem[];
  errors: Record<string, string[]> | null;
  meta: OrdersApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, PED-FE-02, `FilterSideOrder`, Contrato B) +
// querystring real (`OrderFilterData`, contrato-api §3.3)
// ============================================

export interface OrderFilterForm {
  search?: string;
  product?: Option<string> | null;
  client?: Option<string> | null;
  start_date?: Date | null;
  end_date?: Date | null;
  /** FLT-006 (contrato-tela §7.4) — registros por página (10/30/50/80/100/
   *  200, default 10). Espelha o mesmo estado de `paginatedQuery.pageSize`
   *  (PED-FE-02, `Operacional/Pedidos/index.tsx`) — não é enviado como
   *  querystring própria, só sincroniza o `per_page` real da grid. */
  pagination_quantity?: Option<number> | null;
}

/** Querystring real de `GET /orders` (`OrderFilterData` — contrato-api §3.3;
 *  `product` = GAP-API-FE-03, a confirmar). */
export interface OrderFilterRequest {
  search?: string;
  product?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  pagination_quantity?: number;
  page?: number;
  per_page?: number;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO/EDIÇÃO (PED-FE-03/04/05).
// `Option<T>` nos selects; `olds[]` por linha para diff (mirror `§6` do
// contrato de tela). Registrado já na fundação para as Tarefas seguintes
// consumirem sem redefinir o shape.
// ============================================

export interface OrderItemForm {
  /** Presente (edição) = `order_item.uuid` original, controla o diff
   *  manter/atualizar/criar/remover via `olds[]` no submit (PED-FE-03/04). */
  olds?: string;
  product: Option<string> | null;
  /** Só leitura, populada pela cascata produto→unidade. Não submetido. */
  um: string;
  quantity: number | string;
  price: number | string;
  discount: number | null;
  /** Só leitura, calculado — não submetido diretamente (`discount_percent`,
   *  IG-004/005). */
  discount_percent: number | null;
  total_amount: number;
}

export interface OrderInstallmentEntryForm {
  date: string;
  value: number;
}

export interface OrderInstallmentDetailsForm {
  has_input: boolean;
  input_date: string | null;
  input_value: number | null;
  qtt_installments: number | null;
  first_installment: string | null;
  installment_interval: number | null;
  fiscal_document: boolean;
  installments: OrderInstallmentEntryForm[];
}

export interface OrderForm {
  code: string;
  date: string;
  client: Option<string> | null;
  freight: number | null;
  discount: number | null;
  note: string | null;
  payment_method: Option<OrderPaymentMethod> | null;
  installments: number | string;
  interval: number | string;
  due_date: string;
  items: OrderItemForm[];
  installment_details: OrderInstallmentDetailsForm | null;
}

// ============================================
// REQUEST TYPES (mirror EXATO de `OrderRequest`/`OrderData`/`OrderItemData`
// reais — contrato-api-pedidos.md §3.3). `code`/`status`(create)/`subtotal`/
// `total` NUNCA aparecem como input — sempre gerados/recalculados no
// servidor (CV-001/CV-009/010/011).
// ============================================

export interface OrderItemPayload {
  /** Presente = atualiza; ausente = cria. Item existente ausente do array
   *  enviado é removido pelo servidor (diff `olds[]`, mirror `§6` da tela). */
  olds?: string;
  product_uuid: string;
  quantity: number;
  price: number;
  discount?: number | null;
}

export interface OrderInstallmentEntryPayload {
  date_installment: string;
  value_installment: number;
}

export interface OrderInstallmentDetailsPayload {
  has_input: boolean;
  input_date?: string | null;
  input_value?: number | null;
  qtt_installments: number;
  first_installment: string;
  installment_interval: number;
  fiscal_document: boolean;
  installments: OrderInstallmentEntryPayload[];
}

/**
 * `POST`/`PUT`/`PATCH /orders/{uuid}`. `code` NUNCA aparece aqui — gerado no
 * servidor (`GET /orders/next-code`, CV-001). `subtotal`/`total`/`amount`
 * também NUNCA são campos de input — sempre recalculados no servidor
 * (CV-009/010/011).
 */
export interface CreateOrderRequest {
  date: string;
  client_uuid: string;
  freight: number;
  discount?: number | null;
  note?: string | null;
  budget_uuid?: string | null;
  payment_method: OrderPaymentMethod;
  installments: number;
  interval: number;
  due_date: string;
  items: OrderItemPayload[];
  installment_details?: OrderInstallmentDetailsPayload | null;
}

export interface UpdateOrderRequest extends CreateOrderRequest {}
