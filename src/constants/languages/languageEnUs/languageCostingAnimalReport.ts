// src/constants/languages/languageEnUs/languageCostingAnimalReport.ts
// English translation of the "Custeio/Animal" (Animal Costing report)
// module — F-248, esteira 97-Esteiras/075, TASK-CA-FE-01. Mirror of
// `languagePtBr/languageCostingAnimalReport.ts`.

import { ModuleCostingAnimalReport } from '@/@types/language/module-costing-animal-report';

export const languageCostingAnimalReport: ModuleCostingAnimalReport = {
  report: {
    pageTitle: 'Animal Costing',
    pageSubtitle: 'Animal costing report by period.',
    fields: {
      animal: 'Animal',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    animalPlaceholder: 'Select the animal',
    periodRequiredHint:
      'Enter the animal and the period (Start Date and End Date) to generate the report.',
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      animalRequired: 'The animal is required.',
    },
  },
};
