// src/@types/language/module-dashboards/feedlot-dashboard.d.ts
// Tipo espelhado da tela Lotação de Currais (execução 046, TASK-LC-FE-01).

export interface ModuleDashboardsFeedlotDashboard {
  /** Usado na composição da query-key (`dashboards.feedlotDashboard`/`feedlotDashboardSectors`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    yard: string;
    sectors: string;
    validation: {
      yardRequired: string;
      sectorsRequired: string;
    };
  };
  kpis: {
    occupancyRate: string;
    totalAnimals: string;
    availableCorrals: string;
    totalCapacity: string;
  };
  charts: {
    statusDistributionTitle: string;
    statusDistributionCenterLabel: string;
    sectorOccupancyTitle: string;
    sectorOccupancyAllocated: string;
    sectorOccupancyAvailable: string;
  };
  history: {
    title: string;
    corral: string;
    from: string;
    to: string;
    changedAt: string;
  };
}
