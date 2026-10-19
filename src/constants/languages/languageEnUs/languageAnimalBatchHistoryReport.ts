// src/constants/languages/languageEnUs/languageAnimalBatchHistoryReport.ts
// English translation of the "Animal/Batch History" module (Livestock
// report, F-221, esteira 058, TASK-058-F221-FE-01). Mirror of
// `languagePtBr/languageAnimalBatchHistoryReport.ts`.

import { ModuleAnimalBatchHistoryReport } from '@/@types/language/module-animal-batch-history-report';

export const languageAnimalBatchHistoryReport: ModuleAnimalBatchHistoryReport = {
  report: {
    pageTitle: 'Animal/Batch History',
    pageSubtitle: 'Animal history report by batch.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      batch: 'Batch',
      status: 'Status',
      type: 'Report Type',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    requiredFieldsHint: 'Enter the Start Date and Batch to generate the report.',
    downloadButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
  },
};
