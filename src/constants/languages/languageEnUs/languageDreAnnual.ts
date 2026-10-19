// src/constants/languages/languageEnUs/languageDreAnnual.ts
// English translation of the "DRE Anual" module (Financial domain, F-258,
// esteira 97-Esteiras/049, TASK-DRE-FE-03). Mirror of `languageDre.ts`
// (sibling screen) — only the period filter shape changes (year).

import { ModuleDreAnnual } from '@/@types/language/module-dre-annual';

export const languageDreAnnual: ModuleDreAnnual = {
  report: {
    pageTitle: 'Annual Income Statement',
    pageSubtitle: 'Annual Income Statement of the active farm.',
    fields: {
      typeReport: 'View',
      startYear: 'Start Year',
      endYear: 'End Year',
      centerId: 'Cost Center',
    },
    typeReportOptions: {
      synthetic: 'Synthetic',
      analytical: 'Analytical',
    },
    centerIdPlaceholder: 'All cost centers',
    yearRangeRequiredHint: 'Enter the period (Start Year and End Year) to generate the report.',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    validation: {
      typeReportRequired: 'View (Synthetic/Analytical) is required.',
      yearRangeRequired: 'The period (Start Year and End Year) is required.',
    },
  },
};
