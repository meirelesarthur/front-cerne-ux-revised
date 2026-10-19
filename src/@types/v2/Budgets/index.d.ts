// src/@types/v2/Budgets/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Orçamentos" (Budget/BudgetItem/BudgetPayment — Operacional
// / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-01 — fundação). Mirror
// estrutural de `@/@types/v2/Requisitions`/`@/@types/v2/RequestQuotations`
// cruzado com leitura DIRETA de `budgets-api-contract.md` (`§3`/`§4`, contrato
// reconciliado ✅ APROVADO) e `budgets-frontend-contract.md` (`§4`, FID-G3F).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /budgets                     → data: BudgetListItem[], meta paginação
//   GET  /budgets/next-code           → data: { code: string }
//   GET  /budgets/{uuid}              → data: BudgetData (itens+pagamentos)
//   POST /budgets                     → payload CreateOrUpdateBudgetPayload →
//                                        data: BudgetData
//   PUT/PATCH /budgets/{uuid}         → idem (diff itens/pagamentos por uuid)
//   DELETE /budgets/{uuid}            → 204, sem body (soft delete)
//   GET  /budgets/{uuid}/report       → Blob (PDF)
//   GET  /budgets/{uuid}/whatsapp     → data: { link: string, ... } (TASK-BG-FE-05)
//   POST /budgets/{uuid}/email        → sem payload, sem corpo relevante
//   GET  /public/budgets/{hash}       → data: PublicBudgetData (rota pública,
//                                        SEM X-Farm-Id/Sanctum)
//   PUT  /public/budgets/{hash}       → payload PublicBudgetAnswerPayload
//
// NAO_APLICAVEL como input (D12, `budgets-api-contract.md §2.3`, preservado
// fielmente): `discount_percent`/`installment_value` (nunca lidos pelo
// servidor legado, fora do contrato de API) — NENHUM tipo de payload abaixo
// os contém. `um`/`unit` do item é OUTPUT apenas (`BudgetItemData.product.unit`
// readonly) — nunca aparece em `BudgetItemForm`/`BudgetItemPayload`.
// `user_id`/`farm_id`/`tenant_id` também NAO_APLICAVEL como input — resolvidos
// no servidor via `auth()`/`X-Farm-Id`, nunca no payload.
//
// Diff de `items[]`/`payments[]` por `uuid` (substitui `olds[]`/`old_payments[]`
// do legado, `§4.5`/`§2.3` do contrato de tela): cada linha carrega `uuid?`
// — ausente = linha nova; presente = atualiza; uuid existente ausente da
// lista enviada = removida no servidor.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS / RESOURCE (shape 1:1 com BudgetResource/BudgetItemResource/
// BudgetPaymentResource — `budgets-api-contract.md §4`)
// ============================================

export interface BudgetClientRef {
  uuid: string;
  /** GAP-BG-FE-07 (TASK-BG-FE-02, achado por leitura direta de
   *  `BudgetListResource`/`BudgetDetailResource` reais — não existe
   *  `info` formatado "nome — nif" no backend, só `{uuid, name}`).
   *  A pendência declarada em `budgets-frontend-contract.md §7` previa
   *  confirmar o shape antes de codar a coluna Cliente — confirmado: o
   *  Resource real expõe `name` isolado, NUNCA o composto com NIF.
   *  Corrigido aqui (era `info: string`) para refletir a API real; sem
   *  fabricar o formato composto que o backend não implementa.
   *
   *  GAP-BG-07 (revalidação 2026-08-25, `EVIDENCIAS/GAP-BG-07-revalidacao-
   *  run.md`, ✅ CONCLUÍDO): o backend foi ENRIQUECIDO — `BudgetListResource`/
   *  `BudgetDetailResource` reais agora expõem `nif` (`client.people?->nif`,
   *  fiel ao LM-04 legado `people.name.' - '.people.nif`) ao lado de `name`.
   *  `name`/`nif` tipados nullable — mirror do operador null-safe real do
   *  backend (`client.people?->name`/`?->nif`), nunca assumindo Person
   *  sempre presente. */
  name: string | null;
  nif: string | null;
}

export interface BudgetProductRef {
  uuid: string;
  description: string;
  /** Só leitura (`um[]` do legado, D11/CB-36 — nunca lido pelo servidor como
   *  input). Populada pelo `handleProductChange` no form, nunca editável. */
  unit?: string;
}

