// src/@types/v2/InputEntries/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Entrada de Insumos" (InputEntry) — API v1 do backend
// Laravel GB.Cerne. Casa própria (mirror `Invoices`), NÃO sub-pasta de
// `CadastrosBase`. Esteira 037 (`entrada-insumos-front-roteiro.md`,
// TASK-IE-FE-01).
//
// Contrato REAL (leitura direta do roteiro/backend já migrado —
// InputEntryController/InputEntryRequest/InputEntryIndexRequest/
// InputEntryResource/InputEntryItemResource/Data/InputEntry/*):
//   - PUT/PATCH reenvia `items[]` COMPLETO (reverte+recria, NÃO é PATCH
//     parcial de 1 linha) — MESMO shape de payload serve para criação E
//     edição (`InputEntryPayload`/`InputEntryCreateForm`).
//   - `total_value` do item NUNCA é aceito do cliente (backend recalcula
//     `quantity * unit_value`) — client-only, preview.
//   - Baixa financeira automática é HEADER-level, débito, condicional
//     (`automatic_writeoff`/`account_uuid`/`movement_date`).
//   - `movement` do detalhe pode ser `null` inteiro (a maioria das entradas
//     nasce sem baixa automática) — optional chaining obrigatório.
//   - Todo relacionamento (`farm`/`harvest`/`proprietary`/`user`/`product`/
//     `warehouse`/`category`/`center`/`cultivation`/`area`/`batch`/
//     `measurement`) é `whenLoaded` e pode vir `null`.
//   - `items` está AUSENTE na listagem (`index`) — só presente em
//     `show`/`store`/`update`.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// SUB-OBJETOS COMPARTILHADOS (Resource real) — todo relacionamento é
// `whenLoaded`, pode vir `null`/`undefined`.
// ============================================

export interface InputEntryFarmRef {
  uuid: string;
  description: string;
}

export interface InputEntryHarvestRef {
  uuid: string;
  /** T-078-API-01 (DD-078-03) — nome da safra para label (nunca exibir uuid). */
  description: string;
}

export interface InputEntryProprietaryRef {
  uuid: string;
  name: string;
}

export interface InputEntryUserRef {
  uuid: string;
  name: string;
}

export interface InputEntryProductRef {
  uuid: string;
  description: string;
  /** CORRECAO-R1/E3 (Onda 3, api_root) — `InputEntryItemResource` passou a
   *  expor `has_lot` do produto (`items[N].product.has_lot`), mirror da
   *  leitura que o front já faz para Invoice (`product_uuid?.has_lot`).
   *  Habilita/bloqueia `provider_lot`/`shelf_life` já na hidratação de
   *  edição, sem exigir reseleção do produto. */
  has_lot?: boolean;
  /** T-078-API-01 — unidades do produto (1ª sempre; 2ª `null` se não houver),
   *  usadas para popular o Select "Un. Medida" na hidratação de edição. */
  measurement?: InputEntryMeasurementRef | null;
  measurement_second?: InputEntryMeasurementRef | null;
}

export interface InputEntryMeasurementRef {
  uuid: string;
  /** T-078-API-01 — sigla/descrição da unidade (ex.: "KG"). */
  description: string;
}

export interface InputEntryWarehouseRef {
  uuid: string;
  description: string;
}

export interface InputEntryCultivationRef {
  uuid: string;
  /** T-078-API-01 — `Cultivation.name` (Classificação). */
  name: string;
}

export interface InputEntryCategoryRef {
  uuid: string;
  description: string;
}

export interface InputEntryCenterRef {
  uuid: string;
  /** T-078-API-01 — label exibido: `${code} — ${description}`. */
  code: string;
  description: string;
}

export interface InputEntryMovementAccountRef {
  uuid: string;
  description: string;
}

/** `InputEntryResource.movement` — pode ser `null` inteiro (maioria das
 *  entradas nasce sem baixa automática). Optional chaining obrigatório. */
