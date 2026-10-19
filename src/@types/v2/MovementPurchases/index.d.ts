// src/@types/v2/MovementPurchases/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de COMPRA DE ANIMAIS (MovementPurchase — Operacional >
// Pecuária, TASK-CP-04, fundação). Mirror estrutural de `@/@types/v2/
// MovementSales` (precedente aceito, contrato-frontend-compras-movimento.md
// §3) — venda↔compra são domínios distintos, aqui só a FORMA é copiada.
//
// Fonte: confirmado campo a campo contra o código REAL da API (`GB.Cerne.Api`,
// branch `feature/refactor-movement-purchase-and-breeding-batch-for-api`),
// não a inferência do contrato:
//   app/Http/Resources/V1/MovementPurchaseResource.php (leitura — list + detail)
//   app/Http/Requests/Api/V1/MovementPurchaseRequest.php (escrita — regras)
//   app/Data/MovementPurchase/{MovementPurchaseData,MovementPurchaseItemData,
//     MovementPurchaseFilterData}.php (DTOs de transporte)
//   app/Repositories/MovementPurchaseRepository.php (`listWithFilters`/
//     `findByUuidOrFail` — eager load real)
//
// ACHADOS DE FIDELIDADE (confirmados contra o código real, "confirmar contra
// o código" — contrato-frontend-compras-movimento.md, não Gap de arquitetura):
//
//   1. `MovementPurchaseListItem` NÃO tem `seller`/`items`/`documents`.
//      `MovementPurchaseRepository::listWithFilters()` só eager-carrega
//      `['provider.people', 'farm']` — `seller`/`items`/`documents` são
//      `whenLoaded()` no Resource e por isso vêm `null` na listagem (SEM
//      MOCK — não fabricamos dado ausente). `findByUuidOrFail()` (detalhe)
//      já carrega `items.category/batch/grazing/center`, `documents`,
//      `provider.people`, `seller.people`, `farm`, `expenses` — só no
//      detalhe os 3 campos vêm populados (`MovementPurchaseDetail`, abaixo).
//   2. **DIVERGÊNCIA REAL vs. contrato-frontend §4.1** — o contrato de
//      frontend (§4.1) instrui renderizar os 15 campos fiscais
//      (`cst_*`/`perc_*`/`origem`/`cest`/`cenq_ipi`/`red_bc`/`vbc`/`cfop`/
//      `ncm`) por item num sub-bloco "Dados Fiscais (NFe)". O contrato de
//      API (§5) também afirma que esses campos "entram no `$fillable` novo
//      do Model". **Confirmado contra o código real desta Tarefa**:
//      `MovementPurchaseItemData` (DTO de escrita) e
//      `MovementPurchaseRequest::rules()` (validação) **não incluem NENHUM
//      dos 15 campos fiscais** — só `category_uuid`/`batch_uuid`/
//      `grazing_uuid`/`center_uuid`/`quantity`/`value_unit`/`amount`/`note`/
//      `item_description`. Ou seja, mesmo que o Model aceite esses atributos
//      via `$fillable`, a ROTA DE ESCRITA REAL (Request→DTO→Action) não os
//      aceita hoje — não há como o cliente enviá-los. `MovementPurchaseItem`/
//      `MovementPurchaseItemPayload` abaixo refletem o DTO REAL (sem os 15
//      campos fiscais). Registrado para `TASK-CP-06` confirmar/reabrir com o
//      Arquiteto antes de construir o sub-bloco "Dados Fiscais (NFe)" do §4.1
//      — não é Gap desta Tarefa (que não constrói o form de itens), é uma
//      nota de fidelidade herdada para a Tarefa que vai consumir isto.
//   3. `type_payment` é `string` livre no DTO de escrita (`MovementPurchaseData
//      ::type_payment`, `MovementPurchaseRequest::rules()` só
//      `required|string|max:2`) — catálogo local sem endpoint de opções
//      (mirror `movementSaleTypePaymentOptions`), mesmo enum físico
//      (`App\Enums\Nfe\NfeTypePaymentEnum`, 15 códigos SEFAZ).
//   4. Filtros reais (`MovementPurchaseFilterData`, `#[MapInputName(
//      SnakeCaseMapper::class)]`): `search`/`providerUuid`/`startDate`/
//      `endDate` — os 4 SÃO aplicados de fato em
//      `MovementPurchaseRepository::listWithFilters()` (`ILIKE code`,
//      `whereHas('provider', uuid)`, `dt_sale >=/<=`), DIFERENTE do achado
//      de Vendas (`GAP-VD-02`, filtros mortos) — aqui os 4 filtram.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENTIDADES ANINHADAS (leitura)
// ============================================

