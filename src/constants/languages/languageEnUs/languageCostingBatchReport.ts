// src/constants/languages/languageEnUs/languageCostingBatchReport.ts
// English translation of the "Custeio/Lote" (Batch Costing report) module —
// F-20c552f0, esteira 97-Esteiras/074, TASK-CL-FE-01. Mirror of
// `languagePtBr/languageCostingBatchReport.ts`.

import { ModuleCostingBatchReport } from '@/@types/language/module-costing-batch-report';

export const languageCostingBatchReport: ModuleCostingBatchReport = {
  report: {
    pageTitle: 'Batch Costing',
    pageSubtitle: 'Batch costing report by period.',
    fields: {
      batches: 'Batches',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    batchesPlaceholder: 'All batches',
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
