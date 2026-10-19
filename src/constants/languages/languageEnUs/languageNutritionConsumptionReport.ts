// src/constants/languages/languageEnUs/languageNutritionConsumptionReport.ts
// English translation of the "Nutrição/Lote" (Nutrition/Batch) module —
// F-288, esteira 053, TASK-288-FE-01. Mirror of
// `languagePtBr/languageNutritionConsumptionReport.ts`.

import { ModuleNutritionConsumptionReport } from '@/@types/language/module-nutrition-consumption-report';

export const languageNutritionConsumptionReport: ModuleNutritionConsumptionReport = {
  report: {
    pageTitle: 'Nutrition/Batch',
    pageSubtitle: 'Nutrition consumption report by product and trough.',
    fields: {
      category: 'Category',
      batch: 'Batch',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    categoryPlaceholder: 'Select the category',
    batchPlaceholder: 'Select the batch',
    downloadButton: 'Download report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
