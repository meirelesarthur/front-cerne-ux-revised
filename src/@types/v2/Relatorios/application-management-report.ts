// src/@types/v2/Relatorios/application-management-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Aplicação/Manejo" (F-230, esteira
// 97-Esteiras/077, F-230-plano-front.md §4). Mirror ESTRUTURAL de
// `costing-livestock-area-report.ts` (F-251, mesmo domínio de backend
// `PastureRepositoryInterface`, mesma cascata client-side IG-01/IG-02),
// REMOVENDO o 3º universo `grazings` — esta tela só tem `production_cycles`
// + `areas` (LK-01/LK-02 do contrato legado).
//
// Payload real do servidor mirror `F-230-plano-api.md §PASSO 3` (Form
// Request): `production_cycle_uuid`/`area_uuids[]`/`start_date`/`end_date` —
// NUNCA `production_cycle`/`areas` crus (só nomes INTERNOS do form).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface ApplicationManagementAreaRef {
  uuid: string;
  description: string;
}

export interface ApplicationManagementProductionCycleOptionRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend (with('areas')) — cascata IG-01 100% client-side,
   *  mirror `CostingLivestockProductionCycleOptionRef`, SEM grazings. */
  areas: { uuid: string; description: string }[];
}

export interface ApplicationManagementReportOptionsData {
  productionCycles: ApplicationManagementProductionCycleOptionRef[];
  /** Universo COMPLETO (LK-02 legado) — carregado inteiro, sem paginação/busca. */
  areas: ApplicationManagementAreaRef[];
}

export interface ApplicationManagementReportFilterForm {
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL — nomes 1:1 com o Form Request (`F-230-plano-api.md §PASSO 3`).
 *  NUNCA `production_cycle`/`areas` crus — sempre `_uuid(s)`. */
export interface ApplicationManagementReportParams {
  production_cycle_uuid?: string;
  area_uuids?: string[];
  start_date: string;
  end_date: string;
}