export interface MovementPurchaseProviderRef {
  uuid: string;
  name: string | null;
}

export interface MovementPurchaseSellerRef {
  uuid: string;
  name: string | null;
}

export interface MovementPurchaseCategoryRef {
  uuid: string;
  description: string | null;
}

export interface MovementPurchaseBatchRef {
  uuid: string;
  description: string | null;
}

export interface MovementPurchaseGrazingRef {
  uuid: string;
  description: string | null;
}

export interface MovementPurchaseCenterRef {
  uuid: string;
  description: string | null;
}

// ============================================
// ITEM (leitura — `MovementPurchaseResource.items[]`, whenLoaded só no
// detalhe). Achado #2 do docblock de topo — sem os 15 campos fiscais (não
// existem na rota de escrita real hoje).
// ============================================

export interface MovementPurchaseItem {
  category: MovementPurchaseCategoryRef | null;
  batch: MovementPurchaseBatchRef | null;
  grazing: MovementPurchaseGrazingRef | null;
  center: MovementPurchaseCenterRef | null;
  quantity: number;
  value_unit: number;
  amount: number;
  note: string | null;
  /** Só populado em compras vindas de import XML (`chave` setada) — mirror
   *  do achado de `MovementSaleItem`. */
  item_description: string | null;
}

// ============================================
// DOCUMENTOS (leitura — `MovementPurchaseResource.documents[]`, whenLoaded
// só no detalhe, `POST .../documents`, `TASK-CP-08`).
// ============================================

export interface MovementPurchaseDocumentItem {
  uuid: string;
  description: string | null;
  date: string | null;
  anexo: string | null;
}

// ============================================
// DOCUMENTOS (escrita, TASK-CP-08) — `POST .../{uuid}/documents`. Shape de
// TELA (mirror `MovementSaleDocumentRow`), mas o WIRE FORMAT real diverge de
// Vendas: `MovementPurchaseDocumentRequest::rules()` (confirmado no código
// real) espera arrays PARALELOS `description[]`/`anexo[]`/`date[]`/
// `old_document[]` correlacionados por ÍNDICE (mirror do
// `Admin\MovementPurchaseDocumentController` legado) — NÃO o shape aninhado
// `documents[i][chave]` de `MovementSaleDocumentRequest`. Ver
// `movement-purchase-service.ts::buildMovementPurchaseDocumentsFormData`.
// ============================================

export interface MovementPurchaseDocumentRow {
  /** Presente = linha já persistida (`documents[].uuid` do detalhe); ausente
   *  = linha nova. `StoreMovementPurchaseDocumentsAction` (real) só EXIGE
   *  `file` quando a linha é nova — para linha já persistida sem arquivo
   *  novo selecionado, a descrição/data são atualizadas e o `anexo` atual é
   *  preservado (`isset($anexos[$index])`, confirmado no código real). */
  old_document_uuid: string | null;
  description: string;
  /** `YYYY-MM-DD` ou `null` — vazio, o servidor aplica `now()` (linha nova). */
  date: string | null;
  /** `mimes:pdf`, `max:2048` (2 MB) — mesmo limite de `MovementSaleDocumentRow`. */
  file: File | null;
}

export interface MovementPurchaseDocumentsForm {
  documents: MovementPurchaseDocumentRow[];
}

