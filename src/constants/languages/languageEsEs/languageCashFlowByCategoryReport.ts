// src/constants/languages/languageEsEs/languageCashFlowByCategoryReport.ts
// Traducción ES-ES del módulo "Flujo de Caja Mensual" — F-240, esteira
// 97-Esteiras/053, TASK-053-240-FE-01. Mirror de
// `languagePtBr/languageCashFlowByCategoryReport.ts`.

import { ModuleCashFlowByCategoryReport } from '@/@types/language/module-cash-flow-by-category-report';

export const languageCashFlowByCategoryReport: ModuleCashFlowByCategoryReport = {
  report: {
    pageTitle: 'Flujo de Caja Mensual',
    pageSubtitle: 'Informe de flujo de caja mensual agrupado por categoría financiera.',
    fields: {
      regime: 'Régimen',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      accounts: 'Cuentas',
      lastBalance: 'Saldo Anterior',
      proprietary: 'Propietario',
      costCenter: 'Centro de Costo',
      farm: 'Finca',
      reportType: 'Tipo de Informe',
      format: 'Formato',
    },
    regimePlaceholder: 'Seleccione el régimen',
    proprietaryPlaceholder: 'Todos los propietarios',
    costCenterPlaceholder: 'Todos los centros de costo',
    farmPlaceholder: 'Todas',
    regimeOptions: {
      cash: 'Caja',
      accrual: 'Devengo',
    },
    lastBalanceOptions: {
      yes: 'Sí',
      no: 'No',
    },
    reportTypeOptions: {
      analytic: 'Analítico',
      synthetic: 'Sintético',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'Ningún elemento encontrado.',
    generateButton: 'Generar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