export interface InputEntryMovementRef {
  uuid: string;
  code: string;
  value: number;
  date: string;
  account: InputEntryMovementAccountRef | null;
}

// ============================================
// LISTAGEM (`GET /input-entries` — enxuta, SEM `items`/`harvest`)
// ============================================

export interface InputEntryListItem {
  uuid: string;
  code: string;
  date: string;
  farm?: InputEntryFarmRef | null;
  proprietary?: InputEntryProprietaryRef | null;
  user?: InputEntryUserRef | null;
  total_amount: number;
  note: string | null;
  movement?: InputEntryMovementRef | null;
}

// ============================================
// ITEM (InputEntryItemResource real, dentro de InputEntryDetail.items[])
// ============================================

export interface InputEntryItemDetail {
  uuid: string;
  product?: InputEntryProductRef | null;
  measurement?: InputEntryMeasurementRef | null;
  quantity: number;
  unit_value: number;
  total_value: number;
  generate_stock: boolean;
  warehouse?: InputEntryWarehouseRef | null;
  appropriation_type: string | null;
  provider_lot: string | null;
  /** Gerado no servidor (`Str::random(20)`) — só informativo, nunca enviado. */
  lot: string | null;
  shelf_life: string | null;
  cultivation?: InputEntryCultivationRef | null;
  category?: InputEntryCategoryRef | null;
  center?: InputEntryCenterRef | null;
}

// ============================================
// DETALHE (`GET/POST/PUT /input-entries/{uuid}` — InputEntryResource
// completo, `items` sempre eager-loaded aqui)
// ============================================

