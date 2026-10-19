// src/@types/v2/Financeiro/expense/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contas a Pagar" (Expense) — API v1 do backend Laravel
// GB.Cerne, esteira 036 (TASK-FE-036-101). Contrato lido DIRETO do código
// real (`ExpenseController`/`ExpenseRequest`/`ExpenseIndexRequest`/
// `ExpenseResource`/Enums `App\Enums\Expense\*`), não só da Doc Bruta —
// mirror do racional já registrado em `contrato-tela-v1.md` §4.
//
// Divergências reais confirmadas por leitura direta (GB.Cerne.Api):
//   - `payment_type` é int-backed (`ExpensePaymentTypeEnum`: 1=PARCELA_UNICA,
//     2=PARCELADA, 3=RECORRENTE, 4=ADIANTAMENTO, 5=FATURA) — NUNCA string.
//   - `recurrence_type` é int-backed (`ExpenseRecurrenceTypeEnum`: 0=SEMANAL,
//     1=MENSAL, 3=TRIMESTRAL, 12=ANUAL — NÃO sequencial, mirror literal do
//     legado), `required` só quando `payment_type=RECORRENTE(3)`.
//   - `classification` é `character(1)` (`ExpenseClassificationEnum`:
//     'N'|'C'|'O'), default 'N' — MESMO domínio de `invoices.classification`.
//   - `appropriation` aceita SÓ `1|2` (`Rule::in([1,2])`, GAP-FE-036-101
//     Opção B) — 2 = "sem apropriação" (default). `appropriation_type` é
//     `integer` nullable livre (sem `exists`), NÃO usado nesta v1 (UI
//     omitida, EXTENSION POINT — orquestração Expense↔Appropriation fica
//     para Tarefa futura fora da faixa 100-199).
//   - `GET /expenses` (index) eager-carrega SÓ `provider`+`type`
//     (`ExpenseRepository::listWithFilters`) — `branch`/`proprietary`/
//     `harvest`/`categories`/`write_offs` NUNCA vêm na listagem, só no
//     `show`/`store`/`update` (achado real, SEM MOCK — `ExpenseListItem` não
//     modela esses campos, ao contrário do que uma leitura só da Doc Bruta
//     sugeriria).
//   - `categories[]` (rateio) VOLTA do backend em `show`/`store`/`update`
//     (`ExpenseResource`, `whenLoaded('categories')`) — DIFERENTE do mirror
//     `Invoices`/`InvoiceApportionmentPayload` (write-only lá). Aqui é
//     editável em edição, bloqueada só quando há baixa (GAP-FE-036-103).
//   - `categories[].harvest_id`/`.area_id` — a `ExpenseResource` devolve
//     esses 2 campos com sufixo `_id` (não `_uuid`), assimetria real vs. o
//     payload de escrita (`categories[].harvest_uuid`/`.area_uuid`) — não é
//     erro de digitação deste arquivo, é o shape real do backend.
//   - `document_ids[]` é array de `integer` (id legado do model `Document`,
//     que não tem `uuid`) — exceção documentada à convenção "uuid, nunca
//     id" (Contrato de Tela §4.3), só em criação.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';
// TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — reaproveita o
// MESMO union type de `status` do `Appropriation` real (`app/@types/v2/
// Appropriations/index.d.ts`), nunca duplicado — o `appropriation_generated`
// devolvido por `ExpenseResource` é o MESMO Model, só serializado enxuto
// ({uuid,code,status}).
import type { AppropriationStatusValue } from '@/@types/v2/Appropriations';

// ============================================
// ENUMS (backed, ground truth `app/Enums/Expense/*.php`)
// ============================================

/** `ExpensePaymentTypeEnum` — 1=Parcela Única, 2=Parcelada, 3=Recorrente,
 *  4=Adiantamento, 5=Fatura. */
export type ExpensePaymentTypeValue = 1 | 2 | 3 | 4 | 5;

