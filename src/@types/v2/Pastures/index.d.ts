// src/@types/v2/Pastures/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Pastagem (Pasture) — domínio PRÓPRIO
// (entity-flat `Pastures/`, mirror `Appropriations`/`Batches`/`Equipments`),
// TASK-PAST-FE-00 (execução 041). Backend JÁ CONSTRUÍDO nesta execução
// (`TASK-PAST-API-01/02`, fork `feature/refactor-pasture-for-api`) — modelado
// por LEITURA DIRETA de `PastureController.php`/`PastureRequest.php`/
// `AppropriatePastureRequest.php`/`app/Data/Pasture*.php`/
// `app/Http/Resources/V1/PastureResource.php`/`app/Enums/PastureStatusEnum.php`
// — não a partir só do contrato documental (arquitetura-frontend-pastagem.md).
//
//   GET    /pastures                          → paginado (10/pág, order code desc)
//   POST   /pastures                          → 201, pastures_create
//   GET    /pastures/{uuid}                   → detalhe completo (5 subcadastros)
//   PUT    /pastures/{uuid}                   → 200, pastures_edit
//   DELETE /pastures/{uuid}                   → 204, pastures_delete
//   GET    /pastures/{uuid}/appropriation      → 200, pastures_edit (rateio + centros elegíveis)
//   PUT    /pastures/{uuid}/appropriation      → 200, pastures_edit (`appropriate`)
//
// `GET /pastures/form-context` (AC-EP-08, "recomendado, opcional") NÃO existe
// no fork (confirmado por leitura de `routes/api.php` — zero rota) — como o
// próprio contrato já o marcava opcional, NENHUM Gap foi aberto para esta
// ausência: os enums estáticos (status/priority/func_type/op_class) vivem só
// no front (`constants/pastures/options/`), sem "próximo código" em preview
// de criação (o `code` é sempre gerado pelo servidor, nunca editável).
//
// OBSERVAÇÃO (não é Gap — mirror da nota já registrada em `AppropriationListItem`
// para `created_at` ausente): `PastureRepository::listWithFilters()` só faz
// eager-load de `['area','grazing','operation','activity','employee']` —
// `inputsWarehouse`/`productionsWarehouse`/`user` NÃO são carregados no
// `index()`. Como `PastureResource` expõe esses 2 primeiros via
// `whenLoaded()`, a coluna "Armazém" da listagem (LM-05) fica tipada como
// opcional aqui e, na prática hoje, sempre ausente — reportado ao Tester,
// não bloqueia a Tarefa (UI honesta: renderiza "—" quando ausente, SEM MOCK).
//
// OBSERVAÇÃO (não é Gap): `PastureProductionData` (linha de "Produção") não
// tem campo `final_quantity` — só `product_uuid`/`measurement_uuid`/
// `quantity`/`note`. O contrato de arquitetura menciona "final_quantity
// (campo lido pelo server)", mas o DTO real materializado não o expõe; o
// campo de quantidade da linha é `quantity`, e é o único enviado.
//
// GAP-PAST-FE-01 (`check-date`, RT-11) — ver `CORE_WORKSPACE/04-Gaps_Frontend_UI/`
// — não altera este arquivo de tipos. GAP-PAST-FE-02 (upload de imagem de
// Ocorrência) FECHADO por `TASK-PAST-FIX-FE-02` (execução 041) — imagem NOVA
// (`file`) agora é convertida para data URI base64 no submit
// (`CreateOrUpdatePastagem.tsx`) e enviada no mesmo shape `string` já
// existente (`PastureOccurrenceImagePayload.image`); nenhuma mudança de
// shape foi necessária, só de MECANISMO de upload.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS / VALORES FIXOS (backed nos Enums PHP reais)
// ============================================

/** `PastureStatusEnum` — `O`=Aberto, `F`=Finalizado, `A`=Apropriado. */
export type PastureStatusValue = 'O' | 'F' | 'A';

/** Discriminante de UI para o executor da linha de Serviços (mirror
 *  `LaborTypeValue` de Appropriations) — 1=Funcionário, 2=Função,
 *  3=Prestador de Serviço. NÃO é um campo do payload (o payload é o XOR
 *  `employee_uuid`/`function_uuid`/`provider_uuid`), só orienta qual Select
 *  renderizar em cada linha. */
export type PastureFuncTypeValue = 1 | 2 | 3;

/** `class` das linhas de subcadastro/apropriação (`OpClassEnum`) —
 *  1=Custeio, 2=Investimento. */
export type PastureOpClassValue = 1 | 2;

/** `priority` de Ocorrência — validado como `in:0,1,2` em `PastureRequest`. */
export type PasturePriorityValue = '0' | '1' | '2';

