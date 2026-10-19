// src/constants/languages/languageEnUs/languageAccumulatedWeighingBatchReport.ts
// English translation of the "Pesagem/Lote" (Batch Weighing) module — Task 49,
// esteira CORE_WORKSPACE/97-Esteiras/014. Mirror of
// `languagePtBr/languageAccumulatedWeighingBatchReport.ts`.

import { ModuleAccumulatedWeighingBatchReport } from '@/@types/language/module-accumulated-weighing-batch-report';

export const languageAccumulatedWeighingBatchReport: ModuleAccumulatedWeighingBatchReport = {
  report: {
    pageTitle: 'Batch Weighing',
    pageSubtitle: 'Accumulated weighing report grouped by batch.',
    fields: {
      batch: 'Batch',
      category: 'Category',
      startDate: 'Start Date',
      endDate: 'End Date',
      onlyActiveBatch: 'Active batches only',
      format: 'Format',
    },
    batchPlaceholder: 'Select the batch',
    categoryPlaceholder: 'Select the category',
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