export interface InputEntryDetail extends InputEntryListItem {
  harvest?: InputEntryHarvestRef | null;
  items: InputEntryItemDetail[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface InputEntriesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface InputEntriesListEnvelope {
  success: boolean;
  message: string;
  data: InputEntryListItem[];
  errors: Record<string, string[]> | null;
  meta: InputEntriesApiPaginationMeta | null;
}

// ============================================
// TIPO DE APROPRIAÇÃO — elegibilidade por Centro de Custo (TASK-BE-1085,
// GAP-BE-684, F-084 Entrada/Insumos item 3)
// ============================================

/**
 * `GET /input-entries/appropriation-types/options` — lookup ENXUTO de
 * elegibilidade de Tipo de Apropriação (Agricultura/Pecuária) pelos Centros
 * de Custo HABILITADOS do tenant corrente. Resource `{value,label}[]`,
 * envelope FLAT (`ApiResponse::success`, `data` é o array direto, `meta`
 * sempre `null`) — mirror `AppropriationTypeOption` de Invoice
 * (`@/@types/v2/Invoices`).
 *
 * ⚠️ `value` é SEMPRE STRING ("1"=Agricultura/"2"=Pecuária,
 * `App\Enums\InputEntry\AppropriationType`, backed `string`) — domínio
 * PRÓPRIO de Entrada de Insumos, diferente do Enum `int` de Invoice. NUNCA
 * comparar com `===` contra número.
 */
export interface InputEntryAppropriationTypeOption {
  value: string;
  label: string;
}

// ============================================
// PAYLOAD DE ESCRITA — espelha `InputEntryRequest`/`InputEntryItemData` 1:1.
// MESMO shape usado em `createInputEntry` E `updateInputEntry` (decisão #3
// do roteiro — payload sempre completo, sem PATCH parcial).
// ============================================

export interface InputEntryItemPayload {
  /** DD-078-07 (b) — uuid do item JÁ GRAVADO (só no update). Item novo NÃO
   *  envia `uuid`; a API mantém o lote original do item existente. */
  uuid?: string;
  product_uuid: string;
  measurement_uuid: string;
  quantity: number;
  unit_value: number;
  generate_stock: boolean;
  /** `required_if:generate_stock,true` no backend. */
  warehouse_uuid?: string | null;
  /** `varchar(10)` no backend (aceita qualquer valor) — CORRECAO-R1/E5: a UI
   *  restringe a Select Agricultura("1")/Pecuária("2"), constante LOCAL do
   *  Entrada/Insumos. Editável só quando `generate_stock=false`. */
  appropriation_type?: string | null;
  provider_lot?: string | null;
  shelf_life?: string | null;
  cultivation_uuid?: string | null;
  category_uuid?: string | null;
  center_uuid?: string | null;
}

export interface InputEntryPayload {
  date: string;
  harvest_uuid?: string | null;
  proprietary_uuid?: string | null;
  note?: string | null;
  items: InputEntryItemPayload[];
  /** Baixa financeira automática — HEADER-level, débito, condicional
   *  (`ApplyAutomaticWriteOffAction`, só efetivada quando `total_amount>0`). */
  automatic_writeoff?: boolean;
  /** `required_if:automatic_writeoff,true`. */
  account_uuid?: string | null;
  /** `required_if:automatic_writeoff,true`. */
  movement_date?: string | null;
}

// ============================================
// REACT HOOK FORM (`useForm<InputEntryCreateForm>`) — relacionamentos como
// `Option<string>`, itens como `useFieldArray`.
// ============================================

export interface InputEntryItemForm {
  /** DD-078-07 (b) — uuid do item existente (hidratação de edição). Ausente em
   *  item novo. Item com `uuid` tem lote/validade SOMENTE LEITURA. */
  uuid?: string | null;
  /** CORRECAO-R1/E3 — `has_lot` do produto embutido NA PRÓPRIA option
   *  (mirror `mapOptions` de `EntradaInsumosItemsTab.tsx`, lido DIRETO por
   *  `provider_lot`/`shelf_life`), SEM campo irmão no form (diferente da
   *  convenção de `InvoiceItemForm.has_lot`, que é campo separado). Seedado
   *  na hidratação de edição a partir de `item.product.has_lot`. */
  product_uuid: (Option<string> & { has_lot?: boolean }) | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  unit_value: number | null;
  /** Client-only preview (`quantity × unit_value`), EDITÁVEL (CORRECAO-R1/
   *  E4) — editar este campo recalcula `unit_value` em sentido inverso
   *  (`unit_value = total_value / quantity`). NUNCA enviado no payload (o
   *  servidor sempre recalcula, CL-006). */
  total_value: number;
  generate_stock: boolean;
  warehouse_uuid: Option<string> | null;
  /** CORRECAO-R1/E5 — Select (Agricultura "1" / Pecuária "2"), constante
   *  LOCAL do Entrada/Insumos (NÃO reutiliza a constante do Invoice, que
   *  carrega semântica GAP-528 específica). Editável só quando
   *  `generate_stock=false`; limpo/readonly quando `generate_stock=true`. */
  appropriation_type: Option<string> | null;
  provider_lot: string;
  shelf_life: string | null;
  cultivation_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
}

/** MESMO shape serve para criação E edição (payload completo, decisão #3
 *  do roteiro) — `useCustomFormQueryByGuid` hidrata este form inteiro,
 *  incluindo o `useFieldArray` de `items`, a partir do `show()`. */
export interface InputEntryCreateForm {
  date: string;
  harvest_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  note: string;
  items: InputEntryItemForm[];
  automatic_writeoff: boolean;
  account_uuid: Option<string> | null;
  movement_date: string | null;
}

// ============================================
// FILTRO (drawer da listagem — `InputEntryIndexRequest`/`InputEntryFilterData`)
// ============================================

export interface InputEntryFilterForm {
  /** Nome do campo é `proprietary_id` (mirror legado), mas o VALOR é `uuid`
   *  — risco documentado no roteiro (não confundir com id numérico). */
  proprietary_id?: string;
  start_date?: string;
  end_date?: string;
}
