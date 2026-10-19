// src/@types/v2/ServiceOrders/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo OPERACIONAL — Ordens de Serviço (ServiceOrder) — domínio
// PRÓPRIO (mirror `Appropriations`/`Transfers`), TASK-FE-2001 (execução 038,
// esteira `97-Esteiras/038`). SÓ LEITURA/EXCLUSÃO — 100% uuid, estável e
// independente do bloqueio de escrita (D-FRONT-01: FKs de escrita são `id`
// numérico, ver `00-PLANO-FRONTEND-lista-os.md` §3). Modelado por leitura
// direta de `ServiceOrderResource.php` (listagem) e
// `ServiceOrderDetailResource.php` (detalhe), branch `feature/038-lista-de-os`
// do `GB.Cerne.Api`.
//
//   GET    /service-orders          → paginado (envelope `meta`), listagem
//                                      ENXUTA (`ServiceOrderResource`)
//   GET    /service-orders/{uuid}   → detalhe completo (`ServiceOrderDetailResource`)
//   DELETE /service-orders/{uuid}   → exclusão
//
// D-FRONT-01 (RESOLVIDA, execução 038 — decisão do dono, opção A): as FKs de
// escrita transportam `uuid` (alinhamento ao padrão `_uuid` já usado por
// `Area`/`ProductionCycle`/`Appropriation`). TASK-FE-2004 (esta seção)
// adiciona os tipos de form/payload de escrita, modelados por leitura direta
// de `ServiceOrderRequest.php`/`ServiceOrderData.php` (branch
// `feature/038-lista-de-os` do `GB.Cerne.Api`):
//
//   POST   /service-orders          → cabeçalho + 5 blocos inline
//   PUT    /service-orders/{uuid}   → idem (update recria pivôs integralmente)
//
// `farm_id`/`service_farm_id`/`user_id` NUNCA vão no payload (DEC-LOS-07,
// resolvidos no servidor). Execução 086 (DP-1 do dono REVERTEU DEC-LOS-03/
// CLM-034): `employees[]` de leitura (`ServiceOrderEmployeeRow`) agora expõe
// `type` (1/2/3) + `employee_uuid|function_uuid|provider_uuid` + `label`, e
// todos os blocos ganharam `label` (aditivo, null-safe) — o edit hidrata os 5
// blocos (ver `service-order-form-mapper.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// STATUS (`ServiceOrderStatus` backend, backed int — 1/2/3/4/9)
// ============================================

/** `ServiceOrderStatus` — 1=Aberta, 2=Em Execução, 3=Concluída,
 *  4=Avaliado, 9=Cancelada. */
export type ServiceOrderStatusValue = 1 | 2 | 3 | 4 | 9;

export interface ServiceOrderStatusRef {
  value: ServiceOrderStatusValue;
  label: string;
  /** Hex cru do backend (`ServiceOrderStatus::color()`) — NUNCA consumir
   *  direto (Passo UX). Mapear por `SERVICE_ORDER_STATUS_META`
   *  (`serviceOrderStatus.ts`). */
  color: string;
}

// ============================================
// REFS ANINHADOS (leitura, mirror dos Resources reais — sempre uuid+name)
// ============================================

export interface ServiceOrderNamedRef {
  uuid: string;
  name: string;
}

/** `area` do detalhe (execução 086, API-03c) — mesmas chaves de
 *  `/areas/options`: `productive_area` alimenta Qtd Total = Qtd/ha × área. */
export interface ServiceOrderAreaRef extends ServiceOrderNamedRef {
  description?: string;
  productive_area?: number;
}

// ============================================
// LISTAGEM (`GET /service-orders` — `ServiceOrderResource`, enxuta, SEM os 5
// blocos de detalhe).
// ============================================

export interface ServiceOrderListItem {
  uuid: string;
  code: string;
  dt_emission: string | null;
  execution_date: string | null;
  deadline: string | null;
  status: ServiceOrderStatusRef;
  operation?: ServiceOrderNamedRef | null;
  activity?: ServiceOrderNamedRef | null;
  area?: ServiceOrderNamedRef | null;
  created_at: string | null;
}

// ============================================
// BLOCOS DE LEITURA (detalhe — cada shape mirror 1:1 do
// `ServiceOrderDetailResource` real)
// ============================================

/** Mão de obra — execução 086 (DP-1 reverte DEC-LOS-03): `type`
 *  (1=Funcionário, 2=Função, 3=Fornecedor, mesmo domínio do `func_type` do
 *  form) + só o uuid do tipo preenchido (os outros `null`) + `label`
 *  (nome resolvido). `type`/uuids `null` = linha órfã (FK inexistente). */
export interface ServiceOrderEmployeeRow {
  id: number;
  type: ServiceOrderLaborTypeValue | null;
  employee_uuid: string | null;
  function_uuid: string | null;
  provider_uuid: string | null;
  label: string | null;
  note: string | null;
  is_checked: boolean;
}

