// src/@types/v2/Appropriations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Apontamentos (Appropriation) — domínio PRÓPRIO
// (mirror `Batches`/`Equipments`/`Planos`/`Invoices`), TASK-FE-2705 (execução
// 033/Onda 3). Backend JÁ CONSTRUÍDO E APROVADO nesta execução (TASK-BE-
// 980..985 + extensão de fidelidade v1.1 TASK-BE-998/999) — modelado por
// LEITURA DIRETA de `AppropriationController.php`/`AppropriationRequest.php`/
// `AppropriateAppropriationRequest.php`/`RevertAppropriationStatusRequest.php`/
// `app/Data/Appropriation/*`/`app/Http/Resources/V1/Appropriation*Resource.php`/
// `app/Enums/Appropriation/*` — não a partir só do contrato documental.
//
//   GET    /appropriations                       → paginado; listagem ENXUTA
//                                                   (SEM as 5 coleções de item
//                                                   nem movements — só quando
//                                                   `relationLoaded()`)
//   POST   /appropriations                       → 201, permission
//                                                   appropriations_create
//   GET    /appropriations/{uuid}                → detalhe completo (itens+
//                                                   movements eager)
//   PUT    /appropriations/{uuid}                → 200, permission
//                                                   appropriations_edit — SEM
//                                                   guarda de status (D7
//                                                   REVERTIDO, edita em
//                                                   qualquer status)
//   DELETE /appropriations/{uuid}                → 204, permission
//                                                   appropriations_delete
//   PATCH  /appropriations/{uuid}/finish          → 200, SEM permission
//                                                   própria (D10 REVERTIDO)
//   PATCH  /appropriations/{uuid}/appropriate     → 200, SEM permission
//                                                   própria, `items` opcional
//   PATCH  /appropriations/{uuid}/revert-status   → 200, SEM permission
//                                                   própria, `observation`
//                                                   obrigatório (max 500)
//
// Multipart: o `POST`/`PUT` de cabeçalho passa a exigir `multipart/form-data`
// SEMPRE que `occurrences[].images[]` tiver ao menos 1 arquivo NOVO (`File`) —
// ver `appropriation-service.ts` (`buildAppropriationFormData`). Imagens já
// persistidas (path/URL da resposta) NÃO são reenviadas como arquivo — update
// não-destrutivo (contrato v1.1 §19-E2, `TASK-BE-999`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS / VALORES FIXOS (backed nos Enums PHP reais)
// ============================================

/** `AppropriationStatus` — `O`=Aberto, `F`=Finalizado, `A`=Apropriado. */
export type AppropriationStatusValue = 'O' | 'F' | 'A';

/** `LaborType` — 1=Funcionário, 2=Função, 3=Prestador de Serviço. */
export type LaborTypeValue = 1 | 2 | 3;

/** `LaborPaymentType` — 'Q'=Qtd/ha (default), 'V'=Valor. */
export type LaborPaymentTypeValue = 'Q' | 'V';

/** `OccurrencePriority` — '0'=Baixa (default), '1'=Média, '2'=Alta. */
export type OccurrencePriorityValue = '0' | '1' | '2';

/** Discriminante de origem do item no payload de `appropriate` (§13.1). */
export type AppropriateItemTypeValue =
  'stock' | 'equipment' | 'employee' | 'function' | 'provider' | 'production';

// ============================================
// REFS ANINHADOS (leitura, mirror dos Resources reais)
// ============================================

export interface AppropriationDescribedRef {
  uuid: string;
  description: string;
}

export interface AppropriationNamedRef {
  uuid: string;
  name: string;
}

export interface AppropriationCenterRef {
  uuid: string;
  code: string;
  description: string;
}

export interface AppropriationMeasurementRef {
  uuid: string;
  name: string;
  // TASK-FE-751 (destravada por ERRO-BE-018) — os 5 Resources de item
  // persistido do backend passaram a expor `description` (texto completo,
  // ex. "Hora") ao lado de `name` (abreviação, ex. "h"), aditivo, mirror
  // `ProductMeasurementRef`. Front usa `description` para exibir Un.
  // Medida hidratada, com fallback a `name` (nunca some o dado).
  description: string;
}

