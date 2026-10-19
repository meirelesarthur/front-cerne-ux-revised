// src/constants/languages/languageEnUs/languageRequestQuotationReport.ts
// English translation of the "Budgets" module (`request-quotation.report`,
// Supplies report — F-311, esteira 97-Esteiras/078, TASK-F311-F01). Mirror of
// `languagePtBr/languageRequestQuotationReport.ts`.

import { ModuleRequestQuotationReport } from '@/@types/language/module-request-quotation-report';

export const languageRequestQuotationReport: ModuleRequestQuotationReport = {
  report: {
    pageTitle: 'Budgets',
    pageSubtitle: 'Report of budgets by provider and farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      provider: 'Provider',
      farm: 'Farm',
    },
    providerPlaceholder: 'All',
    farmPlaceholder: 'All',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'orcamentos',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};
