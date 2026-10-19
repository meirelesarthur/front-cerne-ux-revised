// src/@types/v2/Transfers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ROMANEIOS (Transfer — venda/colheita manual, Operacional).
//
// Fonte: `api-contract-romaneios.md` §4 (rotas/DTOs/Resources) e
// `front-contract-romaneios.md` §4.1/§4.2/§4.8/§7.4 (TASK-TRF-FE-01).
// `uuid` sempre, `id` NUNCA aparece no envelope — única exceção deliberada:
// `sale_contract_id_legacy` (FK legado de `sale_contracts`, ainda sem `uuid`
// no fork, `GAP-TRF-04`), somente leitura, nunca vai em payload.
//
// ARMADILHA #3/#4 da Tarefa — `TransferListItem` ≠ `TransferDetail`:
// `EAGER_LOAD_LIST = ['client','user','proprietary']` no Repository, então a
// LISTAGEM não tem as chaves `seller`/`transporter`/`payment_term`/
// `type_title`/`items`/`expenses` (ausentes, não `null`). Ler `item.items` no
// item de lista devolve `undefined` em runtime, sem erro de tipo — por isso
// os dois tipos são declarados separadamente em vez de um único
// `Transfer` com tudo opcional.
//
// TASK-TRF-FE-01 cobre a fundação completa (tipos de listagem + detalhe +
// filtro), consumidos pela Tela 1 (listagem). `TransferItem`/`TransferExpense`
// só são efetivamente USADOS pelo formulário nas Tarefas irmãs
// (TASK-TRF-FE-02..04), mas são declarados aqui por instrução da fundação.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS BACKED (valores físicos exatos — front-contract-romaneios.md §7.5,
// GAP-TRF-FE-13). NÃO normalizar: `type_payment` tem zero à esquerda,
// `payment_indicator` é numérico, `ExpenseTypeEnum::SERVICOS` tem cedilha.
// ============================================

export type TransferType = 'V' | 'C';
export type TransferStatus = 'P' | 'F';

// 15 códigos fiscais — strings de 2 dígitos, zero à esquerda preservado.
export type TransferPaymentType =
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

// Único enum não-string do módulo — backed por `int`.
export type PaymentIndicator = 0 | 1;

// ⚠️ `serviços` com cedilha e acento — valor físico do enum backed no
// servidor (`ExpenseTypeEnum::SERVICOS`). Não "corrigir" para `servicos`.
export type ExpenseType = 'receitas' | 'insumos' | 'serviços';

export type ExpensePayer = 'fornecedor' | 'empresa' | 'cliente' | 'rateio';

export type Apropriation = 'S' | 'N';

// ============================================
// ENTIDADES ANINHADAS (satélites `whenLoaded`)
// ============================================

// `client`/`proprietary`/`seller`/`transporter` e `provider` da despesa —
// DD-078-04 (T-078-API-04): o `TransferResource` passa a devolver
// `{uuid, name}` (`people.name`). `name` é aditivo e pode vir ausente/nulo
// (relação não carregada); a tela NUNCA cai para o uuid nem faz GET satélite.
export interface TransferPartyRef {
  uuid: string;
  name?: string | null;
}

// `user` é o único satélite que o Resource já hidrata com rótulo (o Model
// `User` tem `name` direto no `$fillable`).
export interface TransferUserRef {
  uuid: string;
  label: string;
}

// `payment_term`/`type_title` — satélites com `description` (não `label`).
export interface TransferDescriptionRef {
  uuid: string;
  description: string;
}

// `warehouse`/`service_reversal` das despesas acessórias
// (`TransferExpenseAncillaryResource`) — o Resource devolve a chave `name`
// (NÃO `description`, diferente de `TransferDescriptionRef` dos itens, ver
// `app/Http/Resources/V1/TransferExpenseAncillaryResource.php:41-48` na API).
export interface TransferExpenseSatelliteRef {
  uuid: string;
  name: string;
}

// ============================================
// ITEM DE ROMANEIO (`ItemTransferResource`, contrato de API §4.3, contrato de
// tela §5.4) — consumido pelo formulário (TASK-TRF-FE-03).
// ============================================

