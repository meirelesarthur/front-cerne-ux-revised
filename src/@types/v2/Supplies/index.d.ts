// src/@types/v2/Supplies/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Gestão de Frota — Abastecimentos (Supply) — domínio PRÓPRIO
// (tabela dedicada `supplies`, AD-01 do contrato de API), Tarefas 40/41
// (execução 009). Modelado por leitura direta do contrato de API
// (`CORE_WORKSPACE/01-Arquitetura_e_Contratos/api-contract-abastecimentos.md`,
// APROVADO_PARA_EXECUCAO) §4/§6/§9.
//
//   GET    /supplies                          → paginado (listagem)
//   POST   /supplies                          → 201, permission
//                                                appropriation-supplies_create
//   GET    /supplies/last-reading/{equipment}  → { hour_meter, mileage },
//                                                200 mesmo sem histórico
//   GET    /supplies/{uuid}                    → detalhe (show — reusado para
//                                                hidratar a Edição, sem
//                                                GET .../edit)
//   PUT    /supplies/{uuid}                    → 200, full-replace de items[]
//   DELETE /supplies/{uuid}                    → 204
//
// `id` sequencial NUNCA exposto — sempre `uuid` (Lei 10). `code`/`user_id`/
// `farm_id`/`amount`/`total_amount` NUNCA fazem parte do payload de
// escrita (calculados/atribuídos server-side, contrato §4).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (leitura — mirror shape enxuto de outros módulos)
// ============================================

export interface SupplyPersonRef {
  uuid: string;
  name: string;
}

export interface SupplyDescribedRef {
  uuid: string;
  description: string;
}

export interface SupplyMeasurementRef {
  uuid: string;
  name: string;
}

// ============================================
// ITEM (linha do cabeçalho — resposta, contrato §6)
// ============================================

export interface SupplyItemData {
  uuid: string;
  equipment: SupplyDescribedRef;
  warehouse: SupplyDescribedRef | null;
  product: SupplyDescribedRef | null;
  measurement: SupplyMeasurementRef;
  hour_meter: number | null;
  mileage: number | null;
  quantity: number;
  amount: number;
  total_amount: number;
  note: string | null;
  responsible: SupplyPersonRef | null;
}

// ============================================
// LISTAGEM / DETALHE (`GET /supplies`, `GET /supplies/{uuid}` — mesmo shape,
// contrato §6)
// ============================================

export interface SupplyListItem {
  uuid: string;
  code: string;
  date: string;
  employee: SupplyPersonRef | null;
  user: SupplyPersonRef;
  requester: string | null;
  items: SupplyItemData[];
}

/** Alias estrutural — `GET /supplies/{uuid}` devolve o MESMO shape do item de
 *  listagem (contrato §6/§7.2, "sem reconversão adicional"). */
export type SupplyDetail = SupplyListItem;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`, contrato §6)
// ============================================

export interface SuppliesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SuppliesListEnvelope {
  success: boolean;
  message: string;
  data: SupplyListItem[];
  errors: Record<string, string[]> | null;
  meta: SuppliesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, contrato §4 `SupplyFilterData`, mirror FM-01/02/03)
// ============================================

export interface SupplyFilterForm {
  equipment_uuid?: string;
  /** Display-only — re-hidrata o drawer, NUNCA enviado à API. */
  equipment_label?: string;
  start_date?: string;
  end_date?: string;
}

export type SupplyFilterRequest = SupplyFilterForm;

// ============================================
// FORMULÁRIO (criar/editar — Tarefa 41, contrato §4 `SupplyRequest`)
// ============================================

/** Linha do formulário — `useFieldArray` (`SupplyItemsFieldArray.tsx`/
 *  `SupplyItemRow.tsx`). Campos vêm como `Option<string>` (Select) para os
 *  vínculos e `number|null` para os numéricos — mirror `AppropriationForm`
 *  (`stock_items`). O objeto `Option` de `stock_uuid` embute
 *  `measurement`/`measurementSecond`/`factor`/`factorType`/`quantity`
 *  vindos de `listStockAvailability` (AD-06, contrato §9) — sem round-trip
 *  extra (zero 3ª chamada para resolver UM/fator). */
export interface SupplyItemForm {
  equipment_uuid: Option<string> | null;
  /** Sugerido, readonly (RT-08/§9 item 1) — nunca editado manualmente. */
  hour_meter: number | null;
  mileage: number | null;
  warehouse_uuid: Option<string> | null;
  /** Option enriquecida por `listStockAvailability` — ver comentário acima. */
  stock_uuid:
    | (Option<string> & {
        quantity?: number;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: 'M' | 'D' | null;
      })
    | null;
  measurement_uuid: Option<string> | null;
  quantity: number | null;
  responsible_uuid: Option<string> | null;
  note: string | null;
}

export interface SupplyForm {
  date: string | null;
  employee_uuid: Option<string> | null;
  items: SupplyItemForm[];
}

// ============================================
// PAYLOAD (wire de escrita — contrato §4, JSON puro, SEM multipart)
// ============================================

export interface SupplyItemPayload {
  equipment_uuid: string;
  hour_meter?: number;
  mileage?: number;
  warehouse_uuid?: string;
  stock_uuid?: string;
  measurement_uuid: string;
  quantity: number;
  responsible_uuid?: string;
  note?: string;
}

export interface SupplyPayload {
  date: string;
  employee_uuid?: string;
  items: SupplyItemPayload[];
}

// ============================================
// CASCATA 1 — Equipamento→último horímetro/km (`GET /supplies/last-reading/
// {equipmentUuid}`, contrato §3/§6/§9 item 1, RT-08/§8 do FID-G3F)
// ============================================

export interface SupplyLastReading {
  hour_meter: number | null;
  mileage: number | null;
}
