// src/constants/languages/languageEsEs/languageRequestQuotationReport.ts
// Traducción ES-ES del módulo "Presupuestos" (`request-quotation.report`,
// informe de Suministros — F-311, esteira 97-Esteiras/078, TASK-F311-F01).
// Mirror de `languagePtBr/languageRequestQuotationReport.ts`.

import { ModuleRequestQuotationReport } from '@/@types/language/module-request-quotation-report';

export const languageRequestQuotationReport: ModuleRequestQuotationReport = {
  report: {
    pageTitle: 'Presupuestos',
    pageSubtitle: 'Informe de presupuestos por proveedor y finca.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      provider: 'Proveedor',
      farm: 'Finca',
    },
    providerPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'orcamentos',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