export interface TransferItem {
  uuid: string;
  product: TransferDescriptionRef | null;
  /** `null` = item "Sem estoque" (paridade legada) — não movimenta estoque. */
  warehouse: TransferDescriptionRef | null;
  measurement: TransferDescriptionRef | null;
  package: TransferDescriptionRef | null;
  lot: string | null;
  quantity: number;
  amount: number;
  /** Derivado (`quantity * amount`) — NUNCA vai no payload (armadilha #4/§4.4 da API). */
  total_amount: number;
  discard_kg: number | null;
  /** Derivado (`discard_kg / quantity * 100`) — NUNCA vai no payload. */
  discard_percentage: number | null;
  area: TransferDescriptionRef | null;
  note: string | null;
}

// ============================================
// DESPESA ACESSÓRIA (`TransferExpenseAncillaryResource`, contrato de API
// §4.3, contrato de tela §5.6) — consumido pelo formulário (TASK-TRF-FE-04).
//
// GAP-TRF-09 (backend, commit `a6bfec03c` em `GB.Cerne.Api`) — round-trip
// assimétrico CORRIGIDO: o Resource agora expõe `warehouse`/`service_reversal`
// (`whenLoaded`, `TransferRepository::EAGER_LOAD_DETAIL` inclui
// `expenses.warehouse`/`expenses.serviceReversal`). Mantidos NULLABLE aqui —
// defesa em profundidade da armadilha #2 da Tarefa TASK-TRF-FE-04: a tela
// NUNCA monta o payload de despesa a partir de um spread cru do GET (sempre
// via `transferExpenseToForm`/`buildTransferExpensePayload`, campo a campo);
// se a resposta não trouxer o satélite por qualquer motivo, o formulário
// trata como DESCONHECIDO (campo vazio + hint), nunca inventa/copia às cegas.
//
// ⚠️ `provider` continua só `{uuid}` (SEM `label`) — mesma lacuna de
// `client`/`seller`/`transporter`/`proprietary` (GAP-TRF-FE-03), confirmado em
// `TransferExpenseAncillaryResource.php:34-36`. O rótulo é resolvido na tela
// por MATCH no catálogo `providers/options` já carregado para
// `provider_uuid` (zero requests extra — nunca 1 request por linha).
// ============================================

export interface TransferExpense {
  uuid: string;
  type: ExpenseType;
  type_label: string;
  who_pay: ExpensePayer;
  who_pay_label: string;
  /** `{uuid, name}` — DD-078-04 (ver nota acima). */
  provider: TransferPartyRef | null;
  product: TransferDescriptionRef | null;
  /** GAP-TRF-09 (backend, corrigido) — `{uuid, name}`. Defesa em
   *  profundidade: tratado como opcional/desconhecido se ausente. */
  warehouse: TransferExpenseSatelliteRef | null;
  /** GAP-TRF-09 (backend, corrigido) — idem `warehouse`. */
  service_reversal: TransferExpenseSatelliteRef | null;
  quantity: number | null;
  vl_unit: number | null;
  /** Derivado (`quantity * vl_unit`) — NUNCA vai no payload. */
  value: number | null;
  apropriation: Apropriation;
  apropriation_label: string;
}

// ============================================
// RECURSO PRINCIPAL — LISTAGEM (`TransferResource`, EAGER_LOAD_LIST =
// ['client','user','proprietary']). SEM as chaves `seller`/`transporter`/
// `payment_term`/`type_title`/`items`/`expenses` (armadilha #3/#4 da Tarefa).
// ============================================

