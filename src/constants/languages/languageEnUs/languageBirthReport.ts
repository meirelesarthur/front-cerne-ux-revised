// src/constants/languages/languageEnUs/languageBirthReport.ts
// English translation of the "Births" (generic) module — F-236, esteira 053,
// TASK-053-236-FE-01. Mirror of `languagePtBr/languageBirthReport.ts`.

import { ModuleBirthReport } from '@/@types/language/module-birth-report';

export const languageBirthReport: ModuleBirthReport = {
  report: {
    pageTitle: 'Births',
    pageSubtitle: 'Births report by category and period.',
    fields: {
      category: 'Category',
      format: 'Format',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    categoryPlaceholder: 'Select the category',
    downloadButton: 'Generate report',
    downloadError: 'Could not generate the report.',
    downloadSuccess: 'Report generated successfully.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
