// src/constants/languages/languageEsEs/languageAccumulatedIncomeStatementReport.ts
// Traducción ES-ES del módulo "Costo de Producción Acumulado" (informe
// financiero — F-217, esteira 97-Esteiras/058, TASK-058-F217-FE-01). Mirror
// de `languagePtBr/languageAccumulatedIncomeStatementReport.ts`.

import { ModuleAccumulatedIncomeStatementReport } from '@/@types/language/module-accumulated-income-statement-report';

export const languageAccumulatedIncomeStatementReport: ModuleAccumulatedIncomeStatementReport = {
  report: {
    pageTitle: 'Costo de Producción Acumulado',
    pageSubtitle: 'Informe acumulado de costo de producción por período (máx. 12 meses).',
    fields: {
      group: 'Régimen',
      type: 'Tipo',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      calculationModule: 'Módulo de Cálculo',
      farm: 'Finca',
      proprietary: 'Propietario',
      hasStock: 'Considerar Stock',
      harvest: 'Cosecha',
      costCenter: 'Centro de Costo',
      format: 'Tipo de Informe',
    },
    groupOptions: { cash: 'Caja', accrual: 'Devengado' },
    typeOptions: { synthetic: 'Sintético', analytical: 'Analítico' },
    calculationModuleOptions: { financial: 'Financiero', appropriation: 'Apropiación' },
    calculationModuleTooltip:
      'Financiero considera los movimientos financieros registrados; Apropiación también suma el consumo de stock/apropiaciones (solo si el Régimen es Caja).',
    hasStockOptions: { no: 'No', yes: 'Sí' },
    hasStockTooltip:
      'Inyecta la variación de stock de Insumos/Producción como subgrupo del Ingreso Bruto.',
    formatOptions: { pdf: 'PDF', excel: 'Excel' },
    farmPlaceholder: 'Todas',
    proprietaryPlaceholder: 'Todos',
    harvestPlaceholder: 'Todas',
    generateButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    lookupSearchPlaceholder: 'Buscar...',
    lookupEmptyMessage: 'Ningún elemento encontrado.',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Limpiar selección',
    validation: {
      invalidDateRange:
        'El período (Fecha Inicio y Fecha Fin) es obligatorio y la Fecha Fin debe ser mayor o igual a la Fecha Inicio.',
      maxTwelveMonths: 'El período del informe está limitado a 12 meses.',
    },
  },
};
