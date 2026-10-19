// src/constants/languages/languageEsEs/languageNutritionConsumptionReport.ts
// Traducción ES-ES del módulo "Nutrición/Lote" — F-288, esteira 053,
// TASK-288-FE-01. Mirror de
// `languagePtBr/languageNutritionConsumptionReport.ts`.

import { ModuleNutritionConsumptionReport } from '@/@types/language/module-nutrition-consumption-report';

export const languageNutritionConsumptionReport: ModuleNutritionConsumptionReport = {
  report: {
    pageTitle: 'Nutrición/Lote',
    pageSubtitle: 'Informe de consumo de nutrición por producto y comedero.',
    fields: {
      category: 'Categoría',
      batch: 'Lote',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    categoryPlaceholder: 'Seleccione la categoría',
    batchPlaceholder: 'Seleccione el lote',
    downloadButton: 'Descargar informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
