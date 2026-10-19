// src/constants/languages/languageEsEs/languageFinancingsReport.ts
// Traducción ES-ES del módulo "Financiamientos" (informe Financiero — F-265,
// esteira 97-Esteiras/078, TASK-F265-F01). Mirror de
// `languagePtBr/languageFinancingsReport.ts`.

import { ModuleFinancingsReport } from '@/@types/language/module-financings-report';

export const languageFinancingsReport: ModuleFinancingsReport = {
  report: {
    pageTitle: 'Financiamientos',
    pageSubtitle: 'Informe de financiamientos agrupados por movimiento.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'relatorio_financiamentos',
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
