// src/constants/languages/languageEsEs/languageReceiptCashflowReport.ts
// Traducción ES-ES del módulo "Flujo Mensual de Cobro" (informe Financiero
// — F-303, ejecución 059). Mirror estructural del bloque `report` de
// `languageCashFlowByCategoryReport.ts`.

import { ModuleReceiptCashflowReport } from '@/@types/language/module-receipt-cashflow-report';

export const languageReceiptCashflowReport: ModuleReceiptCashflowReport = {
  report: {
    pageTitle: 'Flujo Mensual de Cobro',
    pageSubtitle: 'Informe de flujo mensual de cobros, por cuenta, categoría y período.',
    fields: {
      accounts: 'Cuentas',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      proprietary: 'Propietario',
      costCenter: 'Centro de Costo',
      categories: 'Categorías',
      farm: 'Finca',
      format: 'Formato',
    },
    proprietaryPlaceholder: 'Seleccione el propietario',
    costCenterPlaceholder: 'Seleccione el centro de costo',
    farmPlaceholder: 'Seleccione la finca',
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Quitar selección',
    lookupEmptyMessage: 'No se encontraron elementos.',
    generateButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'La fecha es obligatoria.',
    },
  },
};
