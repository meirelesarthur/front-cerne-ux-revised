// src/@types/language/module-dashboards/assets-dashboard.d.ts
// Tipo espelhado da tela Ativos (execução 046, TASK-AT-FE-01).

export interface ModuleDashboardsAssetsDashboard {
  /** Usado na composição da query-key (`dashboards.assetsDashboard`/`assetsDashboardMaintenance`). */
  singularLabel: string;
  maintenanceLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    period: string;
    periodOptions: {
      m3: string;
      m6: string;
      m12: string;
    };
    families: string;
    status: string;
    statusAllPlaceholder: string;
    statusOptions: {
      active: string;
      inactive: string;
    };
    proprietary: string;
  };
  kpis: {
    total: string;
    inOperation: string;
    currentValue: string;
  };
  charts: {
    byCategoryTitle: string;
    byCategoryTotal: string;
    byCategoryInOperation: string;
    byStatusTitle: string;
    maintenanceByMonthTitle: string;
    maintenanceByMonthCorrective: string;
    maintenanceByMonthPreventive: string;
  };
  status: {
    inOperation: string;
    inMaintenance: string;
    inactive: string;
  };
}