/** `ExpenseRecurrenceTypeEnum` — 0=Semanal, 1=Mensal, 3=Trimestral,
 *  12=Anual (NÃO sequencial, mirror literal do legado). */
export type ExpenseRecurrenceTypeValue = 0 | 1 | 3 | 12;

/** `ExpenseClassificationEnum` — 'N'=Não classificado (default),
 *  'C'=CAPEX, 'O'=OPEX. */
export type ExpenseClassificationValue = 'N' | 'C' | 'O';

/** `Rule::in([1,2])` — flag legado, NUNCA booleano 0/1. 1 = Direta,
 *  2 = Indireta (default histórico, GAP-FE-036-101 Opção B). Modalidade
 *  Direta liga o Select "Tipo" (`appropriation_type`) — TASK-FE-036-123/124,
 *  B-09 Opção C parcial (`GAP-036-115`). */
export type ExpenseAppropriationValue = 1 | 2;

/** `App\Enums\Expense\ExpenseAppropriationTypeEnum` (ground truth,
 *  TASK-BE-036-124/`03da05269`) — 1=AGRICULTURA (orquestra `Appropriation`
 *  real, TASK-FE-036-124), 2=PECUARIA (bloqueado 422, dependência de
 *  migração `Pasture`), 3=AREA (já suportado pelo rateio, `categories.
 *  *.area_uuid`), 4=MANUTENCAO (bloqueado 422, dependência de migração
 *  `appropriation_maintenance`). `requiredIf appropriation===1`
 *  (`ExpenseRequest::rules()`). */
export type ExpenseAppropriationTypeValue = 1 | 2 | 3 | 4;

/** `Rule::in([1..8])` — 8 estados derivados de `Expense::opStatus()`
 *  (legado), FILTRO server-side novo (`ExpenseRepository::listWithFilters`,
 *  TASK-BE-036-116/TASK-FE-036-115) — INDEPENDENTE do badge client-side de 4
 *  estados da grid (`utils/expense-status.ts`, GAP-FE-036-108). Os dois NÃO
 *  precisam bater 1:1 (divergência conhecida, registrada na Tarefa). */
export type ExpenseStatusFilterValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ============================================
// SUB-OBJETOS COMPARTILHADOS (Resource real)
// ============================================

export interface ExpenseNamedRef {
  uuid: string;
  name: string;
}

export interface ExpenseDescribedRef {
  uuid: string;
  description: string;
}

export interface ExpenseHarvestRef {
  uuid: string;
  /** GAP-API resolvido (esteira 036fix) — `ExpenseResource::harvest` agora
   *  devolve `description` (mirror `type`/`provider`/`proprietary`, Lei 10),
   *  eager-loaded tanto no `index` quanto no `show`/`store`/`update`
   *  (`ExpenseRepository::listWithFilters`/`findByApiUuidOrFail`). O front
   *  reidrata o label do Select "Safra" com este campo — NUNCA mais o uuid
   *  cru (achado real do audit `audit-contas-a-pagar.md`, item E-12). */
  description: string;
}

// ============================================
// RATEIO (`categories[]`) — VOLTA do backend em show/store/update
// (whenLoaded), EDITÁVEL em edição (GAP-FE-036-102/103).
// ============================================

export interface ExpenseApportionmentRowDetail {
  category: ExpenseDescribedRef;
  value: number;
  center: ExpenseDescribedRef | null;
  plan_account: ExpenseDescribedRef | null;
  /** TASK-FE-036-123 (Inspeção Obrigatória item 1) — o tipo anterior
   *  declarava `harvest_id`/`area_id` (string sufixo `_id`); confirmado por
   *  leitura direta de `ExpenseResource::categories` (`GB.Cerne.Api`,
   *  `app/Http/Resources/V1/ExpenseResource.php`) que o Resource REAL expõe
   *  objeto `{uuid, description}` (Lei 10 — nunca id/uuid cru), MESMO shape
   *  de `category`/`center`/`plan_account` acima — não os campos `_id`
   *  string que este arquivo assumia antes (achado real, corrigido). */
  area: ExpenseDescribedRef | null;
  harvest: ExpenseDescribedRef | null;
}

