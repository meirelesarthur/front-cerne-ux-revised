// src/constants/languages/languageEnUs/languageDre.ts
// English translation of the "DRE" module (Financial domain, F-259, esteira
// 97-Esteiras/049, TASK-DRE-FE-01). Mirror of `languagePtBr/languageDre.ts`.

import { ModuleDre } from '@/@types/language/module-dre';

export const languageDre: ModuleDre = {
  report: {
    pageTitle: 'Income Statement',
    pageSubtitle: 'Income Statement of the active farm.',
    fields: {
      typeReport: 'View',
      startDate: 'Start Date',
      endDate: 'End Date',
      centerId: 'Cost Center',
    },
    typeReportOptions: {
      synthetic: 'Synthetic',
      analytical: 'Analytical',
    },
    centerIdPlaceholder: 'All cost centers',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    validation: {
      typeReportRequired: 'View (Synthetic/Analytical) is required.',
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
