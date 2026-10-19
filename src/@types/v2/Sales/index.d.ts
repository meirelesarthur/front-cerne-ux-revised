// src/@types/v2/Sales/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Vendas COMERCIAL" (Sale/SaleItem — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-01 — fundação). Mirror
// estrutural de `@/@types/v2/Orders` (irmão comercial migrado), cruzado com
// leitura DIRETA de `CONTRATOS/CONTRATO-API-SALE-COMERCIAL.md` (§3, gate
// FID-G1) e `CONTRATOS/CONTRATO-TELA-VENDAS-COMERCIAL-FE.md` (§3/§4/§6/§7).
//
// NÃO é Venda de Animais (`MovementSale`) nem Contrato de Venda
// (`saleContracts`) — model alvo exclusivo é `Sale` (`sales`/`sale_items`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /sales                          → data: SaleListItem[], meta paginação
//   GET    /sales/{uuid}                   → data: SaleDetail
//   POST   /sales                          → payload CreateSaleRequest → data: SaleDetail
//   PUT    /sales/{uuid}                   → payload UpdateSaleRequest (sync de
//                                             itens por `items[].uuid`) → data: SaleDetail
//   DELETE /sales/{uuid}                   → soft delete (guardas fail-closed:
//                                             NFe vinculada / Income vinculado)
//
// `farm_id`/`tenant_id`/`user_id`/`code`/`status`/`order_id`/
// `installment_details`/`subtotal`/`discount`(agregado)/`total` NUNCA são
// campos de input — sempre resolvidos/recalculados no servidor
// (contrato-api §3.1, CV002-CV004).
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS (backed — mirror `App\Enums\SaleStatus` do backend)
// ============================================

/** `AguardandoEmissaoNfe=1`, `Fechado=2`, `Cancelado=9`
 *  (contrato-api-sale-comercial.md §0/§3) — os 3 valores fechados, preservados. */
export type SaleStatus = 1 | 2 | 9;

/** Catálogo SEFAZ (`App\Enums\BudgetPaymentMethod`, REUSADO — mirror
 *  `OrderPaymentMethod`/`BudgetPaymentMethod`), 15 chaves string fechadas.
 *  Tipo próprio aqui (não reimportado de Orders/Budgets) para manter os
 *  módulos independentes, mesmo catálogo de valores. */
export type SalePaymentMethod =
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
// REFS ANINHADAS / RESOURCE (shape 1:1 com SaleListResource/SaleDetailResource
// — contrato-api-sale-comercial.md §3.3)
// ============================================

export interface SaleStatusRef {
  value: SaleStatus;
  label: string;
  color: string;
}

export interface SaleClientRef {
  uuid: string;
  info: string;
}

export interface SaleUserRef {
  uuid: string;
  name: string | null;
}

export interface SaleNfeRef {
  uuid: string;
  numero_nfe: string;
}

export interface SaleProductRef {
  uuid: string;
  description: string;
  /** Só leitura — populada pela cascata produto→unidade no form
   *  (`SaleItemRow`, SALE-FE-COM-04). Nunca editável, nunca submetida. */
  measurement: string | null;
}

export interface SaleWarehouseRef {
  uuid: string;
  name: string;
}

export interface SaleTransporterRef {
  uuid: string;
  name: string | null;
}

export interface SaleProprietaryRef {
  uuid: string;
  name: string | null;
}

/** Origem opcional pela borda Pedido→Venda (`CreateSaleFromOrderAction`, API
 *  já em produção) — gancho display-only (mirror `OrderDetail.budget`),
 *  ONDA 2 (`SALE-FE-COM-10`, PARADA-5) para o fluxo de criação; a leitura já
 *  nasce aqui para o detalhe (SALE-FE-COM-05) nunca perder o campo. */
export interface SaleOrderRef {
  uuid: string;
  code: string;
}

/** Linha de item — leitura (`SaleItemResource`, contrato-api §0, reusado). */
export interface SaleItemData {
  uuid: string;
  product: SaleProductRef;
  warehouse: SaleWarehouseRef | null;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  note: string | null;
}

