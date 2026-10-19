// src/constants/languages/languageEsEs/languageTransferDifferenceReport.ts
// -----------------------------------------------------------------------------
// Traducción ES-ES del módulo "Romaneio/Diferença" (reporte agrícola —
// Tarea 49, esteira 97-Esteiras/014, feature_id c0b2369d).
// -----------------------------------------------------------------------------

import { ModuleTransferDifferenceReport } from '@/@types/language/module-transfer-difference-report';

export const languageTransferDifferenceReport: ModuleTransferDifferenceReport = {
  report: {
    pageTitle: 'Romaneo/Diferencia',
    pageSubtitle: 'Reporte de diferencia de romaneo, por cliente y período.',
    fields: {
      client: 'Cliente',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    clientPlaceholder: 'Todos los clientes',
    generateButton: 'Generar reporte',
    downloadSuccess: 'Reporte generado con éxito.',
    downloadError: 'No fue posible generar el reporte.',
    validation: {
      datesRequired: 'La fecha es obligatoria.',
      invalidDateRange: 'La fecha fin debe ser igual o posterior a la fecha inicio.',
    },
  },
};
