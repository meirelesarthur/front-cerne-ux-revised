// src/@types/v2/Invoices/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Doc. Fiscal/Entrada" (Invoice) — API v1 do backend Laravel
// GB.Cerne. Casa própria (mirror `Warehouses`/`Planos`), NÃO sub-pasta de
// `CadastrosBase`/`BaseRegistrations` — TASK-FE-2760, execução 033/Onda 3.
//
// ⚠️ CONTRATO REAL (backend JÁ CONSTRUÍDO, branch
// `feature/refactor-plans-appropriations-invoices-nfe`) — este arquivo foi
// modelado por LEITURA DIRETA de `InvoiceController.php`/
// `InvoiceRequest.php`/`InvoiceIndexRequest.php`/`{Invoice,ItemInvoice,
// InvoiceExpense}Resource.php`/`app/Data/Invoice/*`/`routes/api.php`, NÃO a
// partir só do `Invoice-contrato.md` (documento anterior ao backend real) —
// os `TASK-FE-2760..2769.md` desta rodada citam nomes `_id` (ex.
// `provider_id`/`state_id`) que o backend NÃO usa. Divergências reais
// confirmadas e respeitadas aqui:
//   - Todas as FKs de escrita usam sufixo `_uuid` (`provider_uuid`,
//     `proprietary_uuid`, `state_uuid`, `harvest_uuid`, `branch_uuid`,
//     `contract_uuid`, `items.*.product_uuid/warehouse_uuid/center_uuid/
//     category_uuid/cultivation_uuid/measurement_uuid`, `categories.*.
//     category_uuid/center_uuid/plan_account_uuid`), NUNCA `_id`.
//   - `type_title_uuid` é campo REAL e OBRIGATÓRIO (`InvoiceRequest::rules()`
//     — FK `type_titles`), apesar de `TASK-FE-2763.md` ter planejado omiti-lo
//     por "não modelável" (planejado ANTES do backend existir). Modelado
//     aqui como obrigatório de verdade.
//   - `categories.*.center_uuid` é OBRIGATÓRIO (não é opcional como o
//     contrato documental sugeria) — `expense_category.center_id NOT NULL`.
//   - `uuid` de `InvoiceExpense` (parcela) é exposto como `"uuid"` mesmo
//     sendo `expenses.api_uuid` na coluna física (nunca `expenses.uuid`
//     legado, que é só correlação).
//   - `items.*.equipment{}` é um bloco OBRIGATÓRIO quando
//     `items.*.is_equipment === true` (`required_if`) — cascata de criação de
//     Equipment, não documentada nos packets desta rodada.
//   - Rateio (`categories[]`) e parcelamento (`installments[]`) são
//     WRITE-ONLY: o `InvoiceResource`/`ItemInvoiceResource`/
//     `InvoiceExpenseResource` NUNCA devolvem o rateio persistido (nem no
//     cabeçalho, nem embutido na parcela) — `UpdateInvoiceAction` inclusive
//     IGNORA `categories`/`installments` no PUT (Contas a Pagar são imutáveis
//     pós-criação). A tela de edição NÃO pode reidratar o rateio anterior —
//     ver `CreateOrUpdateInvoice.tsx`.
//   - `GET /invoices` (listagem) eager-carrega SÓ `provider.people`+`state`
//     (`InvoiceRepository::listWithFilters()`) — `proprietary`/`items`/
//     `expenses` NUNCA vêm na listagem, só no `show`/`store`/`update`. A
//     coluna "Proprietário" da spec-visual §3 foi OMITIDA da listagem por
//     isso (SEM MOCK) — sugestão registrada no relatório de entrega para o
//     backend futuramente incluir `proprietary.people` no eager-load do
//     index, se o dono do produto quiser a coluna.
//
// Payload de escrita (`InvoicePayload`) modela 1:1 `InvoiceRequest::rules()`
// — SEM `payment_id`/`farm_id`/`code`/`vl_total`/`vl_items`/`total_amount`/
// `generate_stock`/`appropriation`/`request_purchase_id` (sempre calculados/
// fixos no servidor, D2/D4/D5 do contrato documental — isso o contrato
// documental acertou).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// ENUMS — sem endpoint de catálogo (Resource só devolve `->value` cru,
// nunca `{value,label}`); labels hardcoded no frontend (mirror
// `drink-options.ts`/`provider-type-options.ts`, fábrica `(languageGB) =>`).
// ============================================

