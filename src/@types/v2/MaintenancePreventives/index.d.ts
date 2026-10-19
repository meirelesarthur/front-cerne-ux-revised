// src/@types/v2/MaintenancePreventives/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Gestão de Frota — Manutenções Preventivas
// (MaintenancePreventive) — domínio PRÓPRIO (tabela dedicada
// `maintenance_preventives` + pivot `appropriation_maintenance_preventive`,
// Rota A do `GAP-CONFLITO-MANUTENCOES-PREVENTIVAS-01`), Tarefas 43/44
// (execução 010, F-102). Modelado por leitura direta do contrato de API
// (`06-Tarefas_Backend/40-manutencoes-preventivas-api-core.md`,
// 🔬 [PARA TESTE]) §Resources/§DTOs — mirror estrutural de
// `@/@types/v2/Supplies` (sibling `Frota/Abastecimentos`), adaptado aos
// campos desta feature (sem cascata de estoque).
//
//   GET    /maintenance-preventives          → paginado (listagem, com
//                                              `items[]` já aninhado — sub-
//                                              linha da árvore sem request
//                                              extra)
//   POST   /maintenance-preventives          → 201, permission
//                                              maintenance-preventives_create
//   GET    /maintenance-preventives/{uuid}   → detalhe (show — reusado para
//                                              hidratar a Edição, sem
//                                              GET .../edit)
//   PUT    /maintenance-preventives/{uuid}   → 200, full-replace de items[]
//   DELETE /maintenance-preventives/{uuid}   → 204
//
// `id` sequencial NUNCA exposto — sempre `uuid`. `code`/`user_id`/`farm_id`
// NUNCA fazem parte do payload de escrita (calculados/atribuídos
// server-side, contrato §Arquivos afetados/DTOs). Sem campo `requester` no
// Resource (diferente do sibling `SupplyListItem`) — a coluna "Requisitante"
// é derivada de `employee?.name ?? user?.name` direto no call site (D2 mirror
// da FID-G3F, sem campo de tipo inventado).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (leitura)
// ============================================

export interface MaintenancePreventivePersonRef {
  uuid: string;
  name: string;
}

export interface MaintenancePreventiveEquipmentRef {
  uuid: string;
  description: string;
}

// ============================================
// ITEM (linha do cabeçalho — resposta, contrato Tarefa 40 §Resources)
// ============================================

export interface MaintenancePreventiveItemData {
  uuid: string;
  equipment: MaintenancePreventiveEquipmentRef;
  message: string;
  date: string | null;
  /** SEMPRE presente na resposta (GAP-FID-06/D6) — `null` quando vazio,
   *  nunca omitido. Exibido também na Visualização (D6, reversão do CLM-08). */
  note: string | null;
  hour_meter_km: number | null;
  is_notified: boolean;
}

// ============================================
// LISTAGEM / DETALHE (`GET /maintenance-preventives`, `GET
// /maintenance-preventives/{uuid}` — mesmo shape, "sem RT-EDIT dedicada")
// ============================================

export interface MaintenancePreventiveListItem {
  uuid: string;
  code: string;
  date: string;
  employee: MaintenancePreventivePersonRef | null;
  /** Nullable — achado de execução da Tarefa 39/40 (`user_id` nullable no
   *  schema físico herdado do legado). */
  user: MaintenancePreventivePersonRef | null;
  items: MaintenancePreventiveItemData[];
}

/** Alias estrutural — `GET /maintenance-preventives/{uuid}` devolve o MESMO
 *  shape do item de listagem (contrato: "sem RT-EDIT dedicada — Front reusa
 *  `show` para hidratar a edição"). */
export type MaintenancePreventiveDetail = MaintenancePreventiveListItem;

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface MaintenancePreventivesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MaintenancePreventivesListEnvelope {
  success: boolean;
  message: string;
  data: MaintenancePreventiveListItem[];
  errors: Record<string, string[]> | null;
  meta: MaintenancePreventivesApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, mirror FLT-01/02/03 — Contrato B)
// ============================================

export interface MaintenancePreventiveFilterForm {
  equipment_uuid?: string;
  /** Display-only — re-hidrata o drawer, NUNCA enviado à API. */
  equipment_label?: string;
  start_date?: string;
  end_date?: string;
}

export type MaintenancePreventiveFilterRequest = MaintenancePreventiveFilterForm;

// ============================================
// FORMULÁRIO (criar/editar — Tarefa 44, contrato Tarefa 40 §DTOs). SEM
// nenhuma cascata de rede (D-Equip/D7) — equipamento editável de fato em
// qualquer modo, `message` sempre obrigatório estático.
// ============================================

/** Linha do formulário — `useFieldArray`
 *  (`MaintenancePreventiveItemsFieldArray.tsx`/`MaintenancePreventiveItemRow.tsx`).
 *  Mirror `SupplyItemForm`, SEM os campos de cascata de estoque (esta feature
 *  não toca `Stock`/`Warehouse`/`Product`/Un. Medida). */
export interface MaintenancePreventiveItemForm {
  equipment_uuid: Option<string> | null;
  message: string;
  date: string | null;
  note: string | null;
  hour_meter_km: number | null;
}

export interface MaintenancePreventiveForm {
  date: string | null;
  employee_uuid: Option<string> | null;
  items: MaintenancePreventiveItemForm[];
}

// ============================================
// PAYLOAD (wire de escrita — JSON puro, SEM multipart, mirror `SupplyPayload`)
// ============================================

export interface MaintenancePreventiveItemPayload {
  equipment_uuid: string;
  message: string;
  date?: string;
  note?: string;
  hour_meter_km?: number;
}

export interface MaintenancePreventivePayload {
  date: string;
  employee_uuid?: string;
  items: MaintenancePreventiveItemPayload[];
}