export interface TransferListItem {
  uuid: string;
  dt_sale: string; // YYYY-MM-DD
  dt_shipping: string; // YYYY-MM-DD
  due_date: string | null;
  type: TransferType;
  type_label: string;
  client: TransferPartyRef | null;
  user: TransferUserRef | null;
  /** FK opcional (`proprietary_uuid` não é `required` no formulário). */
  proprietary: TransferPartyRef | null;
  type_payment: TransferPaymentType;
  type_payment_label: string;
  payment_indicator: PaymentIndicator;
  payment_indicator_label: string;
  fiscal_document: boolean;
  driver: string | null;
  /** Texto livre informado à mão — NÃO é o número da NF-e emitida (módulo
   *  NF-e ausente, `GAP-TRF-05`). */
  nfe: string | null;
  note: string | null;
  commission: number;
  funrural_percentage: number;
  /** Derivado (`funrural_percentage/100 * total_products`) — NUNCA no payload. */
  funrural: number;
  icms: number;
  freight: number;
  others_values: number;
  /** Único monetário que pode vir `null`. */
  discount: number | null;
  /** Derivado (`Σ item.total_amount`) — NUNCA no payload. */
  total_products: number;
  /** Derivado — NÃO é o `total_geral` da grid legada (`GAP-TRF-FE-09`). */
  total: number;
  /** Inteiro sequencial por fazenda, gerado pelo servidor — NUNCA no payload. */
  code: number;
  status: TransferStatus;
  status_label: string;
  /** Presente tanto no `index` quanto no `show` (`withDerivedFlags()`) — a
   *  listagem já traz o suficiente para espelhar as travas SEM request extra
   *  (GAP-TRF-FE-05). */
  has_financial_posting: boolean;
  has_fiscal_document: boolean;
  is_from_charge: boolean;
  is_from_weighing: boolean;
  /** FK legado preservado, `sale_contracts` ainda sem `uuid` (`GAP-TRF-04`) —
   *  ÚNICA exceção documentada à regra "uuid sempre, id nunca". Somente
   *  leitura, nunca vai em payload. */
  sale_contract_id_legacy: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// RECURSO PRINCIPAL — DETALHE (`GET/POST/PUT /transfers/{uuid}`) — mesmo
// shape da listagem, ACRESCIDO dos satélites que só o `show` eager-carrega
// (contrato de API §4.5 `EAGER_LOAD` de detalhe).
// ============================================

export interface TransferDetail extends TransferListItem {
  seller: TransferPartyRef | null;
  transporter: TransferPartyRef | null;
  payment_term: TransferDescriptionRef | null;
  type_title: TransferDescriptionRef | null;
  items: TransferItem[];
  expenses: TransferExpense[];
  /** Somente leitura (contrato de tela §6) — o `TransferRequest` NÃO aceita
   *  `serie`; aparece só na visualização/detalhe, nunca no formulário. */
  serie: string | null;
  /** Somente leitura — mesma classe de `serie`/`sale_contract_id_legacy`. */
  salesman: string | null;
}

// ============================================
// FILTRO (drawer + busca da listagem, TASK-TRF-FE-01)
// ============================================

// Forma do filtro tal como o restante da SPA já convenciona (`TeamFilterForm`/
// `InvoiceFilterForm`): valores "crus", prontos para a querystring —
// `financial` fica como `boolean | undefined` (tri-estado REAL) porque é
// assim que o componente de filtro e o `paginatedQuery.filter` o carregam;
// a stringificação (`??` + `String(...)`) acontece só no service
// (armadilha #3 da Tarefa, molde `team-service.ts:47-54`).
export interface TransferFilterForm {
  /** Igualdade exata em `transfers.code` — validado como `integer` no
   *  servidor (armadilha #2 da Tarefa). NUNCA string. */
  search?: number;
  product_uuid?: string;
  /** Companion DISPLAY-ONLY (re-hidratação do `SelectAsyncPaginate` ao
   *  reabrir o drawer, mirror `FilterSideEstoqueInicial.tsx`) — nunca vai ao
   *  service/querystring; excluído da contagem de `filtersApplied` por
   *  convenção (chaves `*_label`, mesma regra de `Inventario/index.tsx`). */
  product_label?: string;
  client_uuid?: string;
  client_label?: string;
  user_uuid?: string;
  user_label?: string;
  proprietary_uuid?: string;
  proprietary_label?: string;
  type?: TransferType;
  status?: TransferStatus;
  /** Tri-estado: `undefined` = Todos, `true` = Sim, `false` = Não.
   *  `financial === false` é valor legítimo — nunca testar com `||`. */
  financial?: boolean;
  /** Corte por `dt_shipping >=` (Dt. Remessa, NÃO Dt. Venda). */
  start_date?: string;
  /** Corte por `dt_shipping <=`. */
  end_date?: string;
}

// Forma efetivamente enviada à querystring pelo service — `financial` já
// stringificado (`'true'|'false'`), o restante idêntico a `TransferFilterForm`.
// Mirror `ListTeamsParams`/`ListProductsParams` (`... extends
// PaginationQueryParams, TransferFilterRequest`).
export interface TransferFilterRequest {
  search?: number;
  product_uuid?: string;
  client_uuid?: string;
  user_uuid?: string;
  proprietary_uuid?: string;
  type?: TransferType;
  status?: TransferStatus;
  financial?: 'true' | 'false';
  start_date?: string;
  end_date?: string;
}

// ============================================
// FORMULÁRIO (`react-hook-form`) — TASK-TRF-FE-02, contrato de tela §5.1-§5.3.
// Campos relacionais guardados como `Option<T>` (`{label,value}`), NUNCA o
// `uuid` cru — o `Select`/`SelectAsyncPaginate` do fork trabalham com esse
// shape (armadilha #14, `value={field.value ?? null}`).
//
// `items`/`expenses` usam tipos RICOS de RHF (`TransferItemForm`/
// `TransferExpenseForm`, `Option<T>` nos campos relacionais da linha) —
// TASK-TRF-FE-03 (itens) e TASK-TRF-FE-04 (despesas).
// ============================================

export interface TransferForm {
  // ---- Seção "Informações gerais" ----
  dt_sale: string | null;
  dt_shipping: string | null;
  /** Opcional — se vazio, o servidor deriva de `dt_sale` + 1º prazo da
   *  condição de pagamento (contrato §5.8). NUNCA enviar `null` explícito
   *  sobre um valor já gravado — a chave é OMITIDA no payload quando vazia. */
  due_date: string | null;
  type: Option<TransferType> | null;
  client_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  /** `providers/options` — opcional, `nullable` no servidor (GAP-TRF-FE-14). */
  seller_uuid: Option<string> | null;
  commission: number | null;