// ============================================
// REFS ANINHADOS (leitura, mirror 1:1 do `PastureResource::toArray()` real —
// `PastureRef` expõe `uuid`+`name`; `PastureNamedRef`/`PastureDescribedRef`
// são variantes já existentes antes desta correção, mantidas por
// compatibilidade com os campos que já usavam `name`/`description` próprios)
// ============================================

export interface PastureRef {
  uuid: string;
  /** A API agora expõe `name` em toda relação (antes só `uuid`) — hidratação
   *  de edição usa este campo como label real do Select, nunca o `uuid`
   *  cru (ver `fillPastureForm` em `CreateOrUpdatePastagem.tsx`). */
  name: string;
}

export interface PastureNamedRef {
  uuid: string;
  name: string;
}

export interface PastureDescribedRef {
  uuid: string;
  description: string;
}

export interface PastureCenterOption {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// LISTAGEM (`GET /pastures`)
// ============================================

export interface PastureListItem {
  uuid: string;
  code: string;
  date: string;
  status: PastureStatusValue;
  /** Sempre presente (calculado no Resource, não `whenLoaded`) — fallback
   *  `employee?.name ?? user?.name ?? null`, unifica CLM-40/41. */
  requester: string | null;
  employee?: PastureNamedRef | null;
  area?: PastureRef | null;
  grazing?: PastureRef | null;
  operation?: PastureRef | null;
  activity?: PastureRef | null;
  batch?: PastureRef | null;
  animal?: PastureRef | null;
  /** Ver OBSERVAÇÃO no cabeçalho do arquivo — hoje sempre ausente no
   *  `index()` (sem eager-load); renderizar "—" quando ausente. */
  inputs_warehouse?: PastureRef | null;
  productions_warehouse?: PastureRef | null;
  created_at: string | null;
}

// ============================================
// ITENS (detalhe — cada shape mirror 1:1 do array aninhado real do Resource)
// ============================================

export interface PastureEquipmentItemResponse {
  uuid: string;
  equipment: PastureRef | null;
  measurement: PastureRef | null;
  center: PastureRef | null;
  class: PastureOpClassValue | null;
  start_hour_meter: number;
  end_hour_meter: number;
  quantity: number;
  amount: number;
  total_amount: number;
  note: string | null;
}

export interface PastureInputItemResponse {
  uuid: string;
  stock: (PastureRef & { product: PastureDescribedRef | null }) | null;
  measurement: PastureRef | null;
  center: PastureRef | null;
  class: PastureOpClassValue | null;
  quantity: number;
  quantity_unitary: number;
  total_quantity: number;
  amount: number;
  total_amount: number;
}

export interface PastureProductionItemResponse {
  uuid: string;
  product: PastureDescribedRef | null;
  measurement: PastureRef | null;
  center: PastureRef | null;
  class: PastureOpClassValue | null;
  quantity: number;
  note: string | null;
}

export interface PastureServiceItemResponse {
  uuid: string;
  employee: PastureNamedRef | null;
  function: PastureRef | null;
  provider: PastureRef | null;
  measurement: PastureRef | null;
  center: PastureRef | null;
  class: PastureOpClassValue | null;
  quantity: number;
  total_quantity: number;
  amount: number;
  total_amount: number;
}

/** Imagem de ocorrência — shape objeto único (DEC-PAST-05, fix CLM-20..24).
 *  `image` é a referência (path/URL) já persistida na LEITURA (resposta da
 *  API) — ver `PastureOccurrenceImagePayload` para o shape de ESCRITA
 *  (aceita também data URI base64, `TASK-PAST-FIX-FE-02`). */
export interface PastureOccurrenceImage {
  latitude: number;
  longitude: number;
  image: string;
}

export interface PastureOccurrenceItemResponse {
  uuid: string;
  priority: PasturePriorityValue | null;
  images: PastureOccurrenceImage[];
  recommendation: string | null;
  diagnosis: string | null;
}

// ============================================
// DETALHE (`GET/POST/PUT /pastures/{uuid}`)
// ============================================

export interface PastureDetail extends PastureListItem {
  equipments: PastureEquipmentItemResponse[];
  inputs: PastureInputItemResponse[];
  productions: PastureProductionItemResponse[];
  services: PastureServiceItemResponse[];
  occurrences: PastureOccurrenceItemResponse[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface PasturesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PasturesListEnvelope {
  success: boolean;
  message: string;
  data: PastureListItem[];
  errors: Record<string, string[]> | null;
  meta: PasturesApiPaginationMeta | null;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT`, mirror 1:1 `PastureRequest::rules()` +
// `PastureData`) — `farm_id`/`user_id`/`status`/`code` NUNCA aceitos.
// ============================================

export interface PastureEquipmentPayload {
  equipment_uuid: string;
  measurement_uuid: string;
  start_hour_meter?: number;
  end_hour_meter?: number;
  note?: string;
  /** `sometimes|string` no Request — NÃO é upload de arquivo (ver cabeçalho
   *  do arquivo). Fora do escopo de UI de `TASK-PAST-FE-04` (DoD não pede
   *  campo de foto para Equipamentos, diferente de Appropriations). */
  start_hour_photo?: string;
  end_hour_photo?: string;
}

export interface PastureInputPayload {
  stock_uuid?: string;
  product_uuid?: string;
  measurement_uuid: string;
  quantity?: number;
  quantity_unitary?: number;
  total_quantity?: number;
}

export interface PastureProductionPayload {
  product_uuid: string;
  measurement_uuid: string;
  quantity?: number;
  note?: string;
}

export interface PastureServicePayload {
  employee_uuid?: string;
  function_uuid?: string;
  provider_uuid?: string;
  measurement_uuid: string;
  quantity?: number;
  total_quantity?: number;
}

/** `image` continua `string` — imagem já persistida reenvia a URL/path
 *  existente; imagem NOVA (`TASK-PAST-FIX-FE-02`, fecha GAP-PAST-FE-02) é
 *  convertida para data URI base64 (`FileReader.readAsDataURL`) ANTES do
 *  submit (`fileToDataUri`, `CreateOrUpdatePastagem.tsx`) — mesmo campo
 *  `string`, sem shape novo. */
export interface PastureOccurrenceImagePayload {
  latitude: number;
  longitude: number;
  image: string;
}

export interface PastureOccurrencePayload {
  /** TASK-PAST-FIX-FE-02b — upsert de ocorrências ENDEREÇADO POR UUID
   *  (`occurrences.*.uuid`, `sometimes` no Request). Presente só quando a
   *  ocorrência já existe (edição); AUSENTE em ocorrência nova — nunca
   *  inventar. Sem ele, a API trata toda ocorrência como nova e
   *  apaga+recria as existentes na edição (reabre a órfã de imagem que o
   *  upsert existe para evitar). */
  uuid?: string;
  priority: PasturePriorityValue;
  images?: PastureOccurrenceImagePayload[];
  recommendation?: string;
  diagnosis?: string;
}

export interface PastureWritePayload {
  date: string;
  area_uuid?: string;
  grazing_uuid?: string;
  operation_uuid: string;
  activity_uuid: string;
  batch_uuid?: string;
  animal_uuid?: string;
  inputs_warehouse_uuid?: string;
  productions_warehouse_uuid?: string;
  equipments: PastureEquipmentPayload[];
  inputs: PastureInputPayload[];
  productions: PastureProductionPayload[];
  services: PastureServicePayload[];
  occurrences: PastureOccurrencePayload[];
}

export type CreatePastureRequest = PastureWritePayload;
export type UpdatePastureRequest = PastureWritePayload;

// ============================================
// PAYLOAD/RESPOSTA DE APROPRIAÇÃO (`GET`/`PUT /pastures/{uuid}/appropriation`)
// ============================================

export interface AppropriationLinePayload {
  uuid: string;
  center_uuid: string;
  class: PastureOpClassValue;
  /** Só usado por linhas de `equipments` (CALC-06). */
  vl_time?: number;
}

export interface AppropriatePastureRequestPayload {
  equipments: AppropriationLinePayload[];
  inputs: AppropriationLinePayload[];
  productions: AppropriationLinePayload[];
  services: AppropriationLinePayload[];
}

/** Resposta de `GET /pastures/{uuid}/appropriation`. Quando as 4 categorias
 *  de satélite estão vazias, a API já aplica o atalho de auto-apropriação
 *  (CLM-32) e devolve `eligible_centers: []` — front trata como "sem tela,
 *  navega+toast" (§5.7 do contrato). */
export interface AppropriationData {
  pasture: PastureDetail;
  eligible_centers: PastureCenterOption[];
}

// ============================================
// FILTRO (drawer da listagem — `PastureFilterData`)
// ============================================

export interface PastureFilterForm {
  user_uuid?: string;
  /** DISPLAY-ONLY — re-hidrata o label do `SelectAsyncPaginate` de
   *  Requisitante sem novo fetch ao reabrir o drawer (mirror
   *  `AppropriationFilterForm.area_label`). */
  user_label?: string;
  start_date?: string;
  end_date?: string;
}

export type PastureFilterRequest = Omit<PastureFilterForm, 'user_label'>;

// ============================================
// REACT HOOK FORM (`useForm<PastureForm>`) — cabeçalho + 5 listas via
// `useFieldArray`.
// ============================================

export interface PastureEquipmentForm {
  /** `uuid` da linha já persistida — presente só quando hidratada do
   *  detalhe (`fillPastureForm`); ausente em linha nova adicionada na
   *  sessão. Orienta o readonly de identidade em modo edição (CLM-64) —
   *  NUNCA enviado no payload de escrita (`PastureEquipmentPayload` não
   *  tem `uuid`; a Action recria os satélites por completo). */
  uuid?: string;
  equipment_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  start_hour_meter: number | null;
  end_hour_meter?: number | null;
  note: string | null;
}

export interface PastureInputForm {
  /** Ver `PastureEquipmentForm.uuid` — mesmo racional (readonly de
   *  identidade em edição, nunca enviado no payload). */
  uuid?: string;
  /** Option enriquecida com o produto/medida embutidos pelo
   *  `mapOptions`/lookup de `listStockAvailability` (mirror
   *  `AppropriationStockItemForm.product_uuid`), escopada pelo
   *  `inputs_warehouse_uuid` do cabeçalho. */
  stock_uuid:
    | (Option<string> & {
        product?: Option<string> | null;
        measurement?: Option<string> | null;
        quantity?: number;
      })
    | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  quantity_unitary: number | null;
  total_quantity: number | null;
}

export interface PastureProductionForm {
  /** Ver `PastureEquipmentForm.uuid`. */
  uuid?: string;
  product_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  note: string | null;
}

export interface PastureServiceForm {
  /** Ver `PastureEquipmentForm.uuid`. */
  uuid?: string;
  /** Discriminante de UI (não é campo do payload) — ver `PastureFuncTypeValue`. */
  func_type: Option<PastureFuncTypeValue> | null;
  employee_uuid: Option<string> | null;
  function_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  /** CALC-05 — bidirecional com `quantity` (único subcadastro assim, FD-34). */
  total_quantity: number | null;
}

/** Imagem — forma RHF distingue `existingUrl` (já persistida, reenviada como
 *  está) de `file` (NOVA, selecionada nesta sessão — `TASK-PAST-FIX-FE-02`:
 *  convertida para data URI base64 no submit, preview local via
 *  `URL.createObjectURL` enquanto não persistida). */
export interface PastureOccurrenceImageFormRow {
  latitude: number;
  longitude: number;
  existingUrl?: string | null;
  file?: File | null;
}

export interface PastureOccurrenceForm {
  /** `uuid` da ocorrência já persistida — ver `PastureEquipmentForm.uuid`
   *  (mesmo racional, mirror equipamentos/produtos/serviços/produção):
   *  presente só quando hidratada do detalhe (`fillPastureForm`), ausente
   *  em linha nova. Repassado no payload de escrita
   *  (`PastureOccurrencePayload.uuid`) para o upsert endereçado por uuid da
   *  API — diferente dos outros 4 subcadastros, aqui o `uuid` VAI no
   *  payload (a API reconcilia ocorrências por uuid, não recria por
   *  completo). */
  uuid?: string;
  diagnosis: string | null;
  recommendation: string | null;
  priority: Option<PasturePriorityValue> | null;
  images: PastureOccurrenceImageFormRow[];
}

export interface PastureForm {
  date: string | null;
  area_uuid: Option<string> | null;
  grazing_uuid: Option<string> | null;
  operation_uuid: Option<string> | null;
  activity_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  animal_uuid: Option<string> | null;
  inputs_warehouse_uuid: Option<string> | null;
  productions_warehouse_uuid: Option<string> | null;
  equipments: PastureEquipmentForm[];
  inputs: PastureInputForm[];
  productions: PastureProductionForm[];
  services: PastureServiceForm[];
  occurrences: PastureOccurrenceForm[];
}

/** Linha de apropriação/rateio (`AppropriatePastureRequestPayload`) — 1
 *  useForm por coleção (equipments/inputs/productions/services), campo
 *  auxiliar `label` só para exibição (não enviado). */
export interface AppropriationLineForm {
  uuid: string;
  label: string;
  center_uuid: Option<string> | null;
  class: Option<PastureOpClassValue> | null;
  vl_time?: number | null;
}

export interface AppropriatePastureForm {
  equipments: AppropriationLineForm[];
  inputs: AppropriationLineForm[];
  productions: AppropriationLineForm[];
  services: AppropriationLineForm[];
}

// Reexport de conveniência (mirror `AppropriationForm`/`EquipmentForm`).
export type { Option };