// ============================================
// LISTAGEM (`GET /appropriations` — listagem ENXUTA, SEM as 5 coleções de
// item nem `movements`/`occurrences` — `AppropriationRepository::
// listWithFilters()`, `relationLoaded()` guarda no Resource).
// ============================================

export interface AppropriationListItem {
  uuid: string;
  code: string;
  status: AppropriationStatusValue;
  status_label: string;
  /** Hex cru do backend — NUNCA consumir direto (Passo UX). Mapear por
   *  `APPROPRIATION_STATUS_META` (`appropriationStatus.ts`). */
  status_color: string;
  date: string;
  description: string | null;
  used_area: number | null;
  area?: AppropriationDescribedRef;
  activity?: AppropriationNamedRef;
  operation?: AppropriationNamedRef | null;
  cultivation?: AppropriationNamedRef | null;
  harvest?: AppropriationDescribedRef | null;
  warehouse_production?: AppropriationDescribedRef | null;
  employee?: AppropriationNamedRef | null;
  user?: AppropriationNamedRef;
}

// ============================================
// ITENS (detalhe — cada shape mirror 1:1 do Resource aninhado real)
// ============================================

export interface AppropriationStockItemResponse {
  product: AppropriationDescribedRef;
  quantity: number;
  total_quantity: number;
  amount: number;
  total_amount: number;
  class: number;
  center_uuid: string | null;
  /** v1.1 §19-E3 — só presente quando o payload informou `measurement_uuid`. */
  measurement: AppropriationMeasurementRef | null;
  /** GAP-BE-652 (TASK-FE-704/AP-35, execução 034, 6ª leva) — Armazém de onde
   *  o insumo saiu, seleção REAL persistida na escrita (`warehouse_uuid`
   *  `required_with` em `AppropriationRequest`), reexposta aqui via
   *  `Stock::warehouse()` (mirror `product`, sem recálculo). `null` só se o
   *  `Stock` não tiver armazém associado (não deveria ocorrer). */
  warehouse: AppropriationDescribedRef | null;
}

export interface AppropriationEquipmentItemResponse {
  equipment: AppropriationDescribedRef;
  start_hour_meter: number;
  end_hour_meter: number;
  quantity: number;
  amount: number;
  total_amount: number;
  note: string | null;
  class: number;
  center_uuid: string | null;
  /** GAP-BE-602/TASK-BE-1002 (execução 034) — Un. Medida do horímetro,
   *  mirror `stock_items[].measurement`; só presente quando o payload
   *  informou `measurement_uuid` (opcional, fidelidade aditiva v1.0). */
  measurement: AppropriationMeasurementRef | null;
  /** GAP-BE-602/TASK-BE-1002 — URL pública já resolvida
   *  (`Storage::disk('public')->url()`), nunca o path cru do disco (Lei 10). */
  start_hour_photo_url: string | null;
  /** GAP-BE-653 (TASK-FE-716, execução 034) — Foto do Horímetro Final,
   *  exclusiva da Finalização (`PATCH .../finish`); mesmo idioma de
   *  `start_hour_photo_url`, nunca o path bruto (Lei 10). `null` até a
   *  apropriação ser finalizada com foto anexada nesse item. */
  end_hour_photo_url: string | null;
}

export interface AppropriationLaborItemResponse {
  type: 'employee' | 'function' | 'provider';
  person: AppropriationNamedRef;
  quantity: number;
  total_quantity: number;
  amount: number;
  total_amount: number;
  type_payment: LaborPaymentTypeValue | null;
  type_payment_label: string | null;
  expense_generated: boolean;
  class: number;
  center_uuid: string | null;
  /** GAP-BE-643 (execução 034, 4ª leva, AP-25) — Un. Medida do item de MO/
   *  Serviços, mirror `stock_items[].measurement`/`production_items[].
   *  measurement`; só presente quando o payload informou `measurement_uuid`
   *  (opcional, fidelidade aditiva). Catálogo GENÉRICO (sem produto
   *  associado a este item — "não restringir" confirmado pelo Arquiteto
   *  API, ver `AppropriationLaborTab.tsx`). */
  measurement: AppropriationMeasurementRef | null;
}

