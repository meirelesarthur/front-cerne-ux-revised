// src/@types/language/module-dashboards/livestock-dashboard.d.ts
// Tipo espelhado da tela Pecuária de Corte (execução 048, TASK-05-FE). Sem
// aba "Produtivo"/"Reprodutivo" (código morto do legado, `CV-025/026`, não
// portado como navegação — ver nota em `@/@types/v2/Dashboards/livestockDashboard`).

export interface ModuleDashboardsLivestockDashboard {
  /** Usado na composição da query-key (`dashboards.livestockDashboard`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    harvest: string;
    breed: string;
    breedAllPlaceholder: string;
    category: string;
    categoryAllPlaceholder: string;
    startDate: string;
    endDate: string;
    validation: {
      dateRange: string;
      endDateBeforeStartDate: string;
    };
  };
  kpis: {
    headcount: string;
    gmd: string;
    arrobaMonth: string;
    births: string;
    deaths: string;
  };
  charts: {
    breedTitle: string;
    breedOthers: string;
    categoryTitle: string;
    categoryOthers: string;
    evolutionTitle: string;
    evolutionSeries: string;
    managementTitle: string;
    managementSeriesWeighings: string;
    managementSeriesSanitary: string;
    managementSeriesNutrition: string;
  };
  financial: {
    title: string;
  };
  formats: {
    currencySuffix: string;
    weightKgSuffix: string;
    weightArrobaSuffix: string;
    areaHaSuffix: string;
    percentSuffix: string;
    ratioSuffix: string;
  };
  emptyMessage: string;
}
