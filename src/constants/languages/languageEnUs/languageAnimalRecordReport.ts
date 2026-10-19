// src/constants/languages/languageEnUs/languageAnimalRecordReport.ts
// English translation of the "Ficha Animal" (Animal Record) module — F-225,
// 97-Esteiras/012, Tarefa 47. Mirror of
// `languagePtBr/languageAnimalRecordReport.ts`.

import { ModuleAnimalRecordReport } from '@/@types/language/module-animal-record-report';

export const languageAnimalRecordReport: ModuleAnimalRecordReport = {
  report: {
    pageTitle: 'Animal Record',
    pageSubtitle: 'Individual animal record report for the active farm.',
    filters: {
      category: 'Category',
      batch: 'Batch',
      animal: 'Animal',
    },
    filterAllPlaceholder: 'All',
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
  },
};
