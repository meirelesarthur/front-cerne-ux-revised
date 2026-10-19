// src/constants/languages/languageEnUs/languageCategoryAnimalReport.ts
// English translation of the "Livestock Stock/Category" module (Livestock
// domain, F-242, esteira 97-Esteiras/077). Mirror of
// `languagePtBr/languageCategoryAnimalReport.ts`.

import { ModuleCategoryAnimalReport } from '@/@types/language/module-category-animal-report';

export const languageCategoryAnimalReport: ModuleCategoryAnimalReport = {
  report: {
    pageTitle: 'Livestock Stock/Category',
    pageSubtitle: 'Stock of active animals of the active farm grouped by category.',
    fields: {
      category: 'Category',
      batch: 'Batch',
      harvest: 'Harvest',
      format: 'Format',
    },
    categoryPlaceholder: 'All categories',
    batchPlaceholder: 'All batches',
    harvestPlaceholder: 'All harvests',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
  },
};
