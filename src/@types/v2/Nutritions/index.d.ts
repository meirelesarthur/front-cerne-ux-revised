// src/@types/v2/Nutritions/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Nutrição" (Nutrition — Operacional / Consumo de Ração,
// TASK-NT-FE-01). Fundação de dados greenfield no front (nada existia em
// `src/@types/v2/` para `Nutrition`). Mirror estrutural de
// `WarehouseTransfers/index.d.ts`/`FoodBeats/index.d.ts` (fachada CRUD +
// granularidade por item dinâmico) sobre o Model `Nutrition`/`ItemNutrition`/
// `NutritionEmployee` (backend `Nutrition-contrato.md`, APROVADO, Ciclo 3).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /nutritions                  → data: NutritionListItem[] + meta
//                                          paginação real (filtros
//                                          start_date/end_date/product_uuid/
//                                          batch_uuid/employee_uuid, §3.1).
//   GET    /nutritions/{uuid}           → data: NutritionData (eager-load
//                                          completo, items[]+employees[]).
//   POST   /nutritions                  → payload NutritionPayload → data:
//                                          NutritionData.
//   PUT/PATCH /nutritions/{uuid}        → payload NutritionPayload (mesmo
//                                          shape, diff por `uuid` em cada
//                                          item/employee — `DA-NT-11`).
//   DELETE /nutritions/{uuid}           → fiel ao legado, SEM reversão de
//                                          estoque (`GAP-NT-01` [PARA ANÁLISE]).
//
//   GET /nutritions/lookups/warehouses                              → WarehouseLookupItem[]
//   GET /nutritions/lookups/products                                → ProductLookupItem[]
//   GET /nutritions/lookups/products-by-warehouse/{warehouse:uuid}  → ProductLookupItem[]
//   GET /nutritions/lookups/warehouses-by-product/{product:uuid}    → WarehouseLookupItem[]
//   GET /nutritions/lookups/warehouse-stock/{warehouse:uuid}/{product:uuid} → WarehouseStockLookup
//   GET /nutritions/lookups/troughs                                 → TroughLookupItem[]
//   (`DA-NT-05`, sem `farmId` na URL — `X-Farm-Id` já propaga via interceptor)
//
// `qnt_stock` (`FLD-08`) NUNCA é persistido/aparece no Resource (`DA-NT-04`) —
// é DISPLAY-ONLY, resolvido ao vivo via `getWarehouseStock`. Modelado como
// estado derivado no formulário (`NutritionItemForm.qnt_stock`), nunca em
// `ItemNutritionPayload`.
//
// `product_id`/`diet_beat_id` (dieta automática, `CALC-01`) e `area_id`/
// `grazing_id` (`FLD-10`) são pares MUTUAMENTE EXCLUSIVOS — modelados como 2
// campos opcionais cada, NUNCA union (a regra de exclusão é de UI/schema,
// fora do escopo desta Tarefa — ver `TASK-NT-FE-03`).
//
// `warehouse_id`/`warehouse_uuid` é campo de ENTRADA client-side (`DA-NT-06`)
// — usado só para filtrar o dropdown de produto/resolver o `stock_uuid` no
// backend, nunca uma 2ª fonte de verdade persistida.
//
// `measurement_uuid` (`DA-NT-13`/`GAP-NT-07`, ADITIVO ao draft original desta
// Tarefa) — medida do lançamento por item (primária/secundária do produto),
// ausência = medida primária sem conversão. Incluído aqui como campo
// OPCIONAL de entrada (`ItemNutritionPayload`/`NutritionItemForm`) por ser a
// fonte de verdade mais recente do `Nutrition-contrato.md §3.3` (Inspeção
// Obrigatória da Tarefa) — sem isso `CALC-01`/`CALC-02` não seriam fiéis.
//
// `func_type` (`DA-NT-07`, enum backed 1/2/3) é sempre `Option<FuncType>` no
// formulário — NUNCA `string`/`number` cru — a options factory
// (`func-type-options.ts`) resolve o rótulo (Funcionário/Função/Fornecedor).
//
// Diff de itens/mão-de-obra por `uuid` OPCIONAL no payload (`DA-NT-11`,
// substitui o hidden `old_nutritions[]` do legado, `FLD-15`): presente e
// existente = update in-place; ausente = criar; item atual sem `uuid` no
// payload = deletar. Mesmo mecanismo para `employees[]`.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM `FuncType` — union literal backed int (mirror `DA-NT-07`).
// 1: Funcionário, 2: Função, 3: Fornecedor.
// ============================================