/** Resposta de `GET /sales` (índice) — granularidade de grid, os 4 flags
 *  reproduzem as ações condicionais da listagem legada (C002/C008) — a SPA
 *  NUNCA recalcula essas regras no cliente. */
export interface SaleListItem {
  uuid: string;
  code: string;
  dt_sale: string;
  dt_shipping: string;
  client: SaleClientRef;
  user: SaleUserRef;
  total: number;
  status: SaleStatusRef;
  nfe: SaleNfeRef | null;
  has_income: boolean;
  can_advance_income: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

/** `SaleDetailResource` (EXISTENTE, reusado — show/store/update, round-trip
 *  garantido). `installment_details` é opaco/JSON, só herdado do modo
 *  `from_order` (ONDA 2) — nunca campo de input no modo avulso desta onda. */
export interface SaleDetail {
  uuid: string;
  code: string;
  dt_sale: string;
  dt_shipping: string;
  due_date: string | null;
  status: SaleStatusRef;
  order: SaleOrderRef | null;
  client: SaleClientRef;
  user: SaleUserRef;
  subtotal: number;
  discount: number;
  total: number;
  icms: number;
  freight: number;
  other_values: number;
  payment_method: { value: SalePaymentMethod; label: string } | null;
  note: string | null;
  driver: string | null;
  transporter: SaleTransporterRef | null;
  proprietary: SaleProprietaryRef | null;
  nfe: SaleNfeRef | null;
  installment_details: Record<string, unknown> | null;
  items: SaleItemData[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /sales)
// ============================================

export interface SalesApiPaginationMeta {
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

export interface SalesListEnvelope {
  success: boolean;
  message: string;
  data: SaleListItem[];
  errors: Record<string, string[]> | null;
  meta: SalesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, SALE-FE-COM-02, `FilterSideSale`, Contrato B)
// ============================================

export interface SaleFilterForm {
  search?: string;
  product?: Option<string> | null;
  client?: Option<string> | null;
  start_date?: Date | null;
  end_date?: Date | null;
  /** Registros por página (10/30/50/80/100/200, default 10) — espelha
   *  `paginatedQuery.pageSize`, não é enviado como querystring própria
   *  (mirror `OrderFilterForm.pagination_quantity`). */
  pagination_quantity?: Option<number> | null;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO/EDIÇÃO (SALE-FE-COM-03/04).
// `Option<T>` nos selects; `items[].uuid` por linha controla o diff
// (presente = atualizar; ausente = criar; não enviado = remover — substitui
// `olds[]` do legado, mirror `§6.1` do contrato de tela).
// ============================================

export interface SaleItemForm {
  /** Presente (edição) = `sale_item.uuid` original. Ausência = criar; item
   *  existente ausente do array enviado é removido pelo servidor. */
  uuid?: string;
  warehouse: Option<string> | null;
  product: Option<string> | null;
  /** Só leitura — `listStockAvailability(warehouse,product).quantity`,
   *  nunca submetido (SALE-FE-COM-04, IG002/007). */
  qtd_stock: number | null;
  /** Só leitura, populada pela cascata produto/estoque. Não submetido. */
  um: string;
  quantity: number | string;
  price: number | string;
  discount: number | null;
  /** Só leitura, calculado — UI puro, nunca submetido (IG005/006). */
  discount_percent: number | null;
  total_amount: number;
  note: string | null;
}

export interface SaleForm {
  dt_sale: string;
  dt_shipping: string;
  due_date: string | null;
  client: Option<string> | null;
  payment_method: Option<SalePaymentMethod> | null;
  transporter: Option<string> | null;
  proprietary: Option<string> | null;
  /** `maxLength=250` (coluna física — contrato-api §4/D010), não 40. */
  driver: string | null;
  /** `maxLength=200`, 4 linhas (contrato-tela §6.2). */
  note: string | null;
  icms: number | null;
  freight: number | null;
  other_values: number | null;
  items: SaleItemForm[];
}

// ============================================
// REQUEST TYPES (mirror EXATO de `SaleData`/`SaleItemData` reais —
// contrato-api-sale-comercial.md §3.1). `farm_id`/`tenant_id`/`user_id`/
// `code`/`status`/`order_id`/`installment_details`/`subtotal`/`discount`
// (agregado)/`total` NUNCA aparecem como input.
// ============================================

export interface SaleItemPayload {
  /** Presente = atualiza este item; ausente = cria. Item existente ausente
   *  do array enviado é removido (substitui `olds[]` do legado, SE003). */
  uuid?: string;
  product_uuid: string;
  warehouse_uuid?: string | null;
  quantity: number;
  price: number;
  discount?: number | null;
  note?: string | null;
}

/**
 * `POST`/`PUT` `/sales/{uuid}`. `client_uuid` obrigatório no modo avulso
 * (único modo desta onda — `from_order` é ONDA 2, PARADA-5). `subtotal`/
 * `discount`/`total` NUNCA são campos de input — sempre recalculados no
 * servidor (CV002-CV004).
 */
export interface CreateSaleRequest {
  dt_sale: string;
  dt_shipping: string;
  due_date?: string | null;
  client_uuid: string;
  payment_method: SalePaymentMethod;
  note?: string | null;
  driver?: string | null;
  transporter_uuid?: string | null;
  proprietary_uuid?: string | null;
  icms?: number | null;
  freight?: number | null;
  other_values?: number | null;
  items: SaleItemPayload[];
}

export interface UpdateSaleRequest extends CreateSaleRequest {}

// ============================================
// HANDOFF FISCAL (`GET /sales/{uuid}/nfe-draft`, A6, SE007,
// SALE-FE-COM-06) — mirror EXATO de `BuildSaleNfeDraftAction::handle()`
// (backend, array puro, sem sessão). NÃO existe `POST /sales/{uuid}/
// nfe-emit` (GAP-043-SALE-FE-COM-02, `[RESOLVIDO]`: modelo de HANDOFF) — o
// draft só alimenta o pré-preenchimento de `CreateOrUpdateNfe.tsx` via
// `location.state.saleHandoff`; o vínculo `sale.nfe_id` fica em
// follow-up (`FU-043-SALE-NFE-LINK`), fora do caminho crítico desta Tarefa.
// ============================================

export interface SaleNfeDraftItem {
  product: {
    uuid: string;
    description: string;
    measurement: { uuid: string; name: string } | null;
  } | null;
  quantity: number;
  amount: number;
  total: number;
  discount: number;
  note: string | null;
  warehouse: { uuid: string; name: string } | null;
  package: null;
  area: null;
}

export interface SaleNfeDraftInstallment {
  date_installment: string | null;
  value_installment: number | null;
}

export interface SaleNfeDraft {
  model: 'sales';
  sale: { uuid: string; code: string };
  client: SaleClientRef | null;
  total_products: number;
  amount: number;
  discount: number;
  freight: number;
  icms: number;
  other_values: number;
  block_financial: boolean;
  type_payment: SalePaymentMethod | null;
  items: SaleNfeDraftItem[];
  /** Só presente quando `sale.installment_details` existir (parcelamento
   *  copiado do modo `from_order`, ONDA 2). */
  has_input?: boolean;
  input_date?: string | null;
  input_value?: number | null;
  qtd_installments?: number;
  installment_interval?: number;
  fiscal_document?: boolean;
  installments?: SaleNfeDraftInstallment[];
  first_installment?: string | null;
}

// ============================================
// ADIANTAMENTO (`GET`/`POST /sales/{uuid}/advance-income`, A8/A9, SE010-012,
// SALE-FE-COM-07/08) — `GAP-043-SALE-FE-COM-03` `[RESOLVIDO]`:
// `SaleAdvanceIncomeDraft` mirror EXATO de `BuildAdvanceIncomeDraftAction`
// (backend só devolve saldo/pré-preenchimento — catálogos SEMPRE pelos
// endpoints de options já migrados, nunca duplicados aqui).
// ============================================

export interface SaleAdvanceIncomeDraft {
  sale: {
    uuid: string;
    code: string;
    total: number;
    client: SaleClientRef | null;
  };
}

/** Linha de rateio (`categories[]`) — mirror `SaleAdvanceIncomeCategoryData`
 *  (backend). `percentage` NUNCA enviado pela SPA (CV007, UI puro) — o
 *  backend aceita `value` OU `percentage`; esta Tarefa sempre envia `value`. */
export interface SaleAdvanceIncomeCategoryPayload {
  category_uuid: string;
  center_uuid: string;
  plan_account_uuid?: string | null;
  value: number;
}

/** `POST /sales/{uuid}/advance-income` — mirror `SaleAdvanceIncomeData`/
 *  `SaleAdvanceIncomeRequest` (backend). `client_uuid`/`farm_id`/`code`/
 *  `balance`/`installment`/`qtd_installments`/`incomeable_*` NUNCA no
 *  payload — o cliente é sempre o da própria Venda (resolvido no servidor). */
export interface SaleAdvanceIncomePayload {
  number: string;
  type_title_uuid: string;
  payment_type: 4;
  proprietary_uuid?: string | null;
  dt_emission: string;
  due_date: string;
  amount: number;
  note: string;
  fiscal_document: boolean;
  discount?: number;
  penalty?: number;
  interest?: number;
  perc_interest?: number;
  increase?: number;
  categories: SaleAdvanceIncomeCategoryPayload[];
}

/** Resposta de `A9` — mirror `SaleAdvanceIncomeResource` (backend).
 *  `income` reusa o MESMO shape de `IncomeResource` (Contas a Receber, já
 *  migrado) — nenhum tipo duplicado aqui, só o subconjunto consumido pela
 *  navegação pós-criação. */
export interface SaleAdvanceIncomeResult {
  income: { uuid: string; code: string; number: string };
  sale: { uuid: string; code: string } | null;
  writeoff_hint: string;
}

// ============================================
// REACT HOOK FORM — Adiantamento (`SaleAdvanceIncome.tsx`/
// `SaleAdvanceIncomeAllocation.tsx`, SALE-FE-COM-07/08).
// ============================================

export interface SaleAdvanceIncomeAllocationRowForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  /** OPCIONAL — autofill por cascata da categoria, sobrescrevível
   *  (contrato-tela, cascata `IG017`). */
  plan_account_uuid: Option<string> | null;
  value: number | null;
}

// ============================================
// "GERAR VENDA A PARTIR DO PEDIDO" (SALE-FE-COM-10, borda Order→Sale já em
// produção desde a execução 043, `CreateSaleFromOrderAction`/
// `DraftSaleFromOrderAction`). Mirror 1:1 de `SaleDraftResource`/
// `SaleFromOrderRequest` (backend) — roteiro `pedidos-f051-roteiro.md §2`.
// NÃO reaproveita `CreateSaleRequest` (exige `client_uuid`, PROIBIDO aqui —
// o cliente é sempre herdado do `Order`, resolvido no servidor).
// ============================================

/** Sub-recurso `order` do envelope de `GET /orders/{uuid}/sale-draft` — status
 *  é o `OrderStatus` (1/2/3/9), NÃO o `SaleStatus`; tipo próprio aqui (mirror
 *  `SaleStatusRef`) para não acoplar este módulo a `@/@types/v2/Orders`. */
export interface SaleDraftOrderStatusRef {
  value: number;
  label: string;
  color: string;
}

export interface SaleDraftOrderRef {
  uuid: string;
  code: string;
  status: SaleDraftOrderStatusRef;
  client: SaleClientRef;
  /** Herdado tal como persistido no Pedido — nunca reconstruído/editado
   *  nesta tela (contrato-api §2, "installment_details herdado"). */
  installment_details: Record<string, unknown> | null;
}

/** Catálogo de formas de pagamento aceitas para ESTA venda (`payment_methods`
 *  do `SaleDraftResource`) — a tela usa esta lista, NÃO o catálogo genérico
 *  `salePaymentMethodOptions`, para não oferecer uma opção que o servidor
 *  rejeitaria. */
export interface SaleDraftPaymentMethodOption {
  value: SalePaymentMethod;
  label: string;
}

/** Linha de item do draft — `remaining_quantity = ordered_quantity −
 *  Σ vendido` (exclui Sales canceladas, já calculado pelo servidor). Usada
 *  para capar `quantity` editável por linha (roteiro §2) — o servidor
 *  permanece a autoridade final (defesa em profundidade, não substitui a
 *  validação de negócio do `CreateSaleFromOrderAction`). */
export interface SaleDraftItem {
  product: SaleProductRef;
  ordered_quantity: number;
  remaining_quantity: number;
}

/** `GET /orders/{uuid}/sale-draft` — hidratação da tela `GerarVendaFromOrder`
 *  (mirror `SaleDraftResource`). */
export interface SaleDraft {
  order: SaleDraftOrderRef;
  payment_methods: SaleDraftPaymentMethodOption[];
  items: SaleDraftItem[];
}

/** Linha de item do RHF da tela — FECHADA (sem `append`/`remove`, mirror
 *  `SaleItemForm` mas sem `uuid` — toda linha aqui é sempre NOVA, a venda
 *  ainda não existe). `product`/`um`/`ordered_quantity`/`remaining_quantity`
 *  são readonly (hidratados do `SaleDraftItem`, nunca editados pelo
 *  usuário); `warehouse`/`quantity`/`price`/`discount`/`note` são os ÚNICOS
 *  campos editáveis por linha (roteiro §5). */
export interface SaleFromOrderItemForm {
  product: Option<string>;
  um: string;
  ordered_quantity: number;
  remaining_quantity: number;
  warehouse: Option<string> | null;
  quantity: number | string;
  price: number | string;
  discount: number | null;
  note: string | null;
}

/** Formulário RHF de `GerarVendaFromOrder.tsx` — mirror `SaleForm` sem
 *  `client` (herdado do `Order`, nunca campo de input, roteiro §2/§3). */
export interface SaleFromOrderForm {
  dt_sale: string;
  dt_shipping: string;
  due_date: string | null;
  payment_method: Option<SalePaymentMethod> | null;
  transporter: Option<string> | null;
  proprietary: Option<string> | null;
  driver: string | null;
  note: string | null;
  icms: number | null;
  freight: number | null;
  other_values: number | null;
  items: SaleFromOrderItemForm[];
}

/** Linha de item de `POST /orders/{uuid}/sales` — mirror EXATO de
 *  `SaleItemData` no modo `from_order` (sem `uuid`, toda linha é criação). */
export interface CreateSaleFromOrderItemPayload {
  product_uuid: string;
  warehouse_uuid?: string | null;
  quantity: number;
  price: number;
  discount?: number | null;
  note?: string | null;
}

/**
 * `POST /orders/{uuid}/sales` (`SaleFromOrderRequest`, roteiro §2). NUNCA
 * enviar `client_id`/`order_id`/`farm_id`/`status`/`code` — o servidor
 * resolve tudo do `Order` e do contexto (`client_id` herdado,
 * `installment_details` herdado).
 */
export interface CreateSaleFromOrderRequest {
  dt_sale: string;
  dt_shipping: string;
  due_date?: string | null;
  payment_method: SalePaymentMethod;
  note?: string | null;
  driver?: string | null;
  transporter_uuid?: string | null;
  proprietary_uuid?: string | null;
  icms?: number | null;
  freight?: number | null;
  other_values?: number | null;
  items: CreateSaleFromOrderItemPayload[];
}

export interface SaleAdvanceIncomeForm {
  number: string;
  type_title_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  /** Fixo readonly (=4, `PaymentType::Adiantamento`) — nunca editável. */
  payment_type: 4;
  /** Fixos readonly (=1) — preservados no form só para exibição (o
   *  servidor sempre grava 1, nunca lidos do payload). */
  installment: 1;
  qtd_installments: 1;
  amount: number | null;
  dt_emission: string;
  due_date: string;
  note: string;
  fiscal_document: Option<boolean> | null;
  discount: number | null;
  penalty: number | null;
  interest: number | null;
  perc_interest: number | null;
  increase: number | null;
  allocations: SaleAdvanceIncomeAllocationRowForm[];
}
