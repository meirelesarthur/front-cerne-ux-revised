// src/@types/language/module-dashboards/user-analysis.d.ts
// Tipo espelhado da tela Análise de Usuários (execução 046, TASK-UA-FE-01).

export interface ModuleDashboardsUserAnalysis {
  /** Usado na composição da query-key (`dashboards.userAnalysis`/`userAnalysisSummary`). */
  singularLabel: string;
  summaryLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    period: string;
    periodOptions: {
      d5: string;
      d15: string;
      d30: string;
      d60: string;
      d90: string;
    };
    /** PLANO-ADMIN-USER-ANALYSIS §4 — seletor de Contratante, só `Gestor_Plataf`. */
    tenant: string;
    tenantPlaceholder: string;
  };
  /** Empty-state dedicado do admin farm-less sem contratante escolhido (§6). */
  selectTenant: {
    title: string;
    description: string;
  };
  kpis: {
    activeUsers: string;
    sessions: string;
    avgSessionDuration: string;
    uniqueIps: string;
  };
  charts: {
    dailyAccessTitle: string;
    dailyAccessSeries: string;
    modulesAccessedTitle: string;
    hourlyPeaksTitle: string;
    hourlyPeaksSeries: string;
    hourlyPeaksHourSuffix: string;
  };
}