export type FuncType = 1 | 2 | 3;

// ============================================
// REFS ANINHADAS (resposta da API — mirror shape de Resource, nomes
// conforme `Nutrition-contrato.md §3.5`)
// ============================================

export interface NutritionTroughRef {
  uuid: string;
  description: string;
}

export interface NutritionProductRef {
  uuid: string;
  description: string;
  measurement: string;
}

export interface NutritionBatchRef {
  uuid: string;
  name: string;
}

export interface NutritionCostCenterRef {
  uuid: string;
  description: string;
}

export interface NutritionEmployeeExecutorRef {
  uuid: string;
  name: string;
}

/** ADITIVO (achado do Executor, `TASK-NT-FE-03`) — `NutritionItemData` (abaixo)
 *  não trazia `area`/`grazing` no draft original da fundação (`TASK-NT-FE-01`),
 *  impossibilitando a re-hidratação em edição de `FLD-10` (mutuamente
 *  exclusivos). Mesmo racional de `DA-NT-13`/`GAP-NT-07` (`measurement_uuid`) —
 *  o formulário JÁ ENVIA `area_uuid`/`grazing_uuid` no payload
 *  (`ItemNutritionPayload`); o Resource deve ecoar a relação persistida de
 *  volta pelo mesmo par `{uuid, description}` dos demais refs deste arquivo.
 *  Se o backend real não devolver este campo, a tela degrada para o mesmo
 *  estado honesto de `qnt_stock` (vazio até o usuário reselecionar) — SEM
 *  MOCK, nenhuma tentativa de adivinhar o valor. */
export interface NutritionAreaRef {
  uuid: string;
  description: string;
}

/** Ver `NutritionAreaRef` acima — mesmo racional para `grazing`. */
export interface NutritionGrazingRef {
  uuid: string;
  description: string;
}

// ============================================
// NUTRITION (resposta da API)
// ============================================

/** `GET /nutritions` (index) — linha da listagem (`LST-01`). */
export interface NutritionListItem {
  uuid: string;
  code: string;
  date: string;
  /** `COALESCE people.name` (mirror `LST-01`) — funcionário OU usuário
   *  responsável, já resolvido pelo backend. */
  employee_or_user_name: string;
  areas_grazings: string;
  /** `GROUP_CONCAT` no legado — string pré-formatada pelo backend. */
  batches: string;
  /** subquery no legado — string pré-formatada pelo backend. */
  products: string;
  quantity_total: number;
  time_control: boolean;
  created_at: string;
}

/** Linha do array `items[]` — `GET /nutritions/{uuid}` (show). `qnt_stock`
 *  NUNCA aparece aqui (`DA-NT-04`) — resolvido ao vivo via lookup, nunca
 *  persistido. */
export interface NutritionItemData {
  uuid: string;
  trough: NutritionTroughRef;
  product: NutritionProductRef | null;
  /** Dieta automática — mutuamente exclusivo com `product` (`CALC-01`). */
  diet_beat_uuid: string | null;
  quantity: number;
  note_item: string | null;
  cost_center: NutritionCostCenterRef | null;
  batches: NutritionBatchRef[];
  /** ADITIVO (`TASK-NT-FE-03`, ver `NutritionAreaRef` acima) — mutuamente
   *  exclusivo com `grazing` (`FLD-10`). `null` = não persistido/não
   *  devolvido pelo backend (estado honesto, sem invenção). */
  area?: NutritionAreaRef | null;
  /** ADITIVO — ver `area` acima. */
  grazing?: NutritionGrazingRef | null;
  /** TASK-095-R2-02 — armazém da ficha de estoque do item (`null` = item de
   *  dieta automática ou legado sem estoque). Pode ser armazém excluído
   *  logicamente (continua vindo no GET). */
  warehouse?: { uuid: string; description: string } | null;
  /** TASK-095-R2-02 — ficha de estoque (`stocks`) usada na baixa. */
  stock?: { uuid: string } | null;
  /** TASK-095-R2-02 — nome da medida gravada no item. */
  um?: string | null;
}

