// src/constants/languages/languageEsEs/languageTaxAccountsReport.ts
// Traducción ES-ES del módulo "Cuentas Tributarias" (informe Financiero —
// F-327, ejecución 060). Mirror estructural del bloque `report` de
// `languageWeighingStockClientReport.ts`.

import { ModuleTaxAccountsReport } from '@/@types/language/module-tax-accounts-report';

export const languageTaxAccountsReport: ModuleTaxAccountsReport = {
  report: {
    pageTitle: 'Cuentas Tributarias',
    pageSubtitle: 'Informe de cuentas tributarias.',
    fields: {
      startDate: 'Período Inicio',
      endDate: 'Período Fin',
      isTaxation: 'Tributación',
      costCenter: 'Centro de Costo',
      provider: 'Proveedor',
      format: 'Formato',
    },
    taxationOptions: {
      yes: 'Sí',
      no: 'No',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Descargar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      datesRequired: 'El período es obligatorio.',
      invalidDateRange: 'La fecha final debe ser mayor o igual a la fecha inicial.',
    },
  },
};
