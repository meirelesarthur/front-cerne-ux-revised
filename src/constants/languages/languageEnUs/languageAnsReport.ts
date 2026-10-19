// src/constants/languages/languageEnUs/languageAnsReport.ts
// English translation of the "ANS" module (Supplies report — F-229, lote 076).
// Mirror of `languagePtBr/languageAnsReport.ts`.

import { ModuleAnsReport } from '@/@types/language/module-ans-report';

export const languageAnsReport: ModuleAnsReport = {
  report: {
    pageTitle: 'ANS',
    pageSubtitle: 'Service Level Agreement report of purchase requests, filterable by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Select the period (Start Date and End Date) to enable the download.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
