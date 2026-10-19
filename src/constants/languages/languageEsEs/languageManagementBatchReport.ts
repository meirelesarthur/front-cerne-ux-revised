// src/constants/languages/languageEsEs/languageManagementBatchReport.ts
// Traducción ES-ES del módulo "Manejo/Lote" (Manejo/Lote) — F-279, esteira
// 051, TASK-279-FE-01. Mirror de
// `languagePtBr/languageManagementBatchReport.ts`.

import { ModuleManagementBatchReport } from '@/@types/language/module-management-batch-report';

export const languageManagementBatchReport: ModuleManagementBatchReport = {
  report: {
    pageTitle: 'Manejo/Lote',
    pageSubtitle: 'Informe de manejo agrupado por categoría y lote.',
    fields: {
      category: 'Categoría',
      batch: 'Lote',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    categoryPlaceholder: 'Seleccione la categoría',
    batchPlaceholder: 'Seleccione el lote',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
