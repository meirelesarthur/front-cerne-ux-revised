// src/constants/languages/languageEsEs/languageFinancialMovementReport.ts
// Traducción ES-ES del módulo "Movimiento Bancario" — F-264, esteira
// 97-Esteiras/058, TASK-058-F264-FE-01. Mirror de
// `languagePtBr/languageFinancialMovementReport.ts`.

import { ModuleFinancialMovementReport } from '@/@types/language/module-financial-movement-report';

export const languageFinancialMovementReport: ModuleFinancialMovementReport = {
  report: {
    pageTitle: 'Movimiento Bancario',
    pageSubtitle: 'Informe de movimiento bancario/financiero por período.',
    fields: {
      accounts: 'Cuentas',
      proprietary: 'Propietario',
      types: 'Tipo de Movimiento',
      centerId: 'Centro de Costo',
      categories: 'Categorías',
      farm: 'Finca',
      condition: 'Tipo',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Tipo de Informe',
    },
    proprietaryPlaceholder: 'Todos',
    centerIdPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    conditionOptions: {
      withoutCategory: 'Sin Categoría',
      withCategory: 'Con Categoría',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    typeOptions: {
      initialBalance: 'Saldo Inicial',
    },
    generateButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    lookupSearchPlaceholder: 'Buscar...',
    lookupEmptyMessage: 'No se encontraron elementos.',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Limpiar selección',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      invalidDateRange: 'La Fecha Fin debe ser mayor o igual a la Fecha Inicio.',
    },
  },
};