export interface BudgetItemData {
  uuid: string;
  product: BudgetProductRef;
  quantity: number;
  amount: number;
  discount: number | null;
  total: number;
}

/** Estrutura idêntica ao legado (CB-23/CB-24), persistida em JSON —
 *  `installment_details.installments[]` é a tabela de parcelas gerada
 *  (CV-06), portada como funções puras em `@/utils/budgetInstallments`
 *  (TASK-BG-FE-04). */
export interface BudgetPaymentInstallmentDetail {
  has_input: boolean;
  input_date: string | null;
  input_value: number | null;
  qtd_installments: number | null;
  first_installment: string | null;
  int_installments: number | null;
  fiscal_document: boolean;
  installments: { date: string; value: number }[];
}

export interface BudgetPaymentData {
  uuid: string;
  payment_method: BudgetPaymentMethod;
  installments: number;
  interval: number;
  due_date: string;
  amount: number | null;
  total: number;
  is_selected: boolean;
  installment_details: BudgetPaymentInstallmentDetail | null;
}

export interface BudgetData {
  uuid: string;
  code: string;
  date: string;
  client: BudgetClientRef | null;
  /** GAP-BG-FE-07 — mirror EXATO das chaves reais de
   *  `BudgetListResource`/`BudgetDetailResource` (`status` NUMÉRICO +
   *  `status_label` string, flat — NÃO é objeto `{value,label}`). Gate
   *  client-side de editar/excluir usa `status < 3` (numérico, nunca
   *  `status_label`). Corrigido aqui (era `status: BudgetStatusRef`) após
   *  confirmação por leitura direta do backend, TASK-BG-FE-02. */
  status: BudgetStatus;
  status_label: string;
  subtotal: number;
  freight: number;
  discount: number;
  total: number;
  note: string | null;
  hash: string;
  items: BudgetItemData[];
  payments: BudgetPaymentData[];
  /** GAP-BG-07 (revalidação 2026-08-25, ✅ CONCLUÍDO): campo real do
   *  `BudgetListResource`/`BudgetDetailResource` é `responsavel` — string
   *  FLAT, fiel ao LM-05 legado (`optional(item.user.people).name`), NUNCA
   *  o objeto aninhado `user.name` que a fundação (TASK-BG-FE-01) havia
   *  presumido antes da leitura direta do backend enriquecido. `null`
   *  quando `user`/`user.people` for nulo (estado honesto, sem fabricar
   *  nome — o schema real de `budgets.user_id` é NOT NULL, então `null` na
   *  prática só ocorreria se a Pessoa do usuário não tiver `people`
   *  vinculado). */
  responsavel: string | null;
}

/** Resposta de `GET /budgets` (índice) — mesma casca de `BudgetData` sem os
 *  arrays de itens/pagamentos (granularidade de grid, mirror `RequisitionListItem`
 *  quanto à omissão de sub-coleções pesadas). */
export interface BudgetListItem extends Omit<BudgetData, 'items' | 'payments'> {}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /budgets)
// ============================================

