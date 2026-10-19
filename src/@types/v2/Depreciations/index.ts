// src/@types/v2/Depreciations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo DEPRECIAÇÃO (Depreciation — Cadastros Base / Bens-Ativos,
// execução 027, TASK-FE-840). Fundação de dados — 2 listagens read-only
// (Equipamento/Animal) + 1 ação de geração unificada.
//
// Fonte: Depreciation-Frontend-Contrato.md (execução 027) §4/§5/§6 +
// Depreciation-contrato.md (backend, APROVADO) §5/§8.
//
//   GET  /depreciations           → data: DepreciationEquipmentListItem[],
//                                    meta com paginação REAL, per_page
//                                    default 10, teto 100
//   GET  /depreciation-animals    → data: DepreciationAnimalListItem[], idem
//   POST /depreciations/generate  → payload DepreciationGeneratePayload
//                                    (type=equipment|animal|all; fazenda vem
//                                    de X-Farm-Id, NUNCA do payload)
//
// `equipment_uuid` (filtro Equipamento) usa `EquipmentOption` já existente
// em `@/@types/v2/Equipments/index.d.ts` (`{uuid, code, description}`) —
// reaproveitado via import, NÃO redeclarado (esta é a 1ª feature a
// consumi-lo, ver comentário na fonte).
//
// `animal_uuid` (filtro Animal) NÃO incluído nesta entrega —
// `[A CONFIRMAR — depende da frente Rebanho]` (contrato de tela §8.2): o
// módulo Animal/Rebanho está sendo migrado em paralelo nesta mesma
// execução, sem service/tipo de options de Animal ainda no front.
// -----------------------------------------------------------------------------

import type { EquipmentOption } from '@/@types/v2/Equipments';

export interface DepreciationEquipmentListItem {
  year: number;
  month: number;
  vl_depreciate: number;
  vl_depreciation: number;
  sd_depreciate: number;
  processed_date: string;
  /** Mirror `EquipmentCatalogOptionResource` — `{uuid, code, description}`. */
  equipment: EquipmentOption;
}

/** Fidelidade F-030 (execução 055, TASK-DEPA-01): `App\Animal` já tem
 *  Resource formal — `animal.identification`/`animal.entry_date` deixaram
 *  de ser MOCK e passaram a vir de verdade da API; `created_at` (Dt.
 *  Processamento, decisão nº7) também é exposto pelo Resource da listagem. */
export interface DepreciationAnimalListItem {
  year: number;
  month: number;
  vl_depreciate: number;
  vl_depreciation: number;
  sd_depreciate: number;
  processed_date: string;
  created_at: string;
  animal: { uuid: string; identification: string; entry_date: string };
}

export interface DepreciationFilterForm {
  equipment_uuid?: string;
  /** DISPLAY-ONLY, companheiro do `SelectAsyncPaginate` — nunca vai à API
   *  (mirror `cbo_uuid_label`). Nunca conta no badge "Filtros(N)". */
  equipment_uuid_label?: string;
  year?: number;
  month?: number;
}

/** `animal_uuid` NÃO incluído nesta entrega —
 *  `[A CONFIRMAR — depende da frente Rebanho]` (contrato de tela §8.2). */
export interface DepreciationAnimalFilterForm {
  year?: number;
  month?: number;
}

export const depreciationGenerateType = {
  equipment: 'equipment',
  animal: 'animal',
  all: 'all',
} as const;
export type DepreciationGenerateType =
  (typeof depreciationGenerateType)[keyof typeof depreciationGenerateType];

export interface DepreciationGeneratePayload {
  year: number;
  month: number;
  type: DepreciationGenerateType;
}

export interface DepreciationGenerateResult {
  competencia: string;
  equipment_generated: number;
  animal_generated: number;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror EquipmentsListEnvelope
// ============================================

export interface DepreciationsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface DepreciationsListEnvelope {
  success: boolean;
  message: string;
  data: DepreciationEquipmentListItem[];
  errors: Record<string, string[]> | null;
  meta: DepreciationsApiPaginationMeta | null;
}

export interface DepreciationAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: DepreciationAnimalListItem[];
  errors: Record<string, string[]> | null;
  meta: DepreciationsApiPaginationMeta | null;
}
