// src/constants/languages/languageEnUs/languageReceiptsReport.ts
// English translation of the "Recebimentos" (Receipts) report module —
// F-305, esteira 97-Esteiras/074, TASK-RCB-FE-01. Mirror of
// `languagePtBr/languageReceiptsReport.ts`.

import { ModuleReceiptsReport } from '@/@types/language/module-receipts-report';

export const languageReceiptsReport: ModuleReceiptsReport = {
  report: {
    pageTitle: 'Receipts',
    pageSubtitle: 'Receipts report by period.',
    fields: {
      product: 'Product',
      center: 'Cost Center',
      category: 'Category',
      startDate: 'Start Date',
      endDate: 'End Date',
      reportType: 'Report Type',
    },
    productPlaceholder: 'All products',
    centerPlaceholder: 'All cost centers',
    categoryPlaceholder: 'All categories',
    reportTypeOptions: { pdf: 'PDF', excel: 'Excel' },
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    submitButton: 'Generate',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      periodOrder: 'End Date cannot be earlier than Start Date.',
    },
  },
};
