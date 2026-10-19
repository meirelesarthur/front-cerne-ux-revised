// src/@types/v2/RequestQuotations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Cotações" (RequestQuotation — Administrativo / Suprimentos,
// esteira 97-Esteiras/035, TASK-CQ-FE-01). Fundação de dados — nenhuma
// lógica, só shapes. Mirror estrutural de `@/@types/v2/RequestPurchases/index.d.ts`
// (módulo REAL mais próximo, mesmo domínio de Suprimentos).
//
// Fonte: `97-Esteiras/035/ROTEIROS/02-roteiro-api-cotacoes.md` (Seção 5,
// desenho Clean Architecture) + `97-Esteiras/035/ROTEIROS/03-roteiro-frontend-cotacoes.md`
// (Seção 3, contrato de tela) — CONFIRMADO por leitura direta do código real
// (`api_root`): `RequestQuotationResource`/`RequestQuotationItemResource`/
// `RequestQuotationPaymentResource`, `RequestQuotationController`,
// `RequestQuotationRequest`/`RequestQuotationSavingRequest`,
// `RequestQuotationRepository` (eager-loading real por método).
//
// FKs expostas como `*_uuid` (convenção universal do projeto) — nenhum `id`
// sequencial exposto (Lei do client API Cerne). `RequestQuotationItem`/
// `RequestQuotationPayment` NÃO têm `uuid` próprio (nunca endereçados
// isoladamente por rota, sempre nested sob a `RequestQuotation` pai — mirror
// dos comentários de `RequestQuotationItemResource`/`RequestQuotationPaymentResource`
// reais).
//
// ⚠️ Achado real de EAGER-LOADING divergente por endpoint (leitura direta de
// `RequestQuotationRepository`, TASK-CQ-API-02) — mesma disciplina de
// documentação já usada em `RequestPurchaseData` (marcar `?:` o que não é
// garantido, nunca assumir):
//   - `findByUuidOrFail` (`show`, RT-05) eager-loada `provider.people`,
//     `branch`, `items.requestItem.product`, `payments`, `requestPurchase`,
//     `savingResponsible`, `user.people` — resposta mais completa.
//   - `listByRequestPurchase` (`quotes`, RT-10 — grade da aba Cotações)
//     eager-loada só `provider.people`, `branch`, `items` (SEM
//     `requestItem.product`), `payments`, `user.people` — **`request_purchase`
//     e `saving_responsible` ficam AUSENTES** (não `null`) nesta resposta, e
//     cada item de `items[]` vem SEM `request_item_uuid`/`description`/
//     `product` (a relação `requestItem` não é eager-loaded aqui).
// Por isso todo campo dependente de relação abaixo é `?:` — o consumidor
// (TASK-CQ-FE-03/05) precisa tratar ausência defensivamente, nunca presumir
// presença por causa do endpoint de origem.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (FKs relacionais, mirror `RequestResponsibleRef`/`HarvestRef`)
// ============================================

/** `request_purchase` — CONFIRMADO contra `RequestQuotationResource` real,
 *  `whenLoaded('requestPurchase', ...)` — só presente na resposta de `show()`. */
export interface RequestQuotationPurchaseRef {
  uuid: string;
  code: string | null;
}

/** Criador da cotação (`quotation.user`, fix FUP-CQ-03/LM-18) — `{uuid, name}`,
 *  mirror `RequestResponsibleRef` de `RequestPurchases`. Presente em `show()`
 *  E `quotes()` (`user.people` eager-loaded em ambos os métodos do Repository). */
export interface RequestQuotationUserRef {
  uuid: string;
  name: string | null;
}

/** `provider` — CONFIRMADO contra `RequestQuotationResource` real. `email`/
 *  `cellphone` expostos de propósito para a composição client-side do
 *  WhatsApp (Seção 8.3 do roteiro de API, TASK-CQ-FE-09). */
