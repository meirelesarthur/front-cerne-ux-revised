// src/constants/languages/languageEsEs/languageAccumulatedWeighingBatchReport.ts
// Traducción ES-ES del módulo "Pesagem/Lote" (Pesaje/Lote) — Tarea 49,
// esteira CORE_WORKSPACE/97-Esteiras/014. Mirror de
// `languagePtBr/languageAccumulatedWeighingBatchReport.ts`.

import { ModuleAccumulatedWeighingBatchReport } from '@/@types/language/module-accumulated-weighing-batch-report';

export const languageAccumulatedWeighingBatchReport: ModuleAccumulatedWeighingBatchReport = {
  report: {
    pageTitle: 'Pesaje/Lote',
    pageSubtitle: 'Informe de pesaje acumulado agrupado por lote.',
    fields: {
      batch: 'Lote',
      category: 'Categoría',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      onlyActiveBatch: 'Solo lotes activos',
      format: 'Formato',
    },
    batchPlaceholder: 'Seleccione el lote',
    categoryPlaceholder: 'Seleccione la categoría',
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
