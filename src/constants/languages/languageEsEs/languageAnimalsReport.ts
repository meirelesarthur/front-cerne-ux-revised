// src/constants/languages/languageEsEs/languageAnimalsReport.ts
// Traducción ES-ES del módulo "Existencia/Rebaño" (informe de Pecuaria —
// F-228, esteira 97-Esteiras/078, TASK-F228-F01). Mirror de
// `languagePtBr/languageAnimalsReport.ts`.

import { ModuleAnimalsReport } from '@/@types/language/module-animals-report';

export const languageAnimalsReport: ModuleAnimalsReport = {
  report: {
    pageTitle: 'Existencia/Rebaño',
    pageSubtitle: 'Informe de existencia de rebaño agrupado por categoría.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      species: 'Especies',
    },
    speciesPlaceholder: 'Seleccione las especies',
    downloadPdfButton: 'Descargar PDF',
    exportFileName: 'relatorio-estoque-rebanho',
    popupBlocked: 'No fue posible abrir la nueva pestaña. Verifique el bloqueador de pop-ups.',
    toasts: {
      success: 'Informe generado con éxito.',
      genericError: 'No fue posible generar el informe.',
    },
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateAfterStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
      speciesRequired: 'Seleccione al menos una especie.',
    },
  },
};
