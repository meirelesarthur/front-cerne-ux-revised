// src/constants/languages/languageEsEs/languageSupplyDashboard.ts
// Traducción al español del módulo "Suministros" (SupplyDashboard —
// Dashboards, esteira 97-Esteiras/019, Tareas 55-58, reformulación v2). Ver
// `@/@types/language/module-supply-dashboard` para el contrato completo.

import { ModuleSupplyDashboard } from '@/@types/language/module-supply-dashboard';

export const languageSupplyDashboard: ModuleSupplyDashboard = {
  titleModule: 'Suministros',
  pageTitle: 'Suministros',
  filter: {
    title: 'Filtrar Suministros',
    farms: 'Fincas',
    farmsSearchPlaceholder: 'Buscar finca...',
    farmsSelectedCount: 'Seleccionadas',
    harvest: 'Zafra',
    harvestPlaceholder: 'Buscar zafra...',
    startDate: 'Fecha inicio',
    endDate: 'Fecha fin',
  },
  errors: {
    loadFailed: 'No se pudo cargar el panel.',
  },
  period: {
    label: 'Período',
  },
  kpis: {
    vsPreviousPeriod: 'vs. mes anterior',
    noBaseline: 'Sin base en el período anterior',
  },
  funnel: {
    title: 'Embudo de suministros',
    finalConversionRate: 'tasa final',
    conversionSuffix: 'conv.',
    averageValue: 'Valor promedio',
    leadTime: 'Lead time',
    actualDuration: 'Plazo promedio',
  },
  providers: {
    title: 'Top proveedores',
    empty: 'Ningún proveedor en el período filtrado',
    badge: {
      excellent: 'Excelente',
      good: 'Bueno',
      regular: 'Regular',
    },
  },
};