// ============================================
// LISTAGEM — `GET /movement-purchases`
// (`MovementPurchaseRepository::listWithFilters()`, eager-load
// `['provider.people','farm']` — SEM `seller`/`items`/`documents`,
// achado #1 acima).
// ============================================

export interface MovementPurchaseListItem {
  uuid: string;
  code: string;
  /** Código livre (`App\Enums\Nfe\NfeTypePaymentEnum`, 15 valores SEFAZ,
   *  `movementPurchaseTypePaymentOptions`), sempre presente (nunca
   *  `whenLoaded`). */
  type_payment: string | null;
  dt_sale: string; // YYYY-MM-DD
  provider: MovementPurchaseProviderRef | null;
  /** Ausente na listagem (achado #1) — `whenLoaded('seller')` não carregado
   *  por `listWithFilters()`. Fica `null` até a tela de Detalhe. */
  seller: MovementPurchaseSellerRef | null;
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  /** Chave de acesso da NFe (44 dígitos) quando a compra veio de import XML
   *  — usada como fonte da coluna "NFe" (ícone condicional, LST-06). */
  chave: string | null;
  serie: string | null;
  number: string | null;
  gtas: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  /** T6 (088) — processamento vinculado FINALIZADO: bloqueia editar/excluir.
   *  Presente na listagem e no detalhe (aditivo na API); ausente = não
   *  informado (nunca presumido bloqueado). */
  finished_processing?: boolean;
}

// ============================================
// DETALHE — `GET /movement-purchases/{uuid}` (`findByUuidOrFail()`,
// eager-load completo: `items.category/batch/grazing/center`, `documents`,
// `provider.people`, `seller.people`, `farm`, `expenses`).
// ============================================

// ---------------------------------------------------------------------------
// 088 D3-FE-T1 — SHOW §2.3 (plano API): bloco `financial` completo. Tipos
// ESTRITOS do shape novo (consumido por `movementPurchaseFinancialToForm`,
// D3-FE-T4). O shape legado (categoria/centro sem valor) foi removido.
// Dinheiro `number` (2 casas), `%` `number` (2 casas), datas `yyyy-MM-dd`.
// ---------------------------------------------------------------------------

export type MovementPurchaseClassification = 'N' | 'C' | 'O';

export interface MovementPurchaseShowTypeTitle {
  uuid: string;
  description: string | null;
}

export interface MovementPurchaseShowProprietary {
  uuid: string;
  name: string | null;
}

export interface MovementPurchaseShowInput {
  due_date: string;
  amount: number;
}

export interface MovementPurchaseShowGenerator {
  installments_count: number;
  first_due_date: string | null;
  interval_days: number;
}

export interface MovementPurchaseShowInstallment {
  uuid: string;
  installment: number;
  due_date: string | null;
  amount: number;
  has_write_off: boolean;
}

export interface MovementPurchaseShowAllocation {
  financial_category: { uuid: string; description: string | null };
  plan_account: { uuid: string; code: string | null; description: string | null } | null;
  cost_center: { uuid: string; description: string | null };
  value: number;
  percent: number;
}

export interface MovementPurchaseShowFinancial {
  number: string;
  type_title: MovementPurchaseShowTypeTitle | null;
  proprietary: MovementPurchaseShowProprietary | null;
  note: string | null;
  fiscal_document: boolean;
  classification: MovementPurchaseClassification;
  has_input: boolean;
  input: MovementPurchaseShowInput | null;
  generator: MovementPurchaseShowGenerator;
  installments: MovementPurchaseShowInstallment[];
  allocations: MovementPurchaseShowAllocation[];
  allocations_total: number;
  installments_total: number;
}

export interface MovementPurchaseDetail extends MovementPurchaseListItem {
  items: MovementPurchaseItem[];
  documents: MovementPurchaseDocumentItem[];
  /** T-API-01 — existe Expense gerado para a compra. */
  has_financial?: boolean;
  financial?: MovementPurchaseShowFinancial | null;
  /** Responsável ORIGINAL (usuário que registrou a compra). */
  user?: { uuid: string; name: string | null } | null;
}

