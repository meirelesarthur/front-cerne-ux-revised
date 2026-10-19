// src/constants/languages/languageEnUs/languageSupplyDashboard.ts
// English translation of the "Supplies" module (SupplyDashboard —
// Dashboards, esteira 97-Esteiras/019, Tasks 55-58, v2 reformulation). See
// `@/@types/language/module-supply-dashboard` for the full contract.

import { ModuleSupplyDashboard } from '@/@types/language/module-supply-dashboard';

export const languageSupplyDashboard: ModuleSupplyDashboard = {
  titleModule: 'Supplies',
  pageTitle: 'Supplies',
  filter: {
    title: 'Filter Supplies',
    farms: 'Farms',
    farmsSearchPlaceholder: 'Search farm...',
    farmsSelectedCount: 'Selected',
    harvest: 'Harvest',
    harvestPlaceholder: 'Search harvest...',
    startDate: 'Start date',
    endDate: 'End date',
  },
  errors: {
    loadFailed: 'Could not load the dashboard.',
  },
  period: {
    label: 'Period',
  },
  kpis: {
    vsPreviousPeriod: 'vs. previous month',
    noBaseline: 'No baseline in the previous period',
  },
  funnel: {
    title: 'Supply funnel',
    finalConversionRate: 'final rate',
    conversionSuffix: 'conv.',
    averageValue: 'Average value',
    leadTime: 'Lead time',
    actualDuration: 'Average duration',
  },
  providers: {
    title: 'Top suppliers',
    empty: 'No supplier in the filtered period',
    badge: {
      excellent: 'Excellent',
      good: 'Good',
      regular: 'Regular',
    },
  },
};
