// src/@types/language/module-dashboards/depreciation-dashboard.d.ts
// Tipo espelhado da tela Depreciações (execução 048, TASK-02-FE).

export interface ModuleDashboardsDepreciationDashboard {
  /** Usado na composição da query-key (`dashboards.depreciationDashboard`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    year: string;
    assetType: string;
    assetTypeOptions: {
      all: string;
      equipment: string;
      animal: string;
    };
  };
  kpis: {
    totalAssetValue: string;
    monthlyDepreciation: string;
    accumulatedDepreciation: string;
    residualValue: string;
  };
  charts: {
    monthlyTitle: string;
    monthlyEquipmentSeries: string;
    monthlyAnimalSeries: string;
    compositionTitle: string;
    compositionCenterLabel: string;
    projectionTitle: string;
    projectionSeries: string;
  };
}
