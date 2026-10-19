// src/@types/v2/Dashboards/feedlotDashboard/index.d.ts
// Tipos da dashboard Lotação de Currais (execução 046, TASK-LC-FE-02).
// Fonte: `02-CONTRATO-TELA-feedlot-dashboard.md` §4 +
// `CONTRATO-API-046-02-feedlot-dashboard.md` §4. `meta` aditivo (ver nota em
// `userAnalysis/index.d.ts`) — aqui só `lacunas[]` (`kpi_sparklines`).

import type { FeedlotCorralStatusValue } from '@/constants/FeedlotMap/feedlot-corral-status';

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/**
 * Forma INTERNA do filtro (Option-based) — é o que `userPaginatedQuery`
 * persiste na URL para esta tela (evita o problema de rótulo perdido no
 * re-abrir do drawer: o Pátio é `SelectAsyncPaginate`, sem lookup por uuid
 * isolado). A conversão para `FeedlotDashboardFilterRequest` (flat) acontece
 * só na borda do service call, em `index.tsx`.
 */
export interface FeedlotDashboardFilterForm {
  yard: Option<string> | null;
  sectors: Option<string>[];
}

export interface FeedlotDashboardFilterRequest {
  yard_uuid?: string;
  sector_uuids?: string[];
}

export interface FeedlotKpis {
  occupancy_rate: number;
  total_animals: number;
  available_corrals: number;
  total_capacity: number;
  history: Record<
    'occupancy_rate' | 'total_animals' | 'available_corrals' | 'total_capacity',
    number[]
  > | null;
}

export interface FeedlotStatusSlice {
  status: FeedlotCorralStatusValue;
  label: string;
  count: number;
}

export interface FeedlotSectorRow {
  sector_uuid: string;
  name: string;
  allocated: number;
  available: number;
}

export interface FeedlotStatusHistoryRow {
  corral_uuid: string;
  corral_name: string;
  from_status: FeedlotCorralStatusValue;
  to_status: FeedlotCorralStatusValue;
  changed_at: string;
}

export interface FeedlotDashboardData {
  kpis: FeedlotKpis;
  status_distribution: FeedlotStatusSlice[];
  sector_occupancy: FeedlotSectorRow[];
  recent_status_history: FeedlotStatusHistoryRow[] | null;
  meta?: DashboardMeta;
}

/** `GET /dashboards/feedlot/sectors` — cascata `LC-CASCADE-01`. */
export interface FeedlotDashboardSectorOption {
  uuid: string;
  name: string;
}
