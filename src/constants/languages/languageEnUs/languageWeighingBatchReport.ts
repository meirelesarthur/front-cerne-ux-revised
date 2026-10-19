// src/constants/languages/languageEnUs/languageWeighingBatchReport.ts
// EN-US translation of the "Animal Weighing" module (Livestock report —
// F-334). Structural mirror of
// `languageAccumulatedWeighingBatchReport.ts`'s `report` block (sibling
// "Batch Weighing").

import { ModuleWeighingBatchReport } from '@/@types/language/module-weighing-batch-report';

export const languageWeighingBatchReport: ModuleWeighingBatchReport = {
  report: {
    pageTitle: 'Animal Weighing',
    pageSubtitle: 'Weighing report by animal, batch and category, for the selected period.',
    fields: {
      batch: 'Batch',
      category: 'Category',
      animal: 'Animal',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    batchPlaceholder: 'Select the batch',
    categoryPlaceholder: 'Select the category',
    animalPlaceholder: 'Select the animal',
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
    periodRequiredHint: 'Select the Start Date and the End Date to generate the report.',
    validation: {
      periodRequired: 'The date is required.',
    },
  },
};