  // ---- Seção "Faturamento e transporte" ----
  /** Nunca `null` no FORM (convenção do fork p/ campos `register()` — mirror
   *  `description` de `CreateOrUpdateEquipe.tsx`): default `''`, convertido
   *  para `null` só no payload (`.trim() || null`) quando vazio. */
  nfe: string;
  payment_term_uuid: Option<string> | null;
  /** Backed por string com zero à esquerda (`"01"`…`"99"`) — armadilha #4. */
  type_payment: Option<TransferPaymentType> | null;
  /** Backed por `int` (`0`/`1`) — único enum não-string do módulo, armadilha #3. */
  payment_indicator: Option<PaymentIndicator> | null;
  type_title_uuid: Option<string> | null;
  /** `providers/options` — mesmo gate/degradação de `seller_uuid`. */
  transporter_uuid: Option<string> | null;
  /** `proprietaries/options` — mesmo gate/degradação. */
  proprietary_uuid: Option<string> | null;
  /** `maxLength` 50 (Decisão D3) — NÃO 40. Nunca `null` no FORM (idem `nfe`). */
  driver: string;
  /** Cascata literal do legado: `type==='C'` → `false`; `'V'` → `true`
   *  (armadilha #6). Rótulo legado "Dedutível". */
  fiscal_document: boolean;
  /** SEM `maxLength` — o servidor é `nullable|string` sem `max` (armadilha #9).
   *  Nunca `null` no FORM (idem `nfe`). */
  note: string;

  // ---- Itens (TASK-TRF-FE-03, contrato §5.4) ----
  items: TransferItemForm[];
  // ---- Despesas acessórias (TASK-TRF-FE-04, contrato §5.6) ----
  expenses: TransferExpenseForm[];