// ============================================
// HISTÓRICO DE BAIXAS (`write_offs[]`) — SEMPRE read-only, só em
// show/store/update (whenLoaded).
// ============================================

export interface ExpenseWriteOffDetail {
  uuid: string;
  amount: number;
  date_movement: string | null;
  net_value: number;
  /** TASK-FE-036-113 (LM12) — `ExpenseResource::write_offs` sempre inclui a
   *  conta da baixa (`whenLoaded('account')`, `ExpenseRepository` carrega
   *  `writeOffs.account` tanto no `index` quanto no `show`/`store`/
   *  `update`); `null` só no caso raro de a baixa não ter conta vinculada.
   *  Shape real do Resource é `{uuid, description}` (Account usa
   *  `description`, NÃO `name` — diferente de `provider`/`proprietary`). */
  account?: ExpenseDescribedRef | null;
}

// ============================================
// LISTAGEM (`GET /expenses` — ExpenseRepository::listWithFilters, eager-load
// SÓ provider+type — SEM branch/proprietary/harvest/categories/write_offs)
// ============================================

export interface ExpenseListItem {
  uuid: string;
  number: string;
  code: string | null;
  note: string | null;
  type_note: number | null;
  type?: ExpenseDescribedRef | null;
  provider?: ExpenseNamedRef | null;
  /** DEC-115/TASK-BE-036-128 (`34c1f305e`) — `ExpenseResource::farm`
   *  (`whenLoaded('farm')`) identifica a fazenda de CADA título na listagem,
   *  presente tanto no modo fazenda-ativa quanto em `?all_farms=1`
   *  (`ExpenseRepository::applyFilters` já eager-carrega `farm` sempre — o
   *  backend não condiciona a presença ao modo de visão). `null` só no caso
   *  de o título não ter fazenda resolvível; front só renderiza, nunca
   *  filtra/valida cross-tenant (responsabilidade do backend). */
  farm?: { uuid: string; description: string } | null;
  /** TASK-FE-036-113 (LM06) — `ExpenseRepository::listWithFilters` agora
   *  eager-carrega `proprietary.people` no `index` (esteira 036, ONDA 2).
   *  `undefined`/`null` só se a Expense não tiver proprietário vinculado —
   *  NUNCA indica ausência do campo no contrato. */
  proprietary?: ExpenseNamedRef | null;
  classification: ExpenseClassificationValue | null;
  payment_type: ExpensePaymentTypeValue | null;
  recurrence_type: ExpenseRecurrenceTypeValue | null;
  fiscal_document: boolean;
  is_taxation: boolean;
  card_bill_financing: boolean;
  dt_emission: string | null;
  due_date: string | null;
  dt_discharge: string | null;
  amount: number;
  balance: number;
  discount: number;
  penalty: number;
  interest: number;
  perc_interest: number;
  increase: number;
  qtd_installments: number | null;
  installment: number | null;
  appropriation: ExpenseAppropriationValue | null;
  appropriation_type: number | null;
  /** TASK-FE-036-113 (LM12) — `ExpenseRepository::listWithFilters` agora
   *  eager-carrega `writeOffs` (SÓ baixas ATIVAS, `canceled_at IS NULL`,
   *  mais recente primeiro) no `index`, mesmo bloco de serialização do
   *  `show` (`ExpenseResource::write_offs`, `whenLoaded`). `undefined`/`[]`
   *  quando o título não tem baixa (ou a API ainda não expõe o campo —
   *  transição segura enquanto a Tarefa de API não landa). */
  write_offs?: ExpenseWriteOffDetail[];
  /** LM01 (TASK-FE-036-120) — contagem de documentos anexados
   *  (`withCount('documents')`, GB-04), sempre `number` (fallback `0`, nunca
   *  `null`) — mirror `IncomeListItem.documents_count`. */
  documents_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// DETALHE (`GET/POST/PUT /expenses/{uuid}` — ExpenseResource completo,
// eager-load provider+branch+proprietary+type+harvest+categories+write_offs)
// ============================================

export interface ExpenseDetail extends Omit<ExpenseListItem, 'type' | 'provider'> {
  type: ExpenseDescribedRef | null;
  provider: ExpenseNamedRef | null;
  branch: ExpenseNamedRef | null;
  proprietary: ExpenseNamedRef | null;
  harvest: ExpenseHarvestRef | null;
  /** Só presente quando eager-loaded (show/store/update) — ausente
   *  (`undefined`) na listagem, NUNCA `null` (chave omitida pelo
   *  `whenLoaded`). */
  categories?: ExpenseApportionmentRowDetail[];
  write_offs?: ExpenseWriteOffDetail[];
  /** B-05 (TASK-FE-036-121/340) — presente só quando o título foi criado a
   *  partir de um XML importado (`ParseExpenseNfseXmlAction`/
   *  `StoreExpenseAction`, `fd57e50db`); gate do link "Baixar XML"
   *  (`downloadXml('expenses', uuid)`, módulo compartilhado `XmlPrefill`). */
  xml_key: string | null;
  /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — presente só
   *  quando o título é Direta+Agricultura E já foi persistido ao menos uma
   *  vez (`TASK-BE-036-125`/`126`, `ExpenseResource::appropriation_generated`,
   *  `whenLoaded('appropriationGenerated')`). Indicador READ-ONLY do
   *  `Appropriation` real gerado — NÃO reidrata os 4 campos de entrada
   *  (`aprop_agri_*`), decisão de escopo documentada na Tarefa (editar e
   *  salvar de novo RECRIA o Appropriation, mirror legado exclui+recria). */
  appropriation_generated?: {
    uuid: string;
    code: string | null;
    status: AppropriationStatusValue;
  } | null;
  /** UT-000795 (Execução 102) — dados gravados da Apropriação Direta
   *  Pecuária/Manutenção (plano API §4.2). `null`/ausente quando não há
   *  apontamento P ou M (Indireta, Área, Agricultura). */
  appropriation_detail?: ExpenseAppropriationDetail | null;
}

/** `GET /expenses/appropriation-types/options` — item (UT-000795). */
export interface ExpenseAppropriationTypeOption {
  value: ExpenseAppropriationTypeValue;
  label: string;
}

export interface ExpenseAppropriationUuidRef {
  uuid: string;
  description: string;
}

export interface ExpenseAppropriationLivestockDetail {
  uuid: string;
  code: string | null;
  status: AppropriationStatusValue | string;
  date: string | null;
  amount: number;
  area: ExpenseAppropriationUuidRef | null;
  grazing: ExpenseAppropriationUuidRef | null;
  batch: ExpenseAppropriationUuidRef | null;
  animal: { uuid: string; identification: string } | null;
  operation: { uuid: string; name: string };
  activity: { uuid: string; name: string };
}

export interface ExpenseAppropriationMaintenanceDetail {
  uuid: string;
  code: string | null;
  status: AppropriationStatusValue | string;
  date: string | null;
  amount: number;
  equipment: {
    uuid: string;
    code: string | null;
    description: string;
    family: { uuid: string; description: string } | null;
    uses_mileage: boolean;
  };
  hour_meter: number;
  mileage: number;
  note: string | null;
}

export interface ExpenseAppropriationDetail {
  type: ExpenseAppropriationTypeValue;
  livestock: ExpenseAppropriationLivestockDetail | null;
  maintenance: ExpenseAppropriationMaintenanceDetail | null;
}

/** Option de Equipamento do bloco Manutenção — carrega `uses_mileage`. */
export type ExpenseMaintenanceEquipmentOption = Option<string> & { uses_mileage?: boolean };

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ExpensesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ExpensesListEnvelope {
  success: boolean;
  message: string;
  data: ExpenseListItem[];
  errors: Record<string, string[]> | null;
  meta: ExpensesApiPaginationMeta | null;
}

// ============================================
// DRAFT DE DUPLICAÇÃO (`GET /expenses/{uuid}/duplicate`, B-11,
// TASK-FE-036-122) — leitura pura, NUNCA persiste. Mirror 1:1 de
// `App\Data\Expense\ExpenseDuplicateDraftData` (fonte de verdade lida
// direto do backend, `GB.Cerne.Api`), NÃO um subconjunto adivinhado de
// `ExpenseDetail`.
//
// Divergências reais vs. `ExpenseDetail`:
//   - Refs (`provider`/`branch`/`proprietary`/`harvest`/`type_title`) vêm
//     como `*_uuid` PLANOS (string), NUNCA objeto `{uuid, name/description}`
//     — o backend não resolve label aqui (leitura pura sobre o Model
//     original, sem eager-load de exibição). O front resolve o label via
//     `fillExpenseForm` (mesmos serviços já usados na edição:
//     `getProviderByUuid`, etc.) ou aceita o uuid truncado como fallback
//     honesto (mirror `handleXmlImported`), NUNCA inventa um nome.
//   - `payment_type`/`dt_emission`/`due_date`/`recurrence_type` SEMPRE
//     `null` (zerados pelo backend, `ExpenseDuplicateDraftData`
//     comentário).
//   - SEM `categories`/`write_offs`/`qtd_installments`/`installments`/
//     `automatic_writeoff`/`account_uuid`/`movement_date`/`document_ids`/
//     `xml_key`/`uuid`/`code` — nenhuma dessas chaves existe no draft
//     (rateio/parcelamento/baixa/anexos/XML nunca são clonados, mirror
//     "relations_not_cloned_into_form" da doc-bruta).
// ============================================

export interface ExpenseDuplicateDraft {
  number: string;
  type_title_uuid: string;
  amount: number;
  note: string;
  fiscal_document: boolean;
  proprietary_uuid: string | null;
  provider_uuid: string | null;
  branch_uuid: string | null;
  harvest_uuid: string | null;
  type_note: number | null;
  classification: ExpenseClassificationValue;
  recurrence_type: ExpenseRecurrenceTypeValue | null;
  discount: number;
  penalty: number;
  interest: number;
  perc_interest: number;
  increase: number;
  is_taxation: boolean;
  card_bill_financing: boolean;
  appropriation: ExpenseAppropriationValue;
  appropriation_type: number | null;
  payment_type: ExpensePaymentTypeValue | null;
  dt_emission: string | null;
  due_date: string | null;
}

// ============================================
// PAYLOAD DE ESCRITA — espelha `ExpenseRequest::rules()` 1:1.
// ============================================

export interface ExpenseInstallmentPayload {
  due_date: string;
  value: number;
}

export interface ExpenseApportionmentPayload {
  category_uuid: string;
  center_uuid: string;
  value: number;
  plan_account_uuid?: string | null;
  /** TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — populado
   *  quando `appropriation===1 && appropriation_type===AREA(3)`
   *  (`Rule::requiredIf`, `ExpenseRequest::rules()`); `null`/omitido nos
   *  demais casos. */
  area_uuid?: string | null;
  harvest_uuid?: string | null;
}

export interface ExpensePayload {
  /** UT-000796 r2 — vínculo com o movimento Financiamento (Gera Obrigação).
   *  SÓ no POST (ignorado no PUT); a CHAVE é omitida quando não há. */
  movement_uuid?: string;
  number: string;
  type_title_uuid: string;
  provider_uuid?: string | null;
  branch_uuid?: string | null;
  proprietary_uuid?: string | null;
  harvest_uuid?: string | null;
  dt_emission: string;
  due_date: string;
  amount: number;
  note: string;
  fiscal_document: boolean;
  payment_type: ExpensePaymentTypeValue;
  recurrence_type?: ExpenseRecurrenceTypeValue | null;
  classification?: ExpenseClassificationValue | null;
  type_note?: number | null;
  is_taxation: boolean;
  discount?: number;
  penalty?: number;
  interest?: number;
  perc_interest?: number;
  increase?: number;
  /** Só em criação (`UpdateExpenseAction` nunca toca parcelamento). */
  qtd_installments?: number | null;
  installments?: ExpenseInstallmentPayload[];
  categories: ExpenseApportionmentPayload[];
  /** TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — `2` (Indireta)
   *  enquanto o usuário não tocar o Select "Modalidade" (payload idêntico
   *  ao comportamento anterior, regressão zero); `1` (Direta) libera
   *  `appropriation_type` (`requiredIf`, `ExpenseRequest::rules()`). */
  appropriation?: ExpenseAppropriationValue | null;
  appropriation_type?: ExpenseAppropriationTypeValue | null;
  /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — enviados SÓ
   *  quando `appropriation===1 && appropriation_type===AGRICULTURA(1)`
   *  (`tryPersistExpense`, mirror do padrão já usado para parcelamento/baixa
   *  automática); omitidos/`undefined` nos demais casos
   *  (`ExpenseRequest::rules()`, `Rule::requiredIf`). */
  aprop_agri_area_uuid?: string | null;
  aprop_agri_activity_uuid?: string | null;
  aprop_agri_operation_uuid?: string | null;
  aprop_agri_cultivation_uuid?: string | null;
  /** UT-000795 — Pecuária (`appropriation===1 && appropriation_type===2`):
   *  uuid ou `null`, nunca `''`. Área e Módulo nunca ambos preenchidos. */
  aprop_pec_area_uuid?: string | null;
  aprop_pec_grazing_uuid?: string | null;
  aprop_pec_batch_uuid?: string | null;
  aprop_pec_animal_uuid?: string | null;
  aprop_pec_operation_uuid?: string | null;
  aprop_pec_activity_uuid?: string | null;
  /** UT-000795 — Manutenção (tipo 4): equipamento + APENAS o medidor aplicável. */
  aprop_man_equipment_uuid?: string | null;
  aprop_man_hour_meter?: number | null;
  aprop_man_mileage?: number | null;
  automatic_writeoff?: boolean;
  account_uuid?: string | null;
  movement_date?: string | null;
  /** Só em criação — id numérico legado (`App\Document`, sem `uuid`). */
  document_ids?: number[];
  /** B-05 (TASK-FE-036-121/340) — envio DEFENSIVO/forward-compatible: só em
   *  criação, populado SÓ quando o título foi criado a partir de um XML
   *  importado (`handleXmlImported`). O backend JÁ persiste este campo no
   *  `store()` (`ExpenseRequest`/`StoreExpenseAction`, `fd57e50db`). */
  xml_key?: string | null;
  /** DEC-115 (TASK-FE-036-125, §6) — só em criação, só quando
   *  `tenant.list_all_farms===true` (`StoreExpenseAction`,
   *  `context.tenant()?.list_all_farms`, MESMO flag do backend). Enviado
   *  SEMPRE que o Select "Fazenda de destino" está visível (podendo ser a
   *  própria fazenda ativa, no-op idêntico ao caminho sem `farm_uuid`) —
   *  nunca `null`/`''` quando ausente, a CHAVE é omitida (mirror da
   *  disciplina já documentada para uuids opcionais, `xml_key` acima). */
  farm_uuid?: string;
}

// ============================================
// REACT HOOK FORM (`useForm<ExpenseForm>`)
// ============================================

export interface ExpenseInstallmentRow {
  due_date: string | null;
  value: number | null;
}

export interface ExpenseApportionmentRow {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  value: number | null;
  plan_account_uuid: Option<string> | null;
  /** Percentual do rateio (esteira 036fix, audit item "Percentual do
   *  rateio") — campo SÓ-CLIENTE, cálculo bidirecional %↔valor (mirror
   *  legado `calcPercents()`/`calcValues()`, `_forms.blade.php:588-643`),
   *  recalculado no `onBlur` de `value`/`percent`. NUNCA enviado ao backend
   *  — `ExpenseApportionmentPayload` não tem este campo, só ajuda o usuário
   *  a preencher `value`. */
  percent: number | null;
  /** TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — obrigatório por
   *  linha só quando `appropriation===1 && appropriation_type===AREA(3)`
   *  (lido do form RAIZ via `watch`, `expense-schema.ts` fecha a validação
   *  no nível do array `categories`, mirror `categories-sum-exact-amount`).
   *  Reidratado em edição a partir de `row.area` (`fillExpenseForm`,
   *  correção do bug de round-trip pré-existente). */
  area_uuid: Option<string> | null;
  /** TASK-FE-036-123 (correção de round-trip, `HANDSHAKE-FE-036-B09`) —
   *  reidratado de `row.harvest` (`ExpenseResource::categories[].harvest`,
   *  já devolvido pela API) e reenviado inalterado no payload
   *  (`categories.*.harvest_uuid`, campo já aceito pelo backend,
   *  `ExpenseRequest::rules()`). Sem coluna própria nesta tela (nenhuma
   *  Tarefa desta faixa pede edição manual por linha) — só fecha o
   *  round-trip que antes descartava o valor silenciosamente. */
  harvest_uuid: Option<string> | null;
}

export interface ExpenseForm {
  number: string;
  type_title_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  branch_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  dt_emission: string | null;
  due_date: string | null;
  amount: number | null;
  note: string;
  fiscal_document: Option<boolean> | null;
  payment_type: Option<ExpensePaymentTypeValue> | null;
  recurrence_type: Option<ExpenseRecurrenceTypeValue> | null;
  classification: Option<ExpenseClassificationValue> | null;
  /** Select (esteira 036fix, audit "Tipo de Nota select do enum legado") —
   *  reusa o MESMO enum físico de `Invoice::types()`/`InvoiceDocumentType`
   *  já modelado em `invoiceDocumentTypeOptions`
   *  (`@/constants/invoices/options/document-type-options`), confirmado por
   *  leitura direta do legado (`_forms.blade.php:59`, `\App\Invoice::types()`)
   *  — NUNCA um `NumberInput` cru (perdia o rótulo/enum real). */
  type_note: Option<number> | null;
  /** TASK-FE-036-123 (Select "Modalidade", B-09 Opção C parcial) — default
   *  Indireta (`{label: ..., value: 2}`, preserva o comportamento em
   *  produção enquanto o usuário não tocar o campo). */
  appropriation: Option<ExpenseAppropriationValue> | null;
  /** TASK-FE-036-123 (Select "Tipo") — habilitado/obrigatório só quando
   *  `appropriation.value===1` (Direta); `null` e desabilitado quando
   *  Indireta (`useEffect` de limpeza, `CreateOrUpdateExpense.tsx`). */
  appropriation_type: Option<ExpenseAppropriationTypeValue> | null;
  /** TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
   *  "Agricultura" do Cabeçalho, visível/obrigatório só quando
   *  `appropriation===1 && appropriation_type===AGRICULTURA(1)` (mirror
   *  `AppropriationHeaderFields.tsx`/`InvoiceItemsTab.tsx`, cascata
   *  Operação→Atividade). Área/Atividade obrigatórios; Operação/Cultura
   *  opcionais. Em EDIÇÃO nascem SEMPRE `null` (decisão de escopo
   *  documentada — o backend não reidrata esses 4 valores, só o indicador
   *  `appropriation_generated`). */
  aprop_agri_area_uuid: Option<string> | null;
  aprop_agri_activity_uuid: Option<string> | null;
  aprop_agri_operation_uuid: Option<string> | null;
  aprop_agri_cultivation_uuid: Option<string> | null;
  /** UT-000795 — Pecuária (6 campos, ordem do legado). */
  aprop_pec_area_uuid: Option<string> | null;
  aprop_pec_grazing_uuid: Option<string> | null;
  aprop_pec_batch_uuid: Option<string> | null;
  aprop_pec_animal_uuid: Option<string> | null;
  aprop_pec_operation_uuid: Option<string> | null;
  aprop_pec_activity_uuid: Option<string> | null;
  /** UT-000795 — Manutenção. `uses_mileage` vem da API (família 5 = Km). */
  aprop_man_equipment_uuid: ExpenseMaintenanceEquipmentOption | null;
  aprop_man_hour_meter: number | null;
  aprop_man_mileage: number | null;
  is_taxation: Option<boolean> | null;
  discount: number | null;
  penalty: number | null;
  interest: number | null;
  perc_interest: number | null;
  increase: number | null;
  qtd_installments: number | null;
  installments: ExpenseInstallmentRow[];
  categories: ExpenseApportionmentRow[];
  automatic_writeoff: boolean;
  account_uuid: Option<string> | null;
  movement_date: string | null;
  /** B-05 (TASK-FE-036-121/340) — hidratado por `handleXmlImported` a partir
   *  do `ExpenseXmlDraft.xml_key` (import de XML), enviado defensivamente no
   *  payload de criação. `null` em qualquer título não importado por XML. */
  xml_key: string | null;
  /** DEC-115 (TASK-FE-036-125, §6) — Select "Fazenda de destino", visível só
   *  em criação com `tenant.list_all_farms===true`; opcional no tipo do form
   *  porque o campo nem existe quando o gate está desligado (nunca lido
   *  nesse caso — ver `tryPersistExpense`). Default = fazenda ATIVA
   *  (`activeFarmUuid`, `useAuth()`), populado assim que `useMyFarms()`
   *  resolve. */
  farm_uuid?: Option<string> | null;
}

// ============================================
// FILTRO (drawer da listagem — `ExpenseIndexRequest::rules()`, subconjunto
// real decidido em GAP-FE-036-108)
// ============================================

export interface ExpenseFilterForm {
  number?: string;
  provider_uuid?: string;
  proprietary_uuid?: string;
  type_title_uuid?: string;
  harvest_uuid?: string;
  dt_emission_from?: string;
  dt_emission_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount?: number;
  payment_type?: ExpensePaymentTypeValue;
  type_note?: number;
  // TASK-FE-036-115 (ONDA 2, FID-G3F FM13/FM16/FM17/FM05 revisado) — 4 dos
  // 5 filtros novos da Tarefa; `ExpenseIndexRequest::rules()` já valida os
  // 4 (`note`/`category_uuid`/`center_uuid`/`status`).
  note?: string;
  category_uuid?: string;
  center_uuid?: string;
  // `product` (FM21) NÃO implementado nesta Onda — BLOQUEADO por
  // GAP-036-113 (`ExpenseIndexRequest.php`, comentário do campo). Pendência
  // de desbloqueio, não confundir com decisão de escopo permanente.
  status?: ExpenseStatusFilterValue;
  // ---- ONDA 3 sub-onda 3d (FM10/FM11/FM18) — filtros de baixa, contrato
  // agora aceito pela API (`ExpenseIndexRequest::rules()`). `account_uuid`
  // (nome DIFERE do CaR, que usa `account_id`) guarda o `uuid` da conta da
  // baixa. ----
  account_uuid?: string;
  write_off_date_from?: string;
  write_off_date_to?: string;
  // DEC-115 (TASK-FE-036-125, §5) — flui para a queryKey (o `filter` inteiro
  // já entra nela, `useCustomGridQuery.tsx:45-52`); `true` quando o toggle
  // "Ver títulos de todas as fazendas" está ligado, `undefined`
  // (NUNCA `false`) quando desligado — mirror da disciplina "nunca enviar
  // valor negativo" já aplicada aos demais filtros opcionais deste tipo.
  all_farms?: boolean;
}
