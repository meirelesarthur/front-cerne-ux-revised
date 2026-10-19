// src/constants/languages/languageEnUs/languageStockAbcReport.ts
// English translation of the "ABC Curve/Stock" module (Stock domain, F-322,
// esteira 97-Esteiras/077). Mirror of
// `languagePtBr/languageStockAbcReport.ts`.

import { ModuleStockAbcReport } from '@/@types/language/module-stock-abc-report';

export const languageStockAbcReport: ModuleStockAbcReport = {
  report: {
    pageTitle: 'ABC Curve/Stock',
    pageSubtitle: 'ABC classification of the active farm stock by total value.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