/** Item de produção — v1.1 §19-E1 (`TASK-BE-998`, JÁ CONSTRUÍDO): matriz de
 *  qualidade + `amount`/`total` são persistência REAL (não mais opcionais de
 *  incerteza de contrato). "(Kg)"/"Estoque"/"Quantidade Final" NÃO existem
 *  aqui — são calculadas em runtime na TELA (`TASK-FE-2709`), nunca no tipo
 *  de payload/resposta. */
export interface AppropriationProductionItemResponse {
  product: AppropriationDescribedRef;
  quantity: number;
  amount: number;
  total: number;
  note: string | null;
  center_uuid: string | null;
  measurement: AppropriationMeasurementRef | null;
  ph: number;
  phm: number;
  damaged: number;
  burned: number;
  others: number;
  impurities: number;
  qb_impurities: number;
  moisture: number;
  qb_moisture: number;
  rate: number;
  qb_technique: number;
  cleaning_drying: number;
  broken: number;
}

/** Imagem de ocorrência — leitura (v1.1 §19-E2, `TASK-BE-999`, JÁ
 *  CONSTRUÍDO): `url` já resolvida pelo backend (`Storage::url()`), nunca o
 *  path cru do disco. */
export interface AppropriationOccurrenceImageResponse {
  latitude: number;
  longitude: number;
  url: string;
}

export interface AppropriationOccurrenceItemResponse {
  diagnosis: string | null;
  recommendation: string | null;
  priority: OccurrencePriorityValue;
  priority_label: string;
  images: AppropriationOccurrenceImageResponse[];
}

export interface AppropriationMovement {
  previous_status: AppropriationStatusValue | null;
  previous_status_label: string | null;
  current_status: AppropriationStatusValue;
  current_status_label: string;
  observation: string | null;
  user: { uuid: string | null; name: string | null };
  created_at: string;
}

// ============================================
// DETALHE (`GET/POST/PUT /appropriations/{uuid}` — Resource completo)
// ============================================

