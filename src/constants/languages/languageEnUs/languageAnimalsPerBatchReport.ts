// src/constants/languages/languageEnUs/languageAnimalsPerBatchReport.ts
// English translation of the "Animais por Lote" (Animals by Batch) module —
// Task 51, esteira CORE_WORKSPACE/97-Esteiras/015. Mirror of
// `languagePtBr/languageAnimalsPerBatchReport.ts`.

import { ModuleAnimalsPerBatchReport } from '@/@types/language/module-animals-per-batch-report';

export const languageAnimalsPerBatchReport: ModuleAnimalsPerBatchReport = {
  report: {
    pageTitle: 'Animals by Batch',
    pageSubtitle: 'Report of animals grouped by batch, individual or aggregated.',
    fields: {
      batch: 'Batch',
      viewType: 'View Mode',
      animal: 'Animal',
      format: 'Format',
      viewTypeOptions: {
        individual: 'Individual',
        aggregated: 'Aggregated',
      },
    },
    batchPlaceholder: 'Select the batch',
    animalPlaceholder: 'Select the animal',
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
    validation: {
      batchRequired: 'The batch is required.',
      viewTypeRequired: 'The view mode is required.',
    },
  },
};
