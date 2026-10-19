// src/@types/v2/Dashboards/assetsDashboard/index.d.ts
// Tipos da dashboard Ativos (execução 046, TASK-AT-FE-02). Fonte:
// `03-CONTRATO-TELA-assets-dashboard.md` §4 (`AssetsMaintenanceRow` já
// corrigido pela reconciliação, `MUD-046-01`) +
// `CONTRATO-API-046-03-assets-dashboard.md` §4. `meta` aditivo (ver nota em
// `userAnalysis/index.d.ts`).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

export type AssetsPeriodMonths = '3' | '6' | '12';

/** Forma INTERNA do filtro (Option-based) — mesmo racional de `FeedlotDashboardFilterForm`. */
export interface AssetsDashboardFilterForm {
  months: Option<AssetsPeriodMonths> | null;
  families: Option<string>[];
  status: Option<number> | null;
  proprietary: Option<string> | null;
}

export interface AssetsDashboardFilterRequest {
  months?: AssetsPeriodMonths;
  family_uuids?: string[];
  status?: number;
  proprietary_uuid?: string;
}

export interface AssetsKpis {
  total: number;
  in_operation: number | null;
  in_maintenance: number | null;
  open_service_orders: number | null;
  current_value: number;
}

export interface AssetsCategoryRow {
  family_uuid: string;
  label: string;
  total: number;
  in_operation: number | null;
}

/** `MUD-046-02` — 3 baldes fixos (`in_operation`/`in_maintenance`/`inactive`), nunca um 4º. */
export type AssetsStatusBucket = 'in_operation' | 'in_maintenance' | 'inactive';

export interface AssetsStatusSlice {
  status: AssetsStatusBucket;
  label: string;
  count: number;
  percentage: number;
}

/**
 * ATV-11-front (048-dashboards, correções de homologação) — quebra
 * Corretiva×Preventiva por mês (`CONTRATO-API` atualizado nesta branch: uma
 * linha por mês da janela, mês sem evento = `0`/`0`). Substitui o campo único
 * `total` do `MUD-046-01`.
 */
export interface AssetsMaintenanceRow {
  month: string;
  corrective: number;
  preventive: number;
}

export interface AssetsDashboardData {
  kpis: AssetsKpis;
  by_category: AssetsCategoryRow[];
  by_status: AssetsStatusSlice[];
  maintenance_by_month: AssetsMaintenanceRow[];
  meta?: DashboardMeta;
}