// ============================================
// FILTRO (drawer da listagem) — 4 filtros REAIS (achado #4 do topo,
// DIFERENTE de Vendas/`GAP-VD-02`): `search`/`provider_uuid`/`start_date`/
// `end_date` TODOS filtram de fato em `listWithFilters()`.
// ============================================

export interface MovementPurchaseFilterForm {
  search?: string;
  provider_uuid?: string;
  /** Companion DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`,
   *  nunca vai ao service — mirror `client_label` de Vendas. */
  provider_label?: string;
  start_date?: string;
  end_date?: string;
}

// Forma enviada à querystring (`MovementPurchaseFilterData`, `MapInputName`
// snake_case: `search`/`providerUuid`→`provider_uuid`/`startDate`→
// `start_date`/`endDate`→`end_date`).
export interface MovementPurchaseFilterRequest {
  search?: string;
  provider_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// ESCRITA (`MovementPurchaseData`/`MovementPurchaseItemData`, confirmado
// contra o DTO real — TASK-CP-04, fundação; consumido pelo form de
// `TASK-CP-06`/`07`). `farm_id`/`tenant_id`/`user_id`/`code`/`employee_id`
// NUNCA aparecem aqui — resolvidos/calculados pela Action orquestradora.
// ============================================

export interface MovementPurchaseItemPayload {
  category_uuid: string;
  batch_uuid?: string;
  grazing_uuid?: string;
  center_uuid?: string;
  quantity: number;
  value_unit: number;
  amount: number;
  note?: string;
  item_description?: string;
}

// 088 D3-FE-T1 — bloco `financial` do POST/PUT (§2.1 plano API / §4.6 plano FE).
export interface MovementPurchaseFinancialInputPayload {
  due_date: string;
  amount: number;
}

export interface MovementPurchaseFinancialInstallmentPayload {
  due_date: string;
  amount: number;
}

export interface MovementPurchaseFinancialAllocationPayload {
  financial_category_uuid: string;
  plan_account_uuid: string | null;
  cost_center_uuid: string;
  value: number;
  percent: number;
}

export interface MovementPurchaseFinancialBlock {
  number: string;
  type_title_uuid: string;
  proprietary_uuid: string | null;
  note: string;
  fiscal_document: boolean;
  classification: MovementPurchaseClassification;
  has_input: boolean;
  /** Só com `has_input=true` (com `false` a chave NÃO é enviada). */
  input?: MovementPurchaseFinancialInputPayload;
  /** Inclui a entrada como 1º elemento quando `has_input=true`. */
  installments: MovementPurchaseFinancialInstallmentPayload[];
  allocations: MovementPurchaseFinancialAllocationPayload[];
}

export interface MovementPurchasePayload {
  dt_sale: string;
  provider_uuid: string;
  seller_uuid?: string;
  chave?: string;
  serie?: string;
  number?: string;
  gtas?: string;
  // 088 — omitido sem financeiro (a API assume "90" na criação / preserva no update).
  type_payment?: string;
  note?: string;
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  items: MovementPurchaseItemPayload[];
  has_financial?: boolean;
  financial?: MovementPurchaseFinancialBlock;
}

// ============================================
// FORMULÁRIO (react-hook-form, `TASK-CP-06`/`07`) — shape de TELA (`Option<>`
// nos selects), distinto do shape de FIO (`MovementPurchase*Payload` acima).
// Declarado aqui por instrução da fundação (contrato §3) — só o CABEÇALHO é
// consumido nesta Tarefa (schema Yup, `movement-purchase-schema.ts`); `items`/
// `financial_*` são completados por `TASK-CP-06`/`07`.
// ============================================

export interface MovementPurchaseItemForm {
  category_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  grazing_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  quantity: number | null;
  value_unit: number | null;
  amount: number | null;
  note: string;
  /** Readonly — só populado/exibido quando a compra veio de import XML
   *  (`chave` setada), mirror `MovementSaleItemForm`. */
  item_description: string | null;
  /** Linha de base fiscal (XML importado / compra salva com chave): enquanto
   *  quantidade e valor unitário permanecerem iguais, o `amount` da nota é
   *  preservado; ao editar a quantidade recalcula qtd × unit (paridade com o
   *  blur do legado). Ausente em item manual. */
  fiscal_baseline?: { quantity: number; value_unit: number; amount: number } | null;
}

// ---------------------------------------------------------------------------
// Subfluxo FINANCEIRO — shape de TELA (088 D3-FE-T1/T4). Dinheiro em reais
// (`number`, 2 casas) no estado do RHF; todo cálculo converte para centavos
// inteiros em `movementPurchaseFinancialMath.ts`. O shape do fio (§2.1 da API)
// é montado por `buildMovementPurchaseFinancialPayload`.
// ---------------------------------------------------------------------------

/** Origem da linha: entrada (somente leitura), gerada, gravada, XML ou editada à mão. */
export type MovementPurchaseInstallmentOrigin = 'input' | 'generated' | 'stored' | 'xml' | 'manual';

export interface MovementPurchaseFinInstallmentRow {
  due_date: string | null;
  amount: number | null;
  origin: MovementPurchaseInstallmentOrigin;
}

export interface MovementPurchaseFinAllocationRow {
  category: Option<string> | null;
  plan_account: Option<string> | null;
  center: Option<string> | null;
  percent: number | null;
  value: number | null;
}

/** Gerador de parcelas (S4): estado de tela, nunca vai ao fio. */
export interface MovementPurchaseInstallmentGeneratorForm {
  count: number | null;
  first_due_date: string | null;
  interval_days: number | null;
}

/** Cabeçalho financeiro (S2a-S5b + entrada). `MovementPurchaseForm` o estende. */
export interface MovementPurchaseFinancialHeaderForm {
  financial_number: string;
  financial_type_title: Option<string> | null;
  financial_proprietary: Option<string> | null;
  financial_note: string;
  /** `null` = "Selecione" (create). */
  financial_has_input: boolean | null;
  financial_input_date: string | null;
  financial_input_value: number | null;
  financial_fiscal_document: boolean;
  financial_classification: MovementPurchaseClassification;
}

export interface MovementPurchaseForm extends MovementPurchaseFinancialHeaderForm {
  /** Readonly sempre — vazio até o servidor devolver o `code` real no
   *  primeiro `POST` (create) ou o valor existente (edit). */
  code: string;
  dt_sale: string;
  provider_uuid: Option<string> | null;
  seller_uuid: Option<string> | null;
  /** `MovementPurchaseRequest::rules()` REAL aceita os 3 (`sometimes|
   *  nullable|digits:44`/`string`) e `MovementPurchaseResource` os expõe
   *  incondicionalmente (achado #4, `MovementPurchaseListItem`) —
   *  DIFERENTE de `MovementSaleForm` (onde os 3 equivalentes NÃO existem no
   *  Resource e só são populados por import XML). Por isso, aqui, os 3 são
   *  EDITÁVEIS no cabeçalho (`TASK-CP-06`), não gateados por
   *  `!!watch('chave')`. */
  chave: string | null;
  serie: string | null;
  number: string | null;
  type_payment: Option<string> | null;
  gtas: string;
  note: string;
  total_products: number;
  freight: number;
  other_values: number;
  discount: number;
  total: number;
  items: MovementPurchaseItemForm[];
  has_financial: boolean;
  /** Só relevantes quando `has_financial === true`. */
  financial_installments: MovementPurchaseFinInstallmentRow[];
  financial_allocations: MovementPurchaseFinAllocationRow[];
  /** D2 (088) — alguma parcela já baixada: o bloco financeiro não é validado
   *  nem editável (a API bloqueia mudança). Estado de tela, nunca vai ao fio. */
  financial_write_off: boolean;
  /** Gerador de parcelas (`generator.count|first_due_date|interval_days`) — estado de tela. */
  generator: MovementPurchaseInstallmentGeneratorForm;
}

// Option helper (Select) — reexport de conveniência para as telas do módulo.
export type MovementPurchaseTypePaymentOption = Option<string>;