/** `equipment_uuid`/`label` `null` = FK órfã (nunca 500 — execução 086). */
export interface ServiceOrderEquipmentRow {
  equipment_uuid: string | null;
  label: string | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderWarehouseRef {
  uuid: string;
  /** `description` do armazém (a API atual NÃO envia a sigla). */
  label: string;
  /** Sigla (`initials`) — opcional: lacuna na API; quando presente o mapper
   *  reproduz o label do select de criação (`SIGLA — descrição`). */
  initials?: string | null;
}

export interface ServiceOrderProductRow {
  stock_uuid: string | null;
  /** Descrição do produto do estoque (nome exibido). */
  label: string | null;
  product_description: string | null;
  measurement_uuid: string | null;
  measurement_name: string | null;
  /** `description` da unidade ("Quilograma") — opcional: lacuna na API (hoje só `name`="kg"). */
  measurement_description?: string | null;
  warehouse: ServiceOrderWarehouseRef | null;
  /** Saldo atual do estoque (alerta de estoque do form). */
  stock_quantity: number | null;
  quantity: number;
  total_quantity: number;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderProductionRow {
  product_uuid: string | null;
  label: string | null;
  measurement_uuid: string | null;
  measurement_name: string | null;
  /** `description` da unidade — opcional: lacuna na API (hoje só `name`). */
  measurement_description?: string | null;
  quantity: number;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderProtectionRow {
  product_uuid: string | null;
  label: string | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderAttachment {
  uuid: string;
  name: string | null;
  filename: string | null;
  /** `null` quando o anexo não tem arquivo. */
  url: string | null;
}

// ============================================
// DETALHE (`GET /service-orders/{uuid}` — `ServiceOrderDetailResource`)
// ============================================

export interface ServiceOrderDetail {
  uuid: string;
  code: string;
  dt_emission: string | null;
  execution_date: string | null;
  deadline: string | null;
  category: number;
  /** Rótulo do uso (`OperationUse::label()`); `null` se fora do domínio. */
  category_label?: string | null;
  status: ServiceOrderStatusRef;
  weather_requirements: string | null;
  minimum_temperature: number | null;
  maximum_temperature: number | null;
  allowed_working_period_start: string | null;
  allowed_working_period_end: string | null;
  environmental_restrictions: string | null;
  legal_compliance: string | null;
  service_description: string | null;
  expected_result_description: string | null;
  success_criteria_description: string | null;
  roadmap_description: string | null;
  // Campos de execução/avaliação — READ-ONLY nesta feature (exibidos no
  // show, NUNCA editáveis; o ciclo de execução/avaliação é outra
  // FEATURE_ROOT, ver §2.4 do plano).
  execution_start_date: string | null;
  execution_end_date: string | null;
  execution_problems: string | null;
  corrective_actions: string | null;
  assessment_grade: number | null;
  rating_date: string | null;
  feedback: string | null;
  recommendations: string | null;
  // Cancelamento (execução 086) — preenchidos só com status 9 (Cancelada).
  cancellation_reason?: string | null;
  cancellation_date?: string | null;
  cancellation_user?: ServiceOrderNamedRef | null;
  area?: ServiceOrderAreaRef | null;
  cultivation?: ServiceOrderNamedRef | null;
  batch?: ServiceOrderNamedRef | null;
  category_animal?: ServiceOrderNamedRef | null;
  operation?: ServiceOrderNamedRef | null;
  activity?: ServiceOrderNamedRef | null;
  user?: ServiceOrderNamedRef | null;
  executor?: ServiceOrderNamedRef | null;
  // 5 blocos — condicionais (`relationLoaded()` no backend); ausentes
  // (`undefined`) quando a relação não foi carregada, vazios (`[]`) quando
  // carregada mas sem linhas. A tela trata os dois casos como "seção vazia".
  employees?: ServiceOrderEmployeeRow[];
  equipments?: ServiceOrderEquipmentRow[];
  products?: ServiceOrderProductRow[];
  productions?: ServiceOrderProductionRow[];
  protections?: ServiceOrderProtectionRow[];
  attachments?: ServiceOrderAttachment[];
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// CANCELAR OS (`POST /service-orders/{uuid}/cancel`, execução 086) —
// permissão `service-orders_cancel`, só status 1/2 (422 caso contrário).
// ============================================

export interface CancelServiceOrderPayload {
  /** 5..1000 caracteres (`CancelServiceOrderRequest`). */
  cancellation_reason: string;
}

export interface CancelServiceOrderForm {
  cancellation_reason: string;
}

// ============================================
// FILTRO (drawer da listagem — `ServiceOrderFilterData`)
// ============================================

export interface ServiceOrderFilterForm {
  code?: string;
  /** Aplicado a `dt_emission` (contrato §2.3 do plano). */
  start_date?: string;
  end_date?: string;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface ServiceOrdersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ServiceOrdersListEnvelope {
  success: boolean;
  message: string;
  data: ServiceOrderListItem[];
  errors: Record<string, string[]> | null;
  meta: ServiceOrdersApiPaginationMeta | null;
}

// ============================================
// OPTIONS-SOURCE EXCLUSIVOS DA OS (TASK-FE-2004, D-FRONT-01/04 resolvidos) —
// os 5 lookups `/{recurso}/options` criados nesta execução (`UserOption`/
// `OperationOptionResource`/`ActivityOptionResource`/`AreaOptionResource`
// backend), casa própria (não pertencem a nenhum domínio Users/Operations/
// Activities/Areas existente — Resources exclusivos do form de OS, ver
// docblocks respectivos no `api_root`). `equipments/options` REUTILIZA
// `EquipmentOption` (`@/@types/v2/Equipments`, `listEquipmentCatalogOptions`)
// — não duplicado aqui.
// ============================================

/** `GET /users/options` — lookup do select "Responsável" (executor). */
export interface ServiceOrderExecutorOption {
  uuid: string;
  name: string | null;
}

export interface ServiceOrderExecutorOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ServiceOrderExecutorOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

/** `GET /operations/options?category=` — lookup do select "Operação",
 *  filtrado pela cascata `category` (IG-02 do contrato legado). */
export interface ServiceOrderOperationOption {
  uuid: string;
  name: string;
}

export interface ServiceOrderOperationOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ServiceOrderOperationOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ServiceOrderOperationOption[];
  errors: Record<string, string[]> | null;
  meta: ServiceOrderOperationOptionsApiPaginationMeta | null;
}

/** `GET /activities/options?operation_uuid=` — lookup do select "Atividade",
 *  filtrado pela cascata `operation_uuid` (IG-03 do contrato legado). */
export interface ServiceOrderActivityOption {
  uuid: string;
  name: string;
}

export interface ServiceOrderActivityOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ServiceOrderActivityOption[];
  errors: Record<string, string[]> | null;
  meta: ServiceOrderOperationOptionsApiPaginationMeta | null;
}

/** `GET /areas/options` — lookup do select "Área". `productive_area`
 *  (exec-038 HOMOLOG R2, aditivo — `AreaOptionResource::toArray()` passou a
 *  expor `areas.productive_area`) alimenta o cálculo "Qtd Total = Qtd/ha ×
 *  área produtiva" do bloco Insumos (`ServiceOrderProductTab.tsx`),
 *  resolvendo o GAP residual CV-04/05 do legado. */
export interface ServiceOrderAreaOption {
  uuid: string;
  description: string;
  productive_area: number;
}

export interface ServiceOrderAreaOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ServiceOrderAreaOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// FORM (`useForm<ServiceOrderForm>`) — cabeçalho + 5 listas via
// `useFieldArray`. Mirror estrutural `AppropriationForm`.
// ============================================

/** `func_type` da linha de mão de obra — mesmo domínio 1/2/3 de
 *  `LaborTypeValue` (`AppropriationForm`), mirror EXATO (IG-04/05/06 do
 *  contrato legado: func_type=1→employees, 2→functions, 3→providers). Só
 *  existe no FORM (UI, decide qual dos 3 selects mostrar) — NUNCA vai no
 *  payload (o backend infere pelo campo `*_uuid` preenchido).
 */
export type ServiceOrderLaborTypeValue = 1 | 2 | 3;

export interface ServiceOrderEmployeeItemForm {
  func_type: Option<ServiceOrderLaborTypeValue> | null;
  employee_uuid: Option<string> | null;
  function_uuid: Option<string> | null;
  provider_uuid: Option<string> | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderEquipmentItemForm {
  equipment_uuid: Option<string> | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderProductItemForm {
  /** exec-038 HOMOLOG R2 (R2-05) — "Produto" desta linha é, na prática, o
   *  `Stock` físico escolhido (mirror `AppropriationStockItemForm`, mas
   *  aqui a option É o `stock_uuid` — `StockAvailabilityResource` passou a
   *  expor `uuid` próprio do registro de Stock, exec-038 HOMOLOG R2). Vai
   *  direto ao payload como `stock_uuid`. */
  stock_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  total_quantity: number | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderProductionItemForm {
  product_uuid: Option<string> | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderProtectionItemForm {
  product_uuid: Option<string> | null;
  note: string | null;
  is_checked: boolean;
}

export interface ServiceOrderForm {
  code: string | null;
  executor_uuid: Option<string> | null;
  dt_emission: string | null;
  execution_date: string | null;
  deadline: string | null;
  /** `category` (int, 1=Ambos/2=Agricultura/3=Pecuária — `OperationUse`) —
   *  discriminador de contexto de área, dispara a cascata de Operações
   *  (IG-02) e a habilitação de cultivo/lote/categoria animal (IG-01,
   *  `ServiceOrderHeaderFields.tsx`). Fábrica estática
   *  `getServiceOrderCategoryOptions` (mirror `getServiceOrderStatusOptions`),
   *  sem endpoint remoto. */
  category: Option<number> | null;
  operation_uuid: Option<string> | null;
  activity_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  cultivation_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  weather_requirements: string | null;
  minimum_temperature: number | null;
  maximum_temperature: number | null;
  allowed_working_period_start: string | null;
  allowed_working_period_end: string | null;
  environmental_restrictions: string | null;
  legal_compliance: string | null;
  service_description: string | null;
  expected_result_description: string | null;
  success_criteria_description: string | null;
  roadmap_description: string | null;
  employees: ServiceOrderEmployeeItemForm[];
  equipments: ServiceOrderEquipmentItemForm[];
  /** exec-038 HOMOLOG R2 (R2-05) — "Armazém de insumos" do BLOCO (1 para
   *  TODOS os itens, mirror `AppropriationForm` não ter isso — aqui é mais
   *  parecido com `warehouse_production_uuid`, um campo de CABEÇALHO da
   *  aba, fora do `useFieldArray`). UI-ONLY: escopa o catálogo de "Produto"
   *  (`listStockAvailability`) de TODAS as linhas de `products[]`; nunca
   *  vai ao payload (`ServiceOrderProductTab.tsx`). */
  products_warehouse_uuid: Option<string> | null;
  products: ServiceOrderProductItemForm[];
  /** exec-038 HOMOLOG R2 (R2-06) — "Armazém" do BLOCO Produção, mirror
   *  `AppropriationForm.warehouse_production_uuid`. UI-ONLY: alimenta o
   *  `useQuery` de "Estoque" por linha (`GET /stocks/available?
   *  warehouse_uuid=&product_uuid=`); nunca vai ao payload
   *  (`ServiceOrderProductionTab.tsx`). */
  productions_warehouse_uuid: Option<string> | null;
  productions: ServiceOrderProductionItemForm[];
  protections: ServiceOrderProtectionItemForm[];
}

// ============================================
// PAYLOAD DE ESCRITA (`POST`/`PUT`, mirror 1:1 `ServiceOrderRequest::rules()`/
// `ServiceOrderData`) — TODAS as FKs em `uuid` (D-FRONT-01 opção A).
// ============================================

export interface ServiceOrderEmployeeItemPayload {
  employee_uuid?: string | null;
  function_uuid?: string | null;
  provider_uuid?: string | null;
  note?: string | null;
  is_checked?: boolean;
}

export interface ServiceOrderEquipmentItemPayload {
  equipment_uuid: string;
  note?: string | null;
  is_checked?: boolean;
}

export interface ServiceOrderProductItemPayload {
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  total_quantity: number;
  note?: string | null;
  is_checked?: boolean;
}

export interface ServiceOrderProductionItemPayload {
  product_uuid: string;
  measurement_uuid: string;
  quantity: number;
  note?: string | null;
  is_checked?: boolean;
}

export interface ServiceOrderProtectionItemPayload {
  product_uuid: string;
  note?: string | null;
  is_checked?: boolean;
}

/** Payload único de `POST`/`PUT` — cabeçalho + 5 blocos de array.
 *  `farm_id`/`service_farm_id`/`user_id` NUNCA fazem parte deste tipo
 *  (DEC-LOS-07 — resolvidos no servidor). */
export interface ServiceOrderPayload {
  code: string;
  executor_uuid: string;
  dt_emission: string;
  execution_date: string;
  deadline: string;
  category: number;
  operation_uuid: string;
  activity_uuid: string;
  area_uuid: string;
  cultivation_uuid?: string | null;
  batch_uuid?: string | null;
  category_uuid?: string | null;
  weather_requirements?: string | null;
  minimum_temperature?: number | null;
  maximum_temperature?: number | null;
  allowed_working_period_start?: string | null;
  allowed_working_period_end?: string | null;
  environmental_restrictions?: string | null;
  legal_compliance?: string | null;
  service_description?: string | null;
  expected_result_description?: string | null;
  success_criteria_description?: string | null;
  roadmap_description?: string | null;
  employees: ServiceOrderEmployeeItemPayload[];
  equipments: ServiceOrderEquipmentItemPayload[];
  products: ServiceOrderProductItemPayload[];
  productions: ServiceOrderProductionItemPayload[];
  protections: ServiceOrderProtectionItemPayload[];
}

// Reexport de conveniência (mirror `Appropriations`/`Transfers`).
export type { Option };
