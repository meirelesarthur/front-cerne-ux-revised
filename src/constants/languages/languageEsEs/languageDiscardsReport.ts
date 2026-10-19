// src/constants/languages/languageEsEs/languageDiscardsReport.ts
// Traducción ES-ES del módulo "Descarte Romaneo" (informe de Agricultura —
// F-256, esteira 97-Esteiras/078, TASK-F256-F01). Mirror de
// `languagePtBr/languageDiscardsReport.ts`.

import { ModuleDiscardsReport } from '@/@types/language/module-discards-report';

export const languageDiscardsReport: ModuleDiscardsReport = {
  report: {
    pageTitle: 'Descarte Romaneo',
    pageSubtitle: 'Informe de descarte de romaneo agrupado por área.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      area: 'Área',
    },
    areaPlaceholder: 'Todas',
    downloadPdfButton: 'Descargar PDF',
    downloadExcelButton: 'Descargar Excel',
    exportFileName: 'relatorio_descarte_romaneio',
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