  // ---- Bloco "Totais" (TASK-TRF-FE-03, contrato §5.5) — prévia read-only,
  // só `icms`/`freight`/`others_values`/`discount`/`funrural_percentage` vão
  // no payload (`total_products`/`funrural`/`total` NUNCA — GAP-TRF-FE-04). ----
  icms: number;
  freight: number;
  others_values: number;
  discount: number;
  /** Único campo do bloco que vai ao payload do lado do funrural — base
   *  `total_products` (armadilha #4), bidirecional com o campo R$ do
   *  componente (que é só prévia, nunca registrado no form). */
  funrural_percentage: number;
}

/** Linha do repeater de Itens (TASK-TRF-FE-03, contrato §5.4). `item_uuid` é
 *  a identidade do sync (armadilha #1) — presente em linha existente,
 *  ausente/`null` em linha nova. `total_amount` é conveniência bidirecional
 *  (`⇄ amount`, armadilha #2) — nunca vai ao payload, junto de
 *  `discard_percentage`/`weight` (nem sequer é campo do form — hint puro
 *  calculado na leitura, armadilha #8). `factor`/`factor_type`/
 *  `measurement_second` são CLIENT-ONLY (cascata produto→UM, armadilha #6) —
 *  nunca vão ao payload, semeados via `setValue` no `onChange` do produto E
 *  no `reset()` da hidratação (aqui sempre `null`, pois `TransferItem` não os
 *  expõe — a cascata só resolve de fato quando o usuário escolhe o produto
 *  na própria tela). */
export interface TransferItemForm {
  item_uuid?: string | null;
  product_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  /** `null` = "Sem estoque" (1ª opção, paridade legada) — sentinela de UI é
   *  `Option<string>` com `value: ''`, nunca `null` bruto (ver
   *  `RomaneioItemRow.tsx`), convertido para `null` só no payload. */
  warehouse_uuid: Option<string> | null;
  package_uuid: Option<string> | null;
  lot: string;
  quantity: number | null;
  amount: number | null;
  /** Conveniência bidirecional (`total_amount ⇄ amount`) — NUNCA vai ao
   *  payload (armadilha #2/#3). Só recalculado a partir de `quantity`/
   *  `amount` reativamente; nunca sobrescrito na hidratação. */
  total_amount: number | null;
  discard_kg: number | null;
  area_uuid: Option<string> | null;
  note: string;
  // ---- Client-only (cascata produto→UM, §5.4.1) — nunca no payload ----
  factor: number | null;
  factor_type: 'M' | 'D' | null;
  measurement_second: string | null;
}

/** Linha do repeater de Despesas acessórias (TASK-TRF-FE-04, contrato §5.6).
 *  `expense_uuid` é a identidade do sync (mesma regra do `item_uuid` acima) —
 *  presente em linha existente, ausente/`null` em linha nova. `value`
 *  (`quantity * vl_unit`) NÃO é campo do form — hint puro calculado na
 *  leitura na própria `RomaneioExpenseRow.tsx` (armadilha #5, nunca vai ao
 *  payload, nem sequer é persistido aqui — mesmo racional de
 *  `discard_percentage` em `TransferItemForm`).
 *
 *  Campos condicionais por `type` (armadilha #10): `service_reversal_uuid`
 *  só em `receitas`/`serviços` (endpoint muda conforme o `type` —
 *  `/reversal-expenses` ou `/service-expenses`); `warehouse_uuid`/
 *  `product_uuid` só em `insumos`. `provider_uuid` só habilitado quando
 *  `who_pay === 'fornecedor'` (armadilha #6); `apropriation` forçado a `'N'`
 *  e desabilitado quando `who_pay === 'rateio'` (armadilha #7).
 *
 *  `warehouse_uuid`/`service_reversal_uuid` de despesa EXISTENTE: GAP-TRF-09
 *  corrigiu o round-trip no backend (o GET agora devolve `warehouse`/
 *  `service_reversal`), mas a hidratação (`transferExpenseToForm`) trata a
 *  ausência como DESCONHECIDO — campo vazio + hint, nunca inventado — defesa
 *  em profundidade da armadilha #2 da Tarefa. */
export interface TransferExpenseForm {
  expense_uuid?: string | null;
  type: Option<ExpenseType> | null;
  service_reversal_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  /** `providers/options` — mesmo catálogo/gate de `seller_uuid`/
   *  `transporter_uuid` (GAP-TRF-FE-14), reusado sem request extra. */
  provider_uuid: Option<string> | null;
  quantity: number | null;
  vl_unit: number | null;
  who_pay: Option<ExpensePayer> | null;
  apropriation: Option<Apropriation> | null;
  /** Client-only (contrato §5.6, armadilha #12) — `option.use_kg` do
   *  estorno/serviço escolhido, só para exibir o hint de quantidade manual.
   *  Nunca vai ao payload (mesmo racional de `factor`/`factor_type` do
   *  `TransferItemForm`). */
  use_kg?: boolean | null;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT /transfers`) — contrato de tela §5.7,
// espelha `TransferRequest::rules()` (api-contract-romaneios.md §4.3).
// `PUT` é substituição INTEGRAL — nunca delta de `dirtyFields` (armadilha #7).
// ============================================

export interface TransferItemPayload {
  /** Identidade estável do sync — presente = update, ausente/`null` = item
   *  novo (perder o uuid faz o servidor movimentar estoque duas vezes). */
  item_uuid?: string | null;
  product_uuid: string;
  measurement_uuid: string;
  warehouse_uuid?: string | null;
  package_uuid?: string | null;
  lot?: string | null;
  quantity: number;
  amount: number;
  discard_kg?: number | null;
  area_uuid?: string | null;
  note?: string | null;
}

export interface TransferExpensePayload {
  expense_uuid?: string | null;
  type: ExpenseType;
  service_reversal_uuid?: string | null;
  warehouse_uuid?: string | null;
  product_uuid?: string | null;
  provider_uuid?: string | null;
  quantity: number;
  vl_unit: number;
  who_pay: ExpensePayer;
  apropriation: Apropriation;
}

export interface CreateTransferRequest {
  type: TransferType;
  dt_sale: string;
  dt_shipping: string;
  /** Chave OMITIDA quando o usuário não informou (armadilha #5) — nunca
   *  `null` explícito. */
  due_date?: string;
  client_uuid: string;
  user_uuid: string;
  seller_uuid?: string | null;
  transporter_uuid?: string | null;
  proprietary_uuid?: string | null;
  payment_term_uuid: string;
  type_payment: TransferPaymentType;
  payment_indicator: PaymentIndicator;
  type_title_uuid: string;
  fiscal_document: boolean;
  driver?: string | null;
  nfe?: string | null;
  note?: string | null;
  commission?: number;
  /** Bloco "Totais" (TASK-TRF-FE-03, contrato §5.5) — `total_products`/
   *  `funrural`/`total` NUNCA aparecem aqui (derivados, servidor recalcula). */
  funrural_percentage?: number;
  icms?: number;
  freight?: number;
  others_values?: number;
  discount?: number;
  /** `required|array|min:1` no servidor — a tela nunca permite salvar com
   *  `items` vazio (armadilha #2 do payload, contrato §5.7). */
  items: TransferItemPayload[];
  /** `present|array` no servidor — SEMPRE presente, `[]` remove todas
   *  (armadilha #1, D6, inverso da regra de Equipes). */
  expenses: TransferExpensePayload[];
}

/** `PUT` é o MESMO shape de `POST` (substituição integral, sem branching de
 *  verbo — Decisão D2, armadilha #7). Alias, não um tipo `Partial`. */
export type UpdateTransferRequest = CreateTransferRequest;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`) — a listagem devolve um array
// PLANO em `data`, NÃO `{data:{items,pagination}}` (armadilha #1 da Tarefa).
// ============================================

export interface TransfersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  links?: Record<string, unknown>;
}

export interface TransfersListEnvelope {
  success: boolean;
  message: string;
  data: TransferListItem[];
  errors: Record<string, string[]> | null;
  meta: TransfersApiPaginationMeta | null;
}

export interface TransferFinishItem {
  uuid: string;
  product: { uuid: string; description: string } | null;
  measurement: { uuid: string; name: string } | null;
  quantity: number;
  delivery_quantity: number | null;
}

export interface TransferFinishDetail {
  uuid: string;
  code: number;
  status: TransferStatus;
  status_label: string;
  items: TransferFinishItem[];
}

export interface TransferFinishPayload {
  items: { uuid: string; delivery_quantity: number }[];
}

export interface TransferFinishFormItem {
  uuid: string;
  product_label: string;
  measurement_label: string;
  quantity: number;
  delivery_quantity: number | null;
}

export interface TransferFinishForm {
  items: TransferFinishFormItem[];
}