/** `InvoiceDocumentType` (int-backed, "Tipo Nota"). */
export type InvoiceDocumentTypeValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** `InvoiceClassification` (string-backed, `character(1)`, default `'N'`). */
export type InvoiceClassificationValue = 'N' | 'C' | 'O';

/** `InvoiceApportionmentType` (string-backed, `character(1)`, "Tipo Rateio"). */
export type InvoiceApportionmentTypeValue = 'V' | 'P';

/**
 * `App\Enums\Invoice\AppropriationType` (int-backed, item.appropriation_type).
 * ⚠️ Gap de valor 3 (não existe caso 3, salta 2→4) — fiel ao Enum real.
 * GAP-528: só `AGRICOLA(1)` é funcional (`AppropriationRoutingAction`); os
 * ramos `PASTAGEM(2)`/`MANUTENCAO_EQUIPAMENTO(4)`/`ABASTECIMENTO(5)` passam a
 * validação HTTP mas o backend rejeita com 422 de negócio — tratado na UI
 * (ver `InvoiceItemsTab.tsx`), nunca escondido.
 */
export type AppropriationTypeValue = 0 | 1 | 2 | 4 | 5;

/**
 * GET /invoices/appropriation-types/options (TASK-FE-626/DF-06, GAP-BE-622
 * sub-opção b) — elegibilidade por Centro de Custo do tenant corrente.
 * Resource ENXUTO `{value,label}[]`, envelope FLAT (`ApiResponse::success`,
 * `data` é o array direto, `meta` sempre `null`) — NUNCA inclui
 * `NENHUM(0)` (sentinela client-only de "sem apropriação", não é elegibilidade
 * de Centro de Custo). Deliberadamente SEM cruzar com GAP-528 (suporte real
 * de processamento) — o Front combina esta lista com o filtro de GAP-528 já
 * existente (`appropriation-type-options.ts`), rotulando "(indisponível
 * nesta versão)" os tipos elegíveis mas ainda não funcionais.
 */
export interface AppropriationTypeOption {
  value: AppropriationTypeValue;
  label: string;
}

// ============================================
// SUB-OBJETOS COMPARTILHADOS (Resource real)
// ============================================

export interface InvoiceNamedRef {
  uuid: string;
  name: string;
}

export interface InvoiceDescribedRef {
  uuid: string;
  description: string;
}

export interface InvoiceStateRef {
  uuid: string;
  abbreviation: string;
}

export interface InvoiceHarvestRef {
  uuid: string;
}

// ============================================
// LISTAGEM (`GET /invoices` — InvoiceRepository::listWithFilters, eager-load
// SÓ provider.people+state — ver nota de cabeçalho, SEM proprietary/items/
// expenses)
// ============================================

export interface InvoiceListItem {
  uuid: string;
  number: string;
  series: string;
  dt_emission: string;
  delivery_date: string | null;
  provider?: InvoiceNamedRef;
  state?: InvoiceStateRef;
  type: InvoiceDocumentTypeValue;
  classification: InvoiceClassificationValue | null;
  apportionment_type: InvoiceApportionmentTypeValue;
  vl_total: number;
  code: string | null;
}

// ============================================
// ITEM (ItemInvoiceResource real, dentro de InvoiceDetail.items[])
// ============================================

export interface ItemInvoiceDetail {
  uuid: string;
  product?: InvoiceDescribedRef;
  warehouse?: InvoiceDescribedRef | null;
  quantity: number;
  amount: number;
  total_amount: number;
  discount: number;
  ipi: number | null;
  icms: number | null;
  has_lot: boolean;
  provider_lot: string | null;
  shelf_life: string | null;
  is_equipment: boolean;
  appropriation_type: AppropriationTypeValue | null;
  category?: InvoiceDescribedRef | null;
  cultivation?: { uuid: string } | null;
  center?: { uuid: string } | null;
  measurement?: { uuid: string } | null;
}

// ============================================
// PARCELA (InvoiceExpenseResource real, dentro de InvoiceDetail.expenses[])
// — WRITE-ONLY o rateio, este shape é só o que volta de fato.
// ============================================

export interface InvoiceExpenseDetail {
  uuid: string;
  installment: number;
  due_date: string;
  value: number;
  balance: number;
}