export interface AppropriationDetail extends AppropriationListItem {
  stock_items: AppropriationStockItemResponse[];
  equipment_items: AppropriationEquipmentItemResponse[];
  labor_items: AppropriationLaborItemResponse[];
  production_items: AppropriationProductionItemResponse[];
  occurrences: AppropriationOccurrenceItemResponse[];
  movements: AppropriationMovement[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface AppropriationsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AppropriationsListEnvelope {
  success: boolean;
  message: string;
  data: AppropriationListItem[];
  errors: Record<string, string[]> | null;
  meta: AppropriationsApiPaginationMeta | null;
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT`, mirror 1:1 `AppropriationRequest::rules()`)
// ============================================

export interface AppropriationStockItemPayload {
  product_uuid: string;
  warehouse_uuid: string;
  quantity: number;
  /** v1.1 §19-E3 (interpretação A, `TASK-BE-998/999`-extensão, JÁ
   *  CONSTRUÍDO) — opcional, preserva o comportamento v1.0 quando ausente. */
  measurement_uuid?: string | null;
  /** GAP-BE-601/TASK-BE-1001 (execução 034) — "Qtd Total" real
   *  (`quantity × used_area`, calculada no Front, `TASK-FE-602`/`604`
   *  mecânica). Opcional — ausente, o Repository preserva o fallback v1.0
   *  (`= quantity`). */
  total_quantity?: number | null;
}

export interface AppropriationEquipmentItemPayload {
  equipment_uuid: string;
  start_hour_meter?: number;
  note?: string | null;
  /** GAP-BE-602/TASK-BE-1002 (execução 034) — opcional (REGRA DE OURO
   *  aditiva). */
  measurement_uuid?: string | null;
  /** GAP-BE-602/TASK-BE-1002 — `File` para upload NOVO, `string` (path/URL
   *  já persistido) para MANTER sem reenviar. **Diferente** de Ocorrências:
   *  `null`/omitido aqui É válido e APAGA a foto no update (fidelidade ao
   *  legado, decisão do dono) — por isso o Front SEMPRE reenvia a string
   *  existente quando o usuário não troca a imagem (nunca omite por
   *  engano). */
  start_hour_photo?: File | string | null;
}

export interface AppropriationLaborItemPayload {
  type: LaborTypeValue;
  employee_uuid?: string | null;
  function_uuid?: string | null;
  provider_uuid?: string | null;
  quantity?: number;
  type_payment?: LaborPaymentTypeValue;
  /** GAP-BE-643 (execução 034, 4ª leva, AP-25) — opcional, aditivo, mirror
   *  EXATO de `AppropriationStockItemPayload.measurement_uuid` (Insumos)/
   *  `AppropriationProductionItemPayload.measurement_uuid` (Produção).
   *  Resolve `appropriation_employee.measurement_id` (coluna física já
   *  existente, nullable). */
  measurement_uuid?: string | null;
  /** GAP-BE-650/TASK-FE-686 (AP-30, execução 034, 5ª leva) — "Qtd Total"
   *  real, EDITÁVEL na tela (default `= quantity × used_area`, sobrescrevível
   *  pelo usuário — diferente do padrão puramente-derivado de
   *  `AppropriationStockItemPayload.total_quantity`). Opcional/aditivo,
   *  Opção A do Gap (servidor grava cru, sem recomputar). */
  total_quantity?: number | null;
  /** GAP-BE-650/TASK-FE-686 — "Vl. Unitário", só aplicável no modo
   *  `type_payment='V'` (Valor); opcional/aditivo. */
  amount?: number | null;
  /** GAP-BE-650/TASK-FE-686 — "Vl. Total", calculado no Front
   *  (`total_quantity × amount`) e enviado CRU (Opção A do Gap — o servidor
   *  NÃO recalcula); só aplicável no modo `type_payment='V'`. */
  total_amount?: number | null;
}

/** v1.1 §19-E1 — `amount`/`total` são valores de TELA (sobrescritos no
 *  `finish` por `average_cost`); a matriz de 13 campos é persistência real.
 *  Continua SEM Armazém por item e SEM "(Kg)"/"Estoque"/"Quantidade Final"
 *  (derivadas de tela, nunca no payload). */
export interface AppropriationProductionItemPayload {
  product_uuid: string;
  quantity: number;
  /** TASK-FE-645 (AP-16, execução 034) — opcional, aditivo, mirror EXATO de
   *  `AppropriationStockItemPayload.measurement_uuid` (Insumos). */
  measurement_uuid?: string | null;
  note?: string | null;
  amount?: number;
  total?: number;
  ph?: number;
  phm?: number;
  damaged?: number;
  burned?: number;
  others?: number;
  impurities?: number;
  qb_impurities?: number;
  moisture?: number;
  qb_moisture?: number;
  rate?: number;
  qb_technique?: number;
  cleaning_drying?: number;
  broken?: number;
}

/** Imagem de ocorrência — payload (v1.1 §19-E2). `image` é `File` para
 *  upload NOVO ou `string` (path/URL já persistido) para MANTER sem
 *  reenviar — update não-destrutivo. */
export interface AppropriationOccurrenceImagePayload {
  latitude: number;
  longitude: number;
  image: File | string;
}

export interface AppropriationOccurrenceItemPayload {
  diagnosis?: string | null;
  recommendation?: string | null;
  priority?: OccurrencePriorityValue;
  /** Até 3 por ocorrência — teto CLIENT-SIDE (spec-visual; sem teto
   *  documentado no backend). */
  images?: AppropriationOccurrenceImagePayload[];
}

export interface AppropriationPayload {
  date: string;
  area_uuid: string;
  activity_uuid: string;
  operation_uuid?: string | null;
  warehouse_production_uuid?: string | null;
  cultivation_uuid?: string | null;
  harvest_uuid?: string | null;
  employee_uuid?: string | null;
  used_area?: number | null;
  description?: string | null;
  stock_items: AppropriationStockItemPayload[];
  equipment_items: AppropriationEquipmentItemPayload[];
  labor_items: AppropriationLaborItemPayload[];
  production_items: AppropriationProductionItemPayload[];
  occurrences: AppropriationOccurrenceItemPayload[];
}

// ============================================
// PAYLOAD DE `PATCH .../appropriate` (mirror `AppropriateAppropriationRequest`)
// ============================================

export interface AppropriateItemPayload {
  type: AppropriateItemTypeValue;
  reference_uuid: string;
  center_uuid: string;
  /** "Tipo" da especificação visual — inteiro cru, SEM dicionário de
   *  rótulos confirmado ainda (contrato §17.2 — pendência aberta). */
  class?: number;
  vl_time?: number;
}

export interface AppropriatePayload {
  items?: AppropriateItemPayload[];
}

// ============================================
// PAYLOAD DE `PATCH .../revert-status`
// ============================================

export interface RevertAppropriationStatusPayload {
  observation: string;
}

// ============================================
// PAYLOAD DE `PATCH .../finish` (GAP-BE-653/TASK-BE-1021 + GAP-BE-655/
// TASK-FE-738, execução 034/035 — mirror `FinishAppropriationRequest`/
// `App\Data\Appropriation\Finish*Data`). Design A do Roteiro Cirúrgico:
// delta-sobre-persistido matched por uuid, payload editável INTEIRO numa
// ÚNICA transação (cabeçalho + 4 categorias com máscara sem add/remove +
// `occurrences[]` livre) — substitui o estado interino de `TASK-FE-737`
// que só enviava `equipment_items[]`.
// ============================================

/** Subconjunto EDITÁVEL do cabeçalho (mirror `FinishAppropriationHeaderData`)
 *  — `code`/`user_name`/`total_area` continuam readonly em qualquer
 *  contexto, nunca fazem parte deste payload. Todo campo é opcional no tipo
 *  (mirror `sometimes` do Request — ausência preserva o valor persistido),
 *  mas `FinishAppropriation.tsx` sempre os envia com o valor atual do form
 *  (fidelidade total à edição de cabeçalho da Finalização, GAP-BE-655). */
export interface FinishAppropriationHeaderPayload {
  date?: string;
  description?: string | null;
  area_uuid?: string;
  operation_uuid?: string | null;
  activity_uuid?: string;
  used_area?: number | null;
  cultivation_uuid?: string | null;
  harvest_uuid?: string | null;
}

/** Item de Insumo — mirror `FinishAppropriationStockItemData`. Casamento por
 *  `product_uuid` (não há `stock_uuid` exposto, `App\Stock` ainda sem
 *  `HasUuids` — Lei 10/12). Sem add/remove (máscara §10.3). */
export interface FinishAppropriationStockItemPayload {
  product_uuid: string;
  quantity: number;
  total_quantity?: number | null;
  measurement_uuid?: string | null;
}

export interface FinishAppropriationEquipmentItemPayload {
  equipment_uuid: string;
  end_hour_meter: number;
  /** `File` para upload NOVO. Omitido/`null` = sem foto — campo OPCIONAL por
   *  item no Gap (`nullable`, diferente de `start_hour_photo`, que APAGA a
   *  foto existente quando omitido: aqui não existe foto anterior, é a
   *  1ª gravação deste campo). */
  end_hour_photo?: File | null;
}

/** Item de MO/Serviços — mirror `FinishAppropriationLaborItemData`.
 *  Casamento por `employee_uuid`/`function_uuid`/`provider_uuid` conforme
 *  `type`. SEM `measurement_uuid` (diferente do payload de `store`/`update` —
 *  o DTO/Request de `finish` não declara este campo). Sem add/remove
 *  (máscara §10.3). */
export interface FinishAppropriationLaborItemPayload {
  type: LaborTypeValue;
  type_payment: LaborPaymentTypeValue;
  employee_uuid?: string | null;
  function_uuid?: string | null;
  provider_uuid?: string | null;
  quantity?: number | null;
  total_quantity?: number | null;
  amount?: number | null;
  total_amount?: number | null;
}

/** Item de Produção — mirror `FinishAppropriationProductionItemData`.
 *  Casamento por `product_uuid`. Sem add/remove (máscara §10.3). **SEM
 *  `amount`/`total`** — decisão do dono (premissa nº5, GAP-BE-655): o
 *  backend SEMPRE recalcula esses 2 campos a partir do `average_cost`
 *  convertido no persist; o Front nunca os envia nem tenta replicar o
 *  cálculo. */
export interface FinishAppropriationProductionItemPayload {
  product_uuid: string;
  quantity: number;
  measurement_uuid?: string | null;
  note?: string | null;
  ph?: number;
  phm?: number;
  damaged?: number;
  burned?: number;
  others?: number;
  impurities?: number;
  qb_impurities?: number;
  moisture?: number;
  qb_moisture?: number;
  rate?: number;
  qb_technique?: number;
  cleaning_drying?: number;
  broken?: number;
}

/** Payload único de `PATCH .../finish` (GAP-BE-655) — cabeçalho (topo) + 5
 *  blocos de array. `stock_items`/`labor_items`/`equipment_items`/
 *  `production_items` são "Opção B" (quando a apropriação TEM item
 *  persistido naquela categoria, o array precisa cobrir TODOS os itens —
 *  422 se faltar algum; mirror fidelidade ao legado). Omitido/vazio só é
 *  válido quando a apropriação não tem nenhum item lançado naquela categoria
 *  (D2 simetria). `occurrences[]` é a ÚNICA exceção da máscara — create/
 *  update/delete livres, mesmo DTO de `store`/`update`
 *  (`AppropriationOccurrenceItemPayload`, full-replace no backend). */
export interface FinishAppropriationPayload extends FinishAppropriationHeaderPayload {
  stock_items?: FinishAppropriationStockItemPayload[];
  equipment_items?: FinishAppropriationEquipmentItemPayload[];
  labor_items?: FinishAppropriationLaborItemPayload[];
  production_items?: FinishAppropriationProductionItemPayload[];
  occurrences?: AppropriationOccurrenceItemPayload[];
}

// ============================================
// REACT HOOK FORM (`useForm<AppropriationForm>`) — cabeçalho + 5 listas via
// `useFieldArray`.
// ============================================

export interface AppropriationLaborItemForm {
  type: Option<LaborTypeValue> | null;
  employee_uuid: Option<string> | null;
  function_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  quantity: number | null;
  type_payment: Option<LaborPaymentTypeValue> | null;
  /** GAP-BE-643 (execução 034, 4ª leva, AP-25) — posicionado imediatamente
   *  depois de "Executador" (`AppropriationLaborTab.tsx`); catálogo GENÉRICO
   *  (`listMeasurementOptions`, sem filtro — este item não tem produto
   *  associado, "não restringir" é a fidelidade correta). */
  measurement_uuid: Option<string> | null;
  /** GAP-BE-650/TASK-FE-686 (AP-30, execução 034, 5ª leva) — deixou de ser
   *  "readonly informativo, nunca enviado": agora é campo EDITÁVEL real
   *  (`Controller`+`NumberInput`, `AppropriationLaborTab.tsx`), default
   *  `= quantity × used_area` recalculado ao vivo até o usuário editar
   *  manualmente esta linha, então enviado no payload. */
  total_quantity: number | null;
  /** GAP-BE-650/TASK-FE-686 — "Vl. Unitário", só visível/editável no modo
   *  `type_payment='V'` (Valor). */
  amount: number | null;
  /** GAP-BE-650/TASK-FE-686 — "Vl. Total": NUNCA é campo RHF editável — é
   *  sempre `InputReadOnly` calculado ao vivo (`total_quantity × amount`,
   *  mirror EXATO de `AppropriationProductionItemForm.total`/TASK-FE-660).
   *  Este campo existe só para fidelidade de shape com o objeto de
   *  `handleAdd`/hidratação; nunca lido para cálculo (recomputado sempre no
   *  render e no payload de submit). */
  total_amount?: number | null;
}

/** Foto do horímetro — forma RHF distingue `existingUrl` (já persistida,
 *  URL pública, reenviada SEMPRE que não houver `file` novo — omitir APAGA
 *  a foto, diferente de Ocorrências) de `file` (arquivo novo escolhido
 *  nesta sessão). Mirror `AppropriationOccurrenceImageFormRow`, sem
 *  latitude/longitude (não existem neste campo). */
export interface AppropriationEquipmentPhotoFormRow {
  existingUrl?: string | null;
  file?: File | null;
}

export interface AppropriationEquipmentItemForm {
  equipment_uuid: Option<string> | null;
  start_hour_meter: number | null;
  note: string | null;
  /** Create/edit (`lockIdentityFields=false`): readonly informativo
   *  (calculado só na Finalização), nunca enviado — comportamento
   *  INALTERADO. Finalização (`lockIdentityFields=true`, TASK-FE-733): vira
   *  um `Controller`+`NumberInput` REAL, obrigatório, validado por
   *  `finishAppropriationSchemaResolver` (`≥ start_hour_meter`,
   *  TASK-FE-730) — mesmo campo do type, dois modos de uso. `null`
   *  (TASK-FE-737) = ainda não finalizado, campo obrigatório vazio
   *  aguardando o usuário preencher na Finalização. */
  end_hour_meter?: number | null;
  amount?: number;
  /** GAP-BE-602/TASK-BE-1002 (execução 034) — Un. Medida do horímetro. */
  measurement_uuid: Option<string> | null;
  /** GAP-BE-602/TASK-BE-1002 — `null` = sem foto (nunca teve OU usuário
   *  removeu explicitamente). */
  start_hour_photo: AppropriationEquipmentPhotoFormRow | null;
  /** TASK-FE-730/733 (GAP-BE-653/GAP-BE-655) — Foto do Horímetro Final,
   *  exclusiva da Finalização (`lockIdentityFields=true`); mirror EXATO de
   *  `start_hour_photo` (mesmo shape de linha, reaproveitado, não
   *  duplicado). OPCIONAL (decisão do dono, 2026-08-11) — sem `.test()` de
   *  presença no schema. Nunca renderizado/lido em create/edit. */
  end_hour_photo?: AppropriationEquipmentPhotoFormRow | null;
}

export interface AppropriationStockItemForm {
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
  quantity: number | null;
  measurement_uuid: Option<string> | null;
  /** Unidade de medida do Produto selecionado — texto auxiliar readonly,
   *  nunca enviado (distinto de `measurement_uuid`, que É enviado). */
  product_um_label?: string | null;
  /** TASK-FE-730/734 (GAP-BE-655) — "Qtd Total". Create/edit
   *  (`lockIdentityFields=false`): campo AUSENTE do form, "Qtd Total"
   *  continua `InputReadOnly` puramente derivada de tela
   *  (`quantity × used_area`, `AppropriationStockTab.tsx`), comportamento
   *  INALTERADO. Finalização (`lockIdentityFields=true`): editável real,
   *  DEFAULT `= quantity × used_area` recalculado ao vivo até o usuário
   *  editar manualmente (mirror EXATO `AppropriationLaborItemForm.
   *  total_quantity`, GAP-BE-650/TASK-FE-686). */
  total_quantity?: number | null;
}

export interface AppropriationProductionItemForm {
  product_uuid: Option<string> | null;
  /** TASK-FE-645 (AP-16, execução 034) — mirror EXATO de
   *  `AppropriationStockItemForm.measurement_uuid` (Insumos): Select
   *  independente (`listMeasurementOptions`), sem auto-preenchimento a
   *  partir do Produto. */
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  note: string | null;
  amount: number | null;
  total: number | null;
  ph: number | null;
  phm: number | null;
  damaged: number | null;
  burned: number | null;
  others: number | null;
  impurities: number | null;
  qb_impurities: number | null;
  moisture: number | null;
  qb_moisture: number | null;
  rate: number | null;
  qb_technique: number | null;
  cleaning_drying: number | null;
  broken: number | null;
}

/** Imagem — forma RHF distingue `existing` (já persistida, path/URL, nunca
 *  reenviada) de `file` (arquivo novo escolhido nesta sessão). */
export interface AppropriationOccurrenceImageFormRow {
  latitude: number;
  longitude: number;
  /** Presente quando a imagem já existe no servidor (edição). */
  existingUrl?: string | null;
  /** Presente quando é um arquivo NOVO escolhido nesta sessão. */
  file?: File | null;
}

export interface AppropriationOccurrenceItemForm {
  diagnosis: string | null;
  recommendation: string | null;
  priority: Option<OccurrencePriorityValue> | null;
  images: AppropriationOccurrenceImageFormRow[];
}

export interface AppropriationForm {
  date: string | null;
  area_uuid: Option<string> | null;
  /** Readonly — RÓTULO "Área Total" (fidelidade ao legado), VALOR lido de
   *  `AreaListItem.productive_area` no momento da seleção (`TASK-FE-2707`;
   *  alinhado ao legado + `AppropriationRequest::rules()`, que valida
   *  `used_area ≤ productive_area`, NUNCA `total_area`), nunca um campo de
   *  payload. */
  area_total: number | null;
  activity_uuid: Option<string> | null;
  operation_uuid: Option<string> | null;
  warehouse_production_uuid: Option<string> | null;
  cultivation_uuid: Option<string> | null;
  harvest_uuid: Option<string> | null;
  employee_uuid: Option<string> | null;
  used_area: number | null;
  description: string | null;
  stock_items: AppropriationStockItemForm[];
  equipment_items: AppropriationEquipmentItemForm[];
  labor_items: AppropriationLaborItemForm[];
  production_items: AppropriationProductionItemForm[];
  occurrences: AppropriationOccurrenceItemForm[];
}

// ============================================
// FILTRO (drawer da listagem — `AppropriationFilterData`)
// ============================================

export interface AppropriationFilterForm {
  status?: AppropriationStatusValue;
  area_uuid?: string;
  /** DISPLAY-ONLY — re-hidrata o label do `SelectAsyncPaginate` de Área sem
   *  novo fetch ao reabrir o drawer. */
  area_label?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// RELATÓRIO — Apontamento Máquina (Tarefa 46, frontend-contract-
// apontamento-maquina.md §4). Adendo à casa própria já existente
// (`Operacional/Appropriations`) — mirror EXATO de `EvolutionReportFilterForm`/
// `EvolutionReportParams` (`@types/v2/Evolutions`).
// ============================================

/** Forma do formulário de página cheia do relatório — ambas obrigatórias no
 *  schema Yup (`end_date >= start_date`). */
export interface AppropriationEquipmentReportFilterForm {
  start_date: string | null;
  end_date: string | null;
}

/** Querystring real de `GET /appropriation-equipments-report` — `type=1`
 *  vira `.xlsx`; ausente (ou qualquer outro valor) vira `.pdf`. */
export interface AppropriationEquipmentReportParams {
  start_date: string;
  end_date: string;
  type?: 1;
}

// Reexport de conveniência (mirror `EquipmentForm`/`InvoiceForm`).
export type { Option };
