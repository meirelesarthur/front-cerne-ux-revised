// src/constants/languages/languageEnUs/languageManagementBatchReport.ts
// English translation of the "Manejo/Lote" (Management/Batch) module — F-279,
// esteira 051, TASK-279-FE-01. Mirror of
// `languagePtBr/languageManagementBatchReport.ts`.

import { ModuleManagementBatchReport } from '@/@types/language/module-management-batch-report';

export const languageManagementBatchReport: ModuleManagementBatchReport = {
  report: {
    pageTitle: 'Management/Batch',
    pageSubtitle: 'Management report grouped by category and batch.',
    fields: {
      category: 'Category',
      batch: 'Batch',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    categoryPlaceholder: 'Select the category',
    batchPlaceholder: 'Select the batch',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