// ============================================
// DETALHE (`GET/POST/PUT /invoices/{uuid}` — InvoiceResource completo)
// ============================================

export interface InvoiceDetail {
  uuid: string;
  number: string;
  series: string;
  dt_emission: string;
  delivery_date: string | null;
  provider?: InvoiceNamedRef;
  state?: InvoiceStateRef;
  proprietary?: InvoiceNamedRef | null;
  harvest?: InvoiceHarvestRef | null;
  type: InvoiceDocumentTypeValue;
  classification: InvoiceClassificationValue | null;
  apportionment_type: InvoiceApportionmentTypeValue;
  conveyor: string | null;
  note: string | null;
  chave: string | null;
  state_registration: string | null;
  vl_items: number;
  vl_freight: number;
  vl_safe: number;
  vl_expense: number;
  vl_ipi: number;
  vl_discount: number;
  vl_total: number;
  code: string | null;
  generate_stock: boolean;
  items?: ItemInvoiceDetail[];
  expenses?: InvoiceExpenseDetail[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface InvoicesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface InvoicesListEnvelope {
  success: boolean;
  message: string;
  data: InvoiceListItem[];
  errors: Record<string, string[]> | null;
  meta: InvoicesApiPaginationMeta | null;
}

// ============================================
// PAYLOAD DE ESCRITA — espelha `InvoiceRequest::rules()` 1:1. SEM
// `payment_id`/`farm_id`/`code`/`vl_total`/`vl_items`/`total_amount`/
// `generate_stock`/`appropriation`/`request_purchase_id` (sempre calculados/
// fixos no servidor).
// ============================================

/**
 * Cascata de criação de Equipment — obrigatória quando `is_equipment===true`.
 *
 * TASK-FE-629/630/631 (DF-10, execução 035) — expandido de 5 para 24 campos
 * (GAP-BE-623/TASK-BE-623, `InvoiceRequest::rules()` real): os ~19 novos
 * campos mirram 1:1 `EquipmentPayload` (`@/@types/v2/Equipments`), MENOS o
 * bloco Fiscal condicional de 12 campos (`type`/`body_type`/`wheel_type`/
 * `tara`/`capacity`/`owner_*` — legado sempre grava `use_fiscal=0` para
 * Equipment nascido de Invoice, então esse bloco nunca se aplica aqui) e
 * MENOS os 4 campos sempre auto-derivados no servidor (`product_uuid`/
 * `provider_uuid`/`use_fiscal` — nem aceitos pelo `InvoiceRequest` neste
 * contexto — e `equipment_type`, fixo `'P'` — Doc.Fiscal só CRIA bens
 * próprios, nunca de terceiro) e os 4 campos calculados/de acréscimo mensal
 * do módulo Equipment (`vl_residual`/`vl_depreciate` — recalculados no
 * servidor, nunca aceitos do payload; `vl_depreciated`/`sd_depreciate`/
 * `current_value` — acréscimo mensal, computados pelo módulo Equipment já
 * existente, fora do escopo de criação).
 */
export interface InvoiceItemEquipmentPayload {
  family_equipment_uuid: string;
  description: string;
  vl_time_productive: number;
  /** Hidden fixo no legado — sempre 0, nunca editável. */
  vl_time_unproductive: number;
  vl_acquisition: number;
  status: number;
  proprietary_uuid?: string | null;
  /** Fixo `'P'` (Próprio) — Doc.Fiscal só cria bens próprios, nunca de terceiro. */
  equipment_type?: 'P' | 'T';
  hour_meter?: number | null;
  year_mod?: string | null;
  brand?: string | null;
  patrimony?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  serie?: string | null;
  plate?: string | null;
  /** Código UF cru (`string`), mirror `EquipmentPayload.uf` — NUNCA `Option<string>`. */
  uf?: string | null;
  color?: string | null;
  model?: string | null;
  has_depreciation?: boolean;
  depreciation_type?: number | null;
  /** `required_if depreciation_type===COM_RESIDUAL(1)` (InvoiceRequest real). */
  residual?: number | null;
  life_bens?: number | null;
  dt_acquisition?: string | null;
  specification?: string | null;
}

export interface InvoiceItemPayload {
  product_uuid: string;
  quantity: number;
  amount: number;
  warehouse_uuid?: string | null;
  center_uuid?: string | null;
  category_uuid?: string | null;
  cultivation_uuid?: string | null;
  measurement_uuid?: string | null;
  is_equipment?: boolean;
  provider_lot?: string | null;
  shelf_life?: string | null;
  ipi?: number | null;
  icms?: number | null;
  discount?: number;
  appropriation_type?: AppropriationTypeValue | null;
  equipment?: InvoiceItemEquipmentPayload | null;
  aprop_equipment_uuid?: string | null;
  aprop_area_uuid?: string | null;
  aprop_activity_uuid?: string | null;
  aprop_operation_uuid?: string | null;
  /** TASK-FE-625/DF-05 (GAP-BE-621/TASK-BE-621) — "Cultura" do bloco
   *  Apropriação Agrícola, DISTINTO de `cultivation_uuid` acima
   *  ("Classificação", campo geral do item). `nullable`, `exists:cultivations,
   *  uuid` (catálogo global, sem escopo de farm/tenant — mesmo contrato de
   *  `cultivation_uuid`). Só é lido pelo backend quando
   *  `appropriation_type=AGRICOLA`; nos demais ramos é aceito mas ignorado. */
  aprop_cultivation_uuid?: string | null;
}

export interface InvoiceInstallmentPayload {
  due_date: string;
  value: number;
}

export interface InvoiceApportionmentPayload {
  category_uuid: string;
  percentage: number;
  /** Obrigatório no contrato real (`expense_category.center_id NOT NULL`). */
  center_uuid: string;
  /** Sem `Rule::exists` no backend — aceita qualquer uuid, sem derivação da
   * Categoria (não há relação Model FinancialCategory→PlanAccount). Coluna
   * "Conta Contábil" OMITIDA da UI nesta v1 (ver `InvoiceApportionmentTab.tsx`). */
  plan_account_uuid?: string | null;
}

export interface InvoicePayload {
  number: string;
  series: string;
  dt_emission: string;
  delivery_date?: string | null;
  provider_uuid: string;
  proprietary_uuid: string;
  state_uuid: string;
  type_title_uuid: string;
  conveyor?: string | null;
  type: InvoiceDocumentTypeValue;
  classification?: InvoiceClassificationValue | null;
  apportionment_type: InvoiceApportionmentTypeValue;
  harvest_uuid?: string | null;
  branch_uuid?: string | null;
  contract_uuid?: string | null;
  vl_freight?: number;
  vl_safe?: number;
  vl_expense?: number;
  vl_ipi?: number;
  vl_discount?: number;
  note?: string | null;
  state_registration?: string | null;
  /**
   * TASK-FE-628 (DF-03, execução 035) — presente SÓ quando o form foi
   * populado a partir de um upload de XML NFe (`InvoiceXmlDraft.chave`,
   * `POST /invoices/parse-xml`, TASK-BE-624). `InvoiceRequest::rules()`
   * aceita `nullable|string|max:44` sempre — quando presente, o `store()`
   * promove o XML staged (`invoices-xml/staging/{chave}.xml`) para
   * definitivo (TASK-BE-625). Omitido (undefined) em criação manual/edição.
   */
  chave?: string | null;
  items: InvoiceItemPayload[];
  /** `sometimes` no update — `UpdateInvoiceAction` IGNORA este array no PUT
   * (Contas a Pagar imutáveis pós-criação); omitido pelo client na edição
   * (ver `CreateOrUpdateInvoice.tsx`), sempre enviado na criação. */
  installments?: InvoiceInstallmentPayload[];
  /** `sometimes` no update — mesmo racional de `installments` acima. */
  categories?: InvoiceApportionmentPayload[];
}

// ============================================
// REACT HOOK FORM (`useForm<InvoiceForm>`) — relacionamentos como
// `Option<string>`, arrays como `useFieldArray`.
// ============================================

/**
 * TASK-FE-629/630/631 (DF-10, execução 035) — mirror do payload expandido
 * (`InvoiceItemEquipmentPayload`, ver nota lá) MENOS `vl_time_unproductive`
 * (fixo 0, sem UI) e `equipment_type` (fixo `'P'`, `InputReadOnly` sem
 * Controller — ver `InvoiceItemEquipmentPanel.tsx`, TASK-FE-648). `uf` guarda o CÓDIGO
 * CRU (`string`), mirror EXATO de `EquipmentForm.uf` — NUNCA `Option<string>`.
 */
export interface InvoiceItemEquipmentForm {
  family_equipment_uuid: Option<string> | null;
  description: string;
  vl_time_productive: number | null;
  vl_acquisition: number | null;
  status: Option<number> | null;
  proprietary_uuid: Option<string> | null;
  hour_meter: number | null;
  year_mod: string | null;
  brand: string | null;
  patrimony: string | null;
  chassi: string | null;
  renavam: string | null;
  serie: string | null;
  plate: string | null;
  uf: string | null;
  color: string | null;
  model: string | null;
  has_depreciation: boolean;
  depreciation_type: number | null;
  residual: number | null;
  life_bens: number | null;
  dt_acquisition: string | null;
  specification: string | null;
}

export interface InvoiceItemForm {
  product_uuid: Option<string> | null;
  quantity: number | null;
  amount: number | null;
  /** TASK-FE-624 (DF-04) — preview client-side de "V. Total(R$)", editável
   * com recálculo bidirecional (`quantity × amount`, SEM desconto — o
   * servidor recalcula e ignora este campo; NUNCA enviado no payload). */
  total_amount: number | null;
  warehouse_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  cultivation_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  generates_stock: boolean;
  /** TASK-FE-627 (DF-09) — sinal client-only (mirror `generates_stock`),
   * derivado de `ProductListItem.has_lot`/`ItemInvoiceDetail.has_lot`;
   * NUNCA enviado no payload. Seedado por `reset()` em modo edição — a
   * causa raiz do achado de E2E era este campo viver só em `useState`
   * local, nunca reidratado. */
  has_lot: boolean;
  is_equipment: boolean;
  provider_lot: string | null;
  shelf_life: string | null;
  ipi: number | null;
  icms: number | null;
  discount: number | null;
  appropriation_type: Option<AppropriationTypeValue> | null;
  equipment: InvoiceItemEquipmentForm | null;
  /** GAP-BE-630/DF-13 (TASK-FE-653) — hint client-only da descrição do item
   *  do XML, preservado SÓ quando o upload de XML não casou o Produto
   *  (`InvoiceXmlDraftItem.product_matched===false`) — exibido ao lado do
   *  Select "Produto" e repassado como prefill ao botão "+ Criar Produto".
   *  NUNCA enviado no payload (não existe em `InvoiceItemPayload`). */
  xml_description: string | null;
  /** GAP-BE-630/DF-13 (TASK-FE-653) — hint client-only do NCM resolvido a
   *  partir do XML (mesma origem acima) — prefill do cadastro de Produto
   *  quando o item não casou. NUNCA enviado no payload (NCM é campo do
   *  Product, não do item da nota). */
  xml_ncm: InvoiceXmlDraftItemNcm | null;
  /** TASK-FE-668 (DF-25, rework, execução 034) — texto CRÚ da unidade do
   *  XML (`InvoiceXmlDraftItem.um`), preservado SÓ quando o Produto NÃO
   *  casou (mirror EXATO de `xml_description`/`xml_ncm` acima) — prefill de
   *  "1ª Un. Medida" no Modal "Criar Produto a partir do XML"
   *  (`suggestMeasurementOption`, MESMA função já usada para o
   *  `measurement_uuid` deste item). NUNCA enviado no payload. */
  xml_um: string | null;
  /** TASK-FE-625/DF-05 — "Cultura" do bloco Apropriação Agrícola, DISTINTO
   *  de `cultivation_uuid` acima ("Classificação"). */
  aprop_cultivation_uuid: Option<string> | null;
  aprop_area_uuid: Option<string> | null;
  /** `id` numérico embutido pelo `mapOptions` do Select (mirror
   *  `OperationListItem`/`TASK-FE-601`) — necessário para o filtro
   *  `operation_id` (int) de `listActivities` na cascata Operação→Atividade. */
  aprop_operation_uuid: (Option<string> & { id?: number }) | null;
  aprop_activity_uuid: Option<string> | null;
}

export interface InvoiceInstallmentForm {
  due_date: string | null;
  value: number | null;
}

export interface InvoiceApportionmentForm {
  category_uuid: Option<string> | null;
  percentage: number | null;
  center_uuid: Option<string> | null;
}

export interface InvoiceForm {
  number: string;
  series: string;
  dt_emission: string | null;
  delivery_date: string | null;
  provider_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  state_uuid: Option<string> | null;
  type_title_uuid: Option<string> | null;
  conveyor: string | null;
  type: Option<InvoiceDocumentTypeValue> | null;
  classification: Option<InvoiceClassificationValue> | null;
  apportionment_type: Option<InvoiceApportionmentTypeValue> | null;
  harvest_uuid: Option<string> | null;
  note: string | null;
  state_registration: string | null;
  vl_freight: number | null;
  vl_safe: number | null;
  vl_expense: number | null;
  vl_ipi: number | null;
  vl_discount: number | null;
  /** TASK-FE-628 (DF-03) — campo client-only, sem UI própria, seedado pelo
   * import de XML (ver nota de `InvoicePayload.chave`); nunca digitado
   * manualmente. */
  chave: string | null;
  items: InvoiceItemForm[];
  installments: InvoiceInstallmentForm[];
  categories: InvoiceApportionmentForm[];
}

// ============================================
// XML DRAFT (`POST /invoices/parse-xml` — TASK-BE-624/TASK-FE-628, DF-03)
// Preview STATELESS extraído do XML de NFe, SEM persistir nada — o Front
// usa este shape para `reset()` do form raiz de Invoice. NUNCA reaproveitar
// `InvoiceDetail` (este draft não tem `uuid` de Invoice real).
// ============================================

export interface InvoiceXmlDraftProviderRef {
  uuid: string | null;
  matched: boolean;
  nif: string;
  name: string;
}

export interface InvoiceXmlDraftProprietaryRef {
  uuid: string | null;
  matched: boolean;
  nif: string;
}

/** GAP-BE-630 — NCM resolvido por código EXATO contra o catálogo global
 *  `ncms`, hint para o cadastro de Produto (`ncm_id` é campo do **Product**,
 *  nunca de `item_invoices`) — `null` no `InvoiceXmlDraftItem.ncm` quando
 *  não houver match (nunca fuzzy, nunca cria NCM). */
export interface InvoiceXmlDraftItemNcm {
  uuid: string;
  code: string;
  description: string;
}

export interface InvoiceXmlDraftItem {
  product_uuid: string | null;
  product_matched: boolean;
  description: string;
  quantity: number;
  amount: number;
  discount: number;
  total_amount: number;
  /** Fidelidade EXATA ao legado — sempre `0` (ver `InvoiceXmlDraftItemData` do backend). */
  ipi: number;
  icms: number;
  /** GAP-BE-630 (DF-13) — texto CRÚ da unidade do XML (`prod.uCom`
   *  prioritário sobre `prod.uTrib`), SEM resolução/normalização
   *  server-side. Front usa como SUGESTÃO de `measurement_uuid` (fuzzy/
   *  exato contra `Measurement.name`, a sigla) — nunca força quando não
   *  casar. */
  um: string;
  /** GAP-BE-630 (DF-13) — ver `InvoiceXmlDraftItemNcm`. */
  ncm: InvoiceXmlDraftItemNcm | null;
  warehouse_uuid: string | null;
  has_lot: boolean;
}

export interface InvoiceXmlDraftInstallment {
  due_date: string;
  value: number;
}

export interface InvoiceXmlDraft {
  number: string;
  series: string;
  dt_emission: string;
  /** Chave NF-e (44 dígitos) — idempotência (`store()` bloqueia duplicata). */
  chave: string;
  note: string | null;
  state_registration: string | null;
  vl_items: number;
  vl_freight: number;
  vl_safe: number;
  vl_ipi: number;
  vl_total: number;
  vl_discount: number;
  state_uuid: string | null;
  provider: InvoiceXmlDraftProviderRef;
  proprietary: InvoiceXmlDraftProprietaryRef;
  items: InvoiceXmlDraftItem[];
  installments: InvoiceXmlDraftInstallment[];
}

// ============================================
// FILTRO (drawer da listagem — `InvoiceIndexRequest::rules()`)
// ============================================

export interface InvoiceFilterForm {
  number?: string;
  provider_id?: string;
  dt_emission_from?: string;
  dt_emission_to?: string;
  product_id?: string;
  proprietary_id?: string;
  vl_total?: number;
}