export interface RequestQuotationSellerRef {
  uuid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface RequestQuotationProviderRef {
  uuid: string;
  name: string | null;
  email: string | null;
  cellphone: string | null;
  /** ADITIVO (execução 081, T-081-API-07) — vendedores do fornecedor. O modal de
   *  WhatsApp lista o fornecedor e cada vendedor sem chamada extra. */
  sellers?: RequestQuotationSellerRef[];
  /** ADITIVO (T-081-API-07) — telefone da pessoa (legado: `cellphone ?? people.phone`). */
  phone?: string | null;
}

/** `branch` — relação nullable no domínio (cotação pode não ter filial
 *  vinculada); quando a relação está eager-loaded mas é `null`, o Resource
 *  real devolve a CHAVE presente com valor `null` (`whenLoaded` com callback
 *  ternário) — nunca ausente nos dois endpoints (ambos eager-loadam `branch`). */
export interface RequestQuotationBranchRef {
  uuid: string;
  name: string;
  nif: string | null;
}

/** Responsável pelo saving aplicado (`saving_responsible`) — CONFIRMADO só
 *  presente em `show()` (`savingResponsible` não eager-loaded em `quotes()`,
 *  ver nota de eager-loading no cabeçalho do arquivo). */
export interface RequestQuotationSavingResponsibleRef {
  uuid: string;
  name: string;
}

/** Produto vinculado ao `RequestItem` original — só presente quando
 *  `items.requestItem.product` está eager-loaded (`show()` apenas). */
export interface RequestQuotationItemProductRef {
  uuid: string;
  description: string;
}

/** Linha de item da cotação (leitura, `RequestQuotationItemResource` real).
 *  `request_item_uuid`/`description`/`product` só vêm preenchidos em `show()`
 *  (ver nota de eager-loading no cabeçalho — `quotes()` carrega `items` SEM
 *  `requestItem.product`). */
export interface RequestQuotationItemRow {
  /** Ausente em `quotes()` — presente em `show()` (`whenLoaded('requestItem', ...)`). */
  request_item_uuid?: string;
  description?: string | null;
  product?: RequestQuotationItemProductRef | null;
  quantity: number;
  amount: number;
  total: number;
  observation: string | null;
  /** Sempre igual a `quantity` no domínio de origem — somente leitura. */
  is_authorized: boolean;
  brand: string | null;
}

/** Linha de forma de pagamento da cotação (leitura, mirror
 *  `RequestQuotationPaymentResource` real). Sem relação aninhada — mesmo
 *  shape em `show()`/`quotes()`/`GET .../payments`. */
export interface RequestQuotationPaymentRow {
  /** Uuid da condição (execução 081, T-081-API-07: necessário para `selected-payment`). */
  uuid: string;
  payment_method: number;
  payment_method_label: string;
  installments: number;
  interval: number;
  amount: number;
  total: number;
}

// ============================================
// REQUEST QUOTATION (resposta da API — `RequestQuotationResource` real)
// ============================================

export interface RequestQuotationData {
  uuid: string;
  /** Fator de posse do formulário público do fornecedor (TASK-CQ-FE-10) —
   *  exposto de propósito neste Resource interno para compor o link
   *  `orcamento/{hash}` e o texto do WhatsApp client-side (Seção 8.3). */
  hash: string;
  quotation_date: string | null;
  expiration_date: string | null;
  total_value: number;
  /** "Valor com Desconto" no Dialog Aplicar Saving — CV-04, armadilha
   *  semântica preservada do legado (CL-045): este campo é o DESCONTO
   *  calculado (`total_value - valor_líquido`), não o valor líquido em si. */
  discount: number;
  saving: number;
  status: number;
  status_label: string;
  requires_file: boolean;
  note: string | null;
  /** Nome livre do FORNECEDOR no formulário público (FIELD do legado com
   *  este nome exato — grafia `reponsible`, mantida 1:1, ver Seção 5.1 do
   *  roteiro frontend). NÃO confundir com `saving_responsible` abaixo, que é
   *  outro conceito (usuário interno responsável pelo saving aplicado). */
  reponsible: string | null;
  observation: string | null;

  /** Ausente em `quotes()` (ver nota de eager-loading no cabeçalho). */
  request_purchase?: RequestQuotationPurchaseRef;
  /** Presente em `show()` E `quotes()` (`user.people` eager-loaded em ambos). */
  user?: RequestQuotationUserRef;
  provider?: RequestQuotationProviderRef;
  branch?: RequestQuotationBranchRef | null;
  /** Ausente em `quotes()` (ver nota de eager-loading no cabeçalho). */
  saving_responsible?: RequestQuotationSavingResponsibleRef | null;

