// src/constants/languages/languageEnUs/languageFeedlotWeighingPerformanceReport.ts
// English translation of the "Feedlot Weighing Performance" (Desempenho
// Pesagem Confinamento) module — F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`. Mirror of
// `languagePtBr/languageFeedlotWeighingPerformanceReport.ts`.

import { ModuleFeedlotWeighingPerformanceReport } from '@/@types/language/module-feedlot-weighing-performance-report';

export const languageFeedlotWeighingPerformanceReport: ModuleFeedlotWeighingPerformanceReport = {
  report: {
    pageTitle: 'Feedlot Weighing Performance',
    pageSubtitle:
      'Average daily gain and weight gain report for the feedlot, grouped by Corral and Batch.',
    fields: {
      corral: 'Corral',
      batch: 'Batch',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    corralPlaceholder: 'All corrals',
    batchPlaceholder: 'All batches',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
