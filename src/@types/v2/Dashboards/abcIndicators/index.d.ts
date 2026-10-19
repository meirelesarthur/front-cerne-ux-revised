// src/@types/v2/Dashboards/abcIndicators/index.d.ts
// Tipos da dashboard Programa ABC Corte (execução 046, TASK-ABC-FE-02).
// Fonte: `04-CONTRATO-TELA-abc-indicators.md` §4 +
// `CONTRATO-API-046-04-abc-indicators.md` §4 — 14 campos, NENHUM financeiro
// (`DEC-183`). `meta` aditivo (ver nota em `userAnalysis/index.d.ts`).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/** Forma INTERNA do filtro (Option-based para `harvest`/`grazing`, `Date` para as datas). */
export interface AbcIndicatorsFilterForm {
  harvest: Option<string> | null;
  grazing: Option<string> | null;
  startDate: string | null;
  endDate: string | null;
}

export interface AbcIndicatorsFilterRequest {
  harvest_uuid?: string;
  grazing_uuid: string;
  start_date: string;
  end_date: string;
}

export interface AbcIndicatorsData {
  total_production_kg: number;
  total_production_rearing: number;
  total_production_slaughter: number;
  total_comercialize: number;
  productivity_kg_ha: number;
  productivity_arroba_ha: number;
  capacity_rate_ua: number;
  capacity_rate_ha: number;
  daily_weight_gain: number;
  average_entry_weight: number;
  average_weight_out: number;
  average_consumption: number;
  days_filled: number;
  days_empty: number;
  meta?: DashboardMeta;
}