  items?: RequestQuotationItemRow[];
  payments?: RequestQuotationPaymentRow[];
  /** Condição de pagamento escolhida na Aprovação (T-081-API-07); `null` = nenhuma. */
  selected_payment_uuid?: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// FILTRO (grade `quotes` — RT-10, opcional dentro de UMA RequestPurchase)
// ============================================

/** Shape enviado à querystring de `GET /request-purchases/{uuid}/quotations`
 *  (`RequestQuotationFilterData` real — `provider_uuid`/`status` OPCIONAIS). */
export interface RequestQuotationFilterRequest {
  provider_uuid?: string;
  status?: number;
}

// ============================================
// PAYLOADS DE ESCRITA (store/update/saving) — `RequestQuotationRequest`/
// `RequestQuotationSavingRequest` reais, JSON puro (SEM multipart — nenhum
// campo de arquivo no núcleo desta Tarefa).
// ============================================

/** `POST`/`PUT /request-quotations` — só os 4 campos que o form interno edita
 *  (FIELD-01..04, CL-025/026). `request_purchase_uuid` é exigido em AMBOS os
 *  verbos pelo Form Request real, mas é IMUTÁVEL no update (a
 *  `UpdateRequestQuotationAction` ignora esse campo de propósito) — mesma
 *  convenção já usada em `RequestPurchasePayload.type` (imutável, mas
 *  enviado). O service, não este arquivo de tipos, decide se omite/reenvia. */
export interface RequestQuotationPayload {
  provider_uuid: string;
  request_purchase_uuid: string;
  branch_uuid?: string | null;
  requires_file: boolean;
  note?: string | null;
}

/** `PUT /request-quotations/{uuid}/saving` — CV-04. `discount` aqui é o
 *  "valor líquido" do form legado (rótulo confuso preservado, CL-045) — NÃO é
 *  o `discount` persistido no Resource (`RequestQuotationData.discount`,
 *  que é o desconto já calculado pelo servidor). */
export interface RequestQuotationSavingPayload {
  responsible_uuid: string;
  discount: number;
}

// ============================================
// FORM (react-hook-form) — Dialog Criar/Editar Cotação (TASK-CQ-FE-04)
// ============================================

export interface RequestQuotationForm {
  provider_uuid: Option<string> | null;
  /** Dependente de `provider_uuid` (cascata CL-021/022) — `disabled` até
   *  haver `provider_uuid` OU quando `status===3` (CL-024, default de
   *  engenharia documentado no roteiro frontend §2). */
  branch_uuid: Option<string> | null;
  requires_file: Option<boolean> | null;
  note?: string | null;
}

// ============================================
// ADITIVO (TASK-CQ-FE-06) — Dialog "Aplicar Saving"
// (`RequestQuotationSavingDialog.tsx`). Mesma disciplina incremental já usada
// no restante deste módulo (tipos entram só na Tarefa que os consome).
// ============================================

/** Form do Dialog "Aplicar Saving" (FIELD-14/15, CV-04). `discount` aqui
 *  reproduz DE PROPÓSITO o mesmo nome de campo do payload
 *  (`RequestQuotationSavingPayload.discount`) — mapeamento 1:1 sem tradução
 *  de chave, mesma técnica de `setError` por campo já usada em
 *  `RequestQuotationFormDialog.tsx`. Rotulado na tela como "Valor com
 *  Desconto" (armadilha semântica preservada do legado, CL-045): o valor
 *  digitado aqui é o VALOR LÍQUIDO, não o desconto em si — o servidor é quem
 *  calcula e persiste o desconto/saving reais (`ApplyRequestQuotationSavingAction`). */
export interface RequestQuotationSavingForm {
  responsible_uuid: Option<string> | null;
  discount: number | null;
}

// ============================================
// ADITIVO (TASK-CQ-FE-08) — Modal "Enviar E-mail em Lote"
// (`RequestQuotationEmailBatchModal.tsx`, Dimensão B). Payload decidido no
// roteiro de API (TASK-CQ-API-08, Seção 8.2, `RequestQuotationEmailBatchRequest`/
// `RequestQuotationEmailBatchItemData` reais) — array de itens com chaves
// explícitas, substitui o array posicional por checkbox do legado (CL-050).
// ============================================

/** Item do lote — mirror 1:1 de `RequestQuotationEmailBatchItemData` real
 *  (backend). `provider_selected`/`seller_uuids` são SEMPRE enviados (mesmo
 *  vazios/`false`) — o Form Request real usa `present` (não
 *  `nullable`/`sometimes`, LAC-05): a AUSÊNCIA da chave quebraria a Action,
 *  não o valor vazio. */
export interface RequestQuotationEmailBatchItemPayload {
  quotation_uuid: string;
  provider_selected: boolean;
  seller_uuids: string[];
}

/** `POST /request-quotations/email-batch` — envelope único do lote inteiro
 *  (`RequestQuotationEmailBatchRequest::rules()` real, `quotations` é
 *  `required|array|min:1`). */
export interface RequestQuotationEmailBatchPayload {
  quotations: RequestQuotationEmailBatchItemPayload[];
}

// ============================================
// ADITIVO (TASK-CQ-FE-10) — Formulário PÚBLICO do fornecedor (hash),
// `GET/POST /api/v1/public/request-quotations/{hash}`
// (`RequestQuotationPublicController`, FORA de `auth:sanctum`/`permission:`
// — posse do hash é o único fator de autorização, roteiro de API §9).
//
// ⚠️ CONFIRMADO por leitura direta do código real (`api_root`,
// `PublicRequestQuotationResource::toArray()` +
// `RequestQuotationPublicSubmissionRequest::rules()`) — shape DELIBERADAMENTE
// MÍNIMO e DIFERENTE de `RequestQuotationData` (interno): sem `uuid`/`hash`/
// `discount`/`saving`/`id` bigint, sem outras cotações do mesmo
// `request_purchase` (whitelist de segurança, roteiro API §9.1). NUNCA
// reaproveitar `RequestQuotationData`/`RequestQuotationPayload` para esta
// fatia — são contratos INDEPENDENTES por desenho.
//
// Nomes de campo de pagamento CONFIRMADOS no Form Request real —
// `payment_method`/`installments`/`interval`/`amount`/`total` (NÃO
// `form_pay`/`number_days`/`number_installments`/`installment_value`/
// `tt_value`, nomenclatura antiga citada só na leitura de UX do roteiro
// frontend §5.1; os nomes reais do payload são os do Form Request, único
// contrato vinculante).
// ============================================

/** `farm` — só presente quando a relação existe (nunca `undefined`, sempre a
 *  chave OU `null`, mirror `whenLoaded` do Resource real). */
export interface PublicRequestQuotationFarmRef {
  description: string;
}

/** `request_purchase` — dados MÍNIMOS da solicitação-pai (sem `uuid`, o
 *  fornecedor nunca precisa endereçá-la diretamente). */
export interface PublicRequestQuotationPurchaseRef {
  code: string;
  description: string;
  /** Código de 1 letra do tipo (`P`, `S`, ...), como na Solicitação. */
  type: string;
  type_label: string;
}

/** `provider` — só `name` (mirror `hash.blade.php`, nunca e-mail/telefone
 *  neste Resource público). */
export interface PublicRequestQuotationProviderRef {
  name: string;
}

/** Linha de item do formulário público — `quantity` é SEMPRE somente-leitura
 *  (vem do servidor; a submissão NUNCA confia em `quantity` enviada de
 *  volta — roteiro de API §9.1, "campo readonly confiável"). Endereçada por
 *  `request_item_uuid`, nunca por posição/índice (fecha CL-033 antigo). */
export interface PublicRequestQuotationItemRow {
  request_item_uuid: string;
  description: string;
  brand: string | null;
  quantity: number;
}

/** `GET /public/request-quotations/{hash}` — `RT-01`. Nenhum campo de posse
 *  (`hash`/`uuid`) é reexposto — a URL já o carrega. */
export interface PublicRequestQuotationData {
  status: number;
  status_label: string;
  note: string | null;
  requires_file: boolean;
  farm: PublicRequestQuotationFarmRef | null;
  request_purchase: PublicRequestQuotationPurchaseRef | null;
  provider: PublicRequestQuotationProviderRef | null;
  items: PublicRequestQuotationItemRow[];
}

// -------- Payload de submissão (multipart/form-data, `POST`) --------

/** `items[].quantity` é aceito pelo Form Request real (`sometimes`) mas
 *  SEMPRE descartado pela Action (lida do `RequestItem` real do servidor) —
 *  por isso NÃO faz parte deste payload de escrita (nunca enviado). */
export interface PublicRequestQuotationItemPayload {
  request_item_uuid: string;
  unitary_value: number;
  brand: string;
  observation?: string | null;
}

export interface PublicRequestQuotationPaymentPayload {
  payment_method: number;
  installments: number;
  interval: number;
  amount: number;
  total: number;
}

/** `POST /public/request-quotations/{hash}` — `RT-02`. `total_value` é a
 *  SOMA dos `amount` (preview CV-01) de todos os itens — calculada pelo
 *  cliente, nunca digitada pelo fornecedor (não há campo de UI para ela). */
export interface PublicRequestQuotationSubmissionPayload {
  reponsible: string;
  expiration_date: string;
  total_value: number;
  items: PublicRequestQuotationItemPayload[];
  payments: PublicRequestQuotationPaymentPayload[];
  file?: File | null;
}

// -------- Form (react-hook-form) --------

/** Linha de item no `useForm` — `quantity`/`description` são snapshot
 *  somente-leitura do `GET` (nunca editados), `amount` é o PREVIEW
 *  client-side (CV-01, `unitary_value * quantity`, recalculado no `onBlur`
 *  de `unitary_value` — nunca enviado ao servidor, que recalcula com o
 *  `quantity` real). */
export interface PublicRequestQuotationItemFormRow {
  request_item_uuid: string;
  description: string;
  quantity: number;
  brand: string | null;
  unitary_value: number | null;
  observation: string | null;
  amount: number;
}

/** Linha de condição de pagamento (`useFieldArray`, mirror
 *  `RequestAttachmentRow`, guarda "não remover a última linha" CL-035).
 *
 * Default de engenharia documentado (Form Request só exige `numeric`/
 * `integer`, sem regra de proporção entre os 2 valores monetários): `total`
 * é o campo EDITÁVEL (valor total da cotação sob esta condição de
 * pagamento); `amount` (valor da parcela) é PREVIEW client-side, calculado
 * `round(total / installments, 2)` no `onBlur` de `total`/`installments` —
 * mirror do mesmo racional já documentado para CL-024/saving preview neste
 * módulo. O servidor não recalcula (persiste os 2 valores como recebidos,
 * `numeric` puro) — por isso o cálculo aqui é responsabilidade REAL do
 * cliente, não cosmética (CV-03). */
export interface PublicRequestQuotationPaymentFormRow {
  payment_method: Option<number> | null;
  installments: number | null;
  interval: number | null;
  total: number | null;
  amount: number | null;
}

export interface PublicRequestQuotationForm {
  reponsible: string | null;
  expiration_date: string | null;
  file: File | null;
  items: PublicRequestQuotationItemFormRow[];
  payments: PublicRequestQuotationPaymentFormRow[];
}

/** Envelope real do endpoint público (`ApiResponse::error`, CONFIRMADO por
 *  leitura direta) — distinto de `Response<T>` (`@/@types/response-api`,
 *  usado pelo restante da SPA autenticada): expõe `errors`/`meta`, não
 *  `notifications`/`statusCode`. Usado SÓ para tipar o corpo de erro lido em
 *  `error.response.data` (axios) desta fatia pública. */
export interface PublicApiErrorBody {
  success: boolean;
  message?: string | null;
  data: null;
  /** 409 (`QUOTATION_ALREADY_SUBMITTED`) usa `{code: string[]}`; 422 de
   *  validação usa `{<campo>: string[]}` (dot-notation, ex.
   *  `items.0.unitary_value`); `BusinessRuleException`/404/429 vêm com
   *  `errors: null`. */
  errors?: Record<string, string[]> | null;
  meta?: unknown;
}

// Reexport de conveniência (mirror `RequestPurchases/index.d.ts`).
// -----------------------------------------------------------------------------
// ADITIVOS da execução 081 (T-081-FE-08; contrato da API em EXEC-API-07).
// -----------------------------------------------------------------------------

/** Linha do `PUT request-purchases/{uuid}/quotation-items` (update-item do
 *  estágio de cotação). `uuid` ausente cria o item (nunca remove). */
export interface QuotationStageItemPayload {
  uuid?: string | null;
  product_uuid?: string | null;
  quantity: number;
  description?: string | null;
}

export interface QuotationStageItemsPayload {
  items: QuotationStageItemPayload[];
}

/** `POST request-purchases/{uuid}/quotation-separate` — uuids dos itens que
 *  vão para a sub solicitação (a API recusa mover todos). */
export interface QuotationSeparatePayload {
  items: string[];
}

/** Linha editável do quadro de itens da aba Cotações. */
export interface QuotationStageItemFormRow {
  uuid: string | null;
  product: Option<string> | null;
  quantity: number | null;
  description: string;
}

export interface QuotationStageItemsForm {
  items: QuotationStageItemFormRow[];
}

export type { Option };