export interface BudgetsApiPaginationMeta {
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

export interface BudgetsListEnvelope {
  success: boolean;
  message: string;
  data: BudgetListItem[];
  errors: Record<string, string[]> | null;
  meta: BudgetsApiPaginationMeta | null;
}

// ============================================
// ENUMS (backed — mirror `BudgetStatus`/`BudgetPaymentMethod` do backend)
// ============================================

/** `AguardandoEnvio=1`, `Enviado=2`, `Confirmado=3`, `Negado=9` (CB-08,
 *  `budgets-api-contract.md §4.5`) — os 4 valores fechados, preservados. */
export type BudgetStatus = 1 | 2 | 3 | 9;

/** Catálogo SEFAZ (`Nfe::typesPayment()` legado), 14 chaves string fechadas —
 *  `budgets-api-contract.md §4.4`. Distinto de `PaymentTerm` (condição de
 *  pagamento Compra/Venda), confirmado por leitura direta. */
export type BudgetPaymentMethod =
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
// FILTRO (drawer da listagem, Tarefa 02, `FilterSideBudget`) + querystring real
// ============================================

export interface BudgetFilterForm {
  search?: string;
  product?: Option<string> | null;
  client?: Option<string> | null;
  start_date?: Date | null;
  end_date?: Date | null;
}

/** Querystring real de `GET /budgets` (`budgets-api-contract.md §4.1`). */
export interface ListBudgetsParams {
  search?: string;
  product_uuid?: string;
  client_uuid?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO/EDIÇÃO (Tarefas 03/04). `Option<T>`
// nos selects; `uuid?` por linha para diff (mirror `§4.5` do contrato de
// tela). Registrado já na fundação para as Tarefas seguintes consumirem sem
// redefinir o shape.
// ============================================

export interface BudgetItemForm {
  /** Presente = linha existente (edição); ausente = linha nova. */
  uuid?: string;
  product: Option<string> | null;
  /** Só leitura, populada pela cascata produto→unidade (`handleProductChange`). */
  unit: string;
  quantity: number | string;
  amount: number | string;
  discount: number | null;
  total: number;
}

export interface BudgetPaymentInstallmentDetailForm {
  has_input: boolean;
  input_date: string | null;
  input_value: number | null;
  qtd_installments: number | null;
  first_installment: string | null;
  int_installments: number | null;
  fiscal_document: boolean;
  installments: { date: string; value: number }[];
}

export interface BudgetPaymentForm {
  uuid?: string;
  payment_method: Option<BudgetPaymentMethod> | null;
  installments: number | string;
  interval: number | string;
  due_date: string;
  amount: number | null;
  total: number | string;
  /** Só presente/relevante quando `installments > 1` (IG-05, bloco condicional). */
  installment_details: BudgetPaymentInstallmentDetailForm | null;
}

export interface BudgetForm {
  code: string;
  date: string;
  client: Option<string> | null;
  freight: number | null;
  note: string | null;
  items: BudgetItemForm[];
  payments: BudgetPaymentForm[];
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de `BudgetRequest` real —
// `budgets-api-contract.md §4.3`). NENHUM campo `NAO_APLICAVEL` (D12) aparece
// aqui: `discount_percent`/`installment_value` ficam de fora por decisão de
// fidelidade (nunca lidos pelo servidor).
// ============================================

export interface BudgetItemPayload {
  /** Presente = atualiza; ausente = cria; uuid existente ausente da lista =
   *  remove (diff nativo por uuid, substitui `olds[]`). */
  uuid?: string;
  product_uuid: string;
  quantity: number;
  amount: number;
  discount?: number | null;
}

export interface BudgetPaymentPayload {
  uuid?: string;
  payment_method: BudgetPaymentMethod;
  installments: number;
  interval: number;
  due_date: string;
  amount?: number | null;
  /** VALIDADO no servidor contra a soma dos pagamentos == `budgets.total`
   *  (GAP-BG-04/D04) — o front envia o valor calculado/editado, nunca
   *  confia cegamente que o servidor aceitará sem checagem. */
  total: number;
  installment_details?: BudgetPaymentInstallmentDetailForm | null;
}

/**
 * `POST`/`PUT`/`PATCH /budgets/{uuid}`. `code` NUNCA aparece aqui — gerado
 * no servidor (`GET /budgets/next-code`, GAP-BG-05). `discount`/`subtotal`/
 * `total` (rodapé) também NUNCA são campos de input — sempre recalculados
 * no servidor (CV-02/CV-04, GAP-BG-04).
 */
export interface CreateOrUpdateBudgetPayload {
  date: string;
  client_uuid: string;
  freight: number;
  note?: string | null;
  items: BudgetItemPayload[];
  payments: BudgetPaymentPayload[];
}

// ============================================
// PÁGINA PÚBLICA (hash, `/orcamento-aprovacao/:hash`, TASK-BG-FE-06) — só
// leitura + escolha de `payment_uuid`. Mirror estrutural
// `PublicRequestQuotationData` (isolamento obrigatório do client autenticado).
// ============================================

export interface PublicBudgetData extends BudgetData {}

/** `PUT /public/budgets/{hash}` — aprovar (`answer: true`) ou negar
 *  (`answer: false`); `payment_uuid` só é exigido quando `answer === true`
 *  (escolha de UM pagamento já cadastrado, nunca cria pagamento novo). */
export interface PublicBudgetAnswerPayload {
  answer: boolean;
  payment_uuid: string;
}
