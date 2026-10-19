// src/@types/v2/Dashboards/userAnalysis/index.d.ts
// Tipos da dashboard Análise de Usuários (execução 046, TASK-UA-FE-02).
// Fonte: `97-Esteiras/046/ROTEIROS/01-CONTRATO-TELA-user-analysis.md` §4 +
// `CONTRATO-API-046-01-user-analysis.md` §4 (payload campo-a-campo).
//
// `meta` (proxies/lacunas) NÃO estava no §4 do contrato de tela original —
// entra aqui como campo ADITIVO opcional porque a reconciliação
// (`MUD-046-04`) e o contrato de API confirmam que ele viaja DENTRO de
// `data`, no mesmo nível de `kpis`/`daily_access`/etc. Ver
// `src/@types/v2/Dashboards/dashboard-meta.d.ts`.

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

// PLANO-ADMIN-USER-ANALYSIS §4/§6 — `7` saiu (substituição, não adição),
// `60`/`90` entraram.
export type UserAnalysisPeriod = '5' | '15' | '30' | '60' | '90';

export interface UserAnalysisFilterForm {
  period: Option<UserAnalysisPeriod> | null;
  /** Só existe para `Gestor_Plataf` — o admin farm-less escolhe o contratante. */
  tenant_uuid?: Option<string> | null;
}

export interface UserAnalysisFilterRequest {
  period?: UserAnalysisPeriod;
  /**
   * Só enviado para `Gestor_Plataf` sem farm ativa (PLANO-ADMIN-USER-ANALYSIS
   * §3.2/§4) — nunca enviado por usuário comum, mesmo com valor residual em
   * estado antigo. Sem isto, a dashboard admin não deve nem disparar a
   * query (ver `enabled` em `index.tsx`).
   */
  tenant_uuid?: string;
  /** Display-only (companheiro do SelectAsyncPaginate) — re-hidrata o Select. */
  tenant_uuid_label?: string;
}

export interface UserAnalysisKpis {
  active_users: number;
  sessions: number;
  avg_session_seconds: number;
  unique_ips: number | null;
  modules_accessed: { used: number | null; total: number } | null;
}

export interface UserAnalysisDailyPoint {
  date: string;
  value: number;
}

export interface UserAnalysisModuleSlice {
  label: string;
  value: number;
  percentage: number;
}

export interface UserAnalysisHourlyPoint {
  hour: number;
  web: number;
  mobile: number;
  api: number;
}

export interface UserAnalysisDashboardData {
  kpis: UserAnalysisKpis;
  daily_access: UserAnalysisDailyPoint[];
  modules: UserAnalysisModuleSlice[];
  hourly_peaks: UserAnalysisHourlyPoint[];
  meta?: DashboardMeta;
}
