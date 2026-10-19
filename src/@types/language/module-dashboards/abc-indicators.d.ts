// src/@types/language/module-dashboards/abc-indicators.d.ts
// Tipo espelhado da tela Programa ABC Corte (execução 046, TASK-ABC-FE-01) —
// 14 indicadores operacionais/zootécnicos, ZERO financeiro (`DEC-183`).

export interface ModuleDashboardsAbcIndicators {
  /** Usado na composição da query-key (`dashboards.abcIndicators`/`abcIndicatorsHarvest`). */
  singularLabel: string;
  harvestLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    harvest: string;
    grazing: string;
    startDate: string;
    endDate: string;
    validation: {
      grazingRequired: string;
      startDateRequired: string;
      endDateRequired: string;
      dateRange: string;
      endDateBeforeStartDate: string;
    };
  };
  kpis: {
    productivityArrobaHa: string;
    dailyWeightGain: string;
    capacityRateHa: string;
    averageWeightOut: string;
    daysFilled: string;
  };
  charts: {
    productionTitle: string;
    productionRearing: string;
    productionSlaughter: string;
    productionComercialize: string;
    occupancyTitle: string;
    occupancyCenterLabel: string;
    occupancyFilled: string;
    occupancyEmpty: string;
  };
  detailGrid: {
    title: string;
    label: string;
    value: string;
    unit: string;
    totalProductionKg: string;
    productivityKgHa: string;
    capacityRateUa: string;
    averageEntryWeight: string;
    averageConsumption: string;
  };
  units: {
    kg: string;
    arroba: string;
    arrobaHa: string;
    kgCabDia: string;
    kgHa: string;
    ua: string;
    uaHa: string;
    cabHa: string;
    dias: string;
    percentPv: string;
  };
  emptyMessage: string;
}