/** Linha do array `employees[]` — só populada se `time_control=true`. */
export interface NutritionEmployeeData {
  uuid: string;
  func_type: FuncType;
  func_executor: NutritionEmployeeExecutorRef;
  func_um: string;
  func_total_quantity: number;
}

/** `GET /nutritions/{uuid}` — eager-load completo, itens + mão-de-obra. */
export interface NutritionData {
  uuid: string;
  code: string;
  date: string;
  time_control: boolean;
  /** `COALESCE` funcionário > usuário (mirror legado), resolvido pelo backend
   *  também no `show`. `null` = sem responsável resolvido. */
  employee_or_user_name?: string | null;
  items: NutritionItemData[];
  employees: NutritionEmployeeData[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /nutritions)
// ============================================

export interface NutritionsApiPaginationMeta {
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

export interface NutritionsListEnvelope {
  success: boolean;
  message: string;
  data: NutritionListItem[];
  errors: Record<string, string[]> | null;
  meta: NutritionsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-NT-FE-02 — Contrato B). `FLT-01/02/04/05`
// + `FLT-03` (`employee_uuid`, preservado na API mesmo sem `<select>`
// confirmado na view legada — `CLM-08`, LACUNA de UI, decisão de exibição em
// TASK-NT-FE-02, não removido aqui).
// ============================================

export interface NutritionFilterForm {
  start_date?: string;
  end_date?: string;
  product_uuid?: Option | null;
  batch_uuid?: Option | null;
  employee_uuid?: Option | null;
}

/** Querystring real de `GET /nutritions` (`Nutrition-contrato.md §3.1`). */
export interface NutritionFilterRequest {
  start_date?: string;
  end_date?: string;
  product_uuid?: string;
  batch_uuid?: string;
  employee_uuid?: string;
}

// ============================================
// REACT HOOK FORM — item dinâmico + mão-de-obra condicional (TASK-NT-FE-03)
// ============================================

/**
 * Linha do array `items[]`. Nomes fiéis ao `field_manifest` (`FLD-05..14`).
 * `warehouse_id`/`qnt_stock`/`product_um` são CLIENT-ONLY (nunca no payload).
 */
export interface NutritionItemForm {
  /** presente = update in-place; ausente = criar (`DA-NT-11`). */
  uuid?: string;
  /** `FLD-05`, client-only — filtra o dropdown de produto/resolve o
   *  `stock_uuid` no backend, nunca persistido diretamente. */
  warehouse_id: Option | null;
  /** `FLD-06` — mutuamente exclusivo com `diet_beat_id` (`CALC-01`). */
  product_id: Option | null;
  /** Dieta automática — mutuamente exclusivo com `product_id`. */
  diet_beat_id: Option | null;
  /** `FLD-07`, readonly, autofill do lookup de produto/estoque. */
  product_um: string;
  /** `FLD-08`, DISPLAY-ONLY, resolvido ao vivo (`DA-NT-04`) — NUNCA no
   *  payload, nunca `dirtyFields`. */
  qnt_stock: number | null;
  /** `FLD-09`. */
  quantity: number | string;
  /** `FLD-10` — mutuamente exclusivo com `grazing_id`. */
  area_id: Option | null;
  /** `FLD-10` — mutuamente exclusivo com `area_id`. */
  grazing_id: Option | null;
  /** `FLD-11`, obrigatório. */
  trough_id: Option | null;
  /** `FLD-12`. */
  note_item: string;
  /** `FLD-13`. */
  cost_center_id: Option | null;
  /** `FLD-14` — uuids marcados (checkbox), min 1. */
  batches: string[];
  /** `DA-NT-13`/`GAP-NT-07` (ADITIVO) — medida do lançamento (primária ou
   *  secundária do produto); ausência = medida primária, sem conversão. */
  measurement_id: Option | null;
}

/** Linha do array `employees[]` — SÓ existe quando `time_control=true`
 *  (`FLD-16..19`). */
export interface NutritionEmployeeForm {
  /** diff por `uuid`, mesmo mecanismo de `items` (`DA-NT-11`). */
  uuid?: string;
  /** `FLD-16` — `Option<FuncType>`, nunca string/number cru. */
  func_type: Option<FuncType> | null;
  /** `FLD-17` — cascata: employees|functions|providers conforme `func_type`. */
  func_executor_id: Option | null;
  /** `FLD-18`. */
  func_um: Option | null;
  /** `FLD-19`. */
  func_total_quantity: number | string;
}

/**
 * Formulário completo (criar+editar, mesmo shape — `DA-NT-11` elimina a
 * bifurcação que `WarehouseTransfer` precisou). `time_control` é boolean no
 * form (cast do select 0/1 legado, `FLD-04`).
 */
export interface NutritionForm {
  /** `FLD-01`, sempre readonly (autofill do backend/lookup de próximo
   *  sequencial). */
  code: string;
  /** `FLD-02`. */
  date: string;
  /** `FLD-03`, readonly, só rótulo — o `user_id` vai implícito
   *  (autenticado), nunca enviado. */
  user_name: string;
  /** `FLD-04`. */
  time_control: boolean;
  items: NutritionItemForm[];
  /** ignorado no submit se `!time_control`. */
  employees: NutritionEmployeeForm[];
}

// ============================================
// REQUEST TYPES (uuid-first, mirror `Nutrition-contrato.md §3.3` — DTOs)
// ============================================

export interface ItemNutritionPayload {
  uuid?: string;
  trough_uuid: string;
  product_uuid?: string;
  diet_beat_uuid?: string;
  /** Client-only de resolução (`DA-NT-06`) — só entrada, nunca gravado
   *  diretamente; resolve o `stock_uuid` correto no Repository. */
  warehouse_uuid?: string;
  area_uuid?: string;
  grazing_uuid?: string;
  quantity: number;
  note_item?: string;
  cost_center_uuid?: string;
  batches: string[];
  /** `DA-NT-13`/`GAP-NT-07` (ADITIVO) — só entrada; ausência = medida
   *  primária sem conversão. */
  measurement_uuid?: string;
}

export interface NutritionEmployeePayload {
  uuid?: string;
  func_type: FuncType;
  func_executor_uuid: string;
  func_um: string;
  func_total_quantity: number;
}

export interface NutritionPayload {
  date: string;
  time_control: boolean;
  items: ItemNutritionPayload[];
  /** omitir/`[]` se `!time_control`. */
  employees?: NutritionEmployeePayload[];
}

// ============================================
// LOOKUPS (`DA-NT-05`) — 6 endpoints de apoio ao form, Collection PLANA
// (sem paginação/`meta`), mirror `BullSeedSeason` (6 lookups).
// ============================================

export interface WarehouseLookupItem {
  uuid: string;
  description: string;
}

export interface ProductLookupItem {
  uuid: string;
  description: string;
  measurement: string;
  min_stock: number;
}

/** `GET .../warehouse-stock/{warehouse}/{product}` — objeto ÚNICO (não
 *  array), autofill do "Estoque"/unidade do item (`FLD-07`/`FLD-08`). */
export interface WarehouseStockLookup {
  quantity: number;
  measurement: string;
  measurement_second: string | null;
  factor_type: 'D' | 'M' | null;
  factor: number | null;
}

// `GET /nutritions/lookups/batches?search=` — somente lotes ATIVOS da fazenda ativa.
export interface BatchLookupItem {
  uuid: string;
  label: string;
}

export interface TroughLookupItem {
  uuid: string;
  description: string;
}
