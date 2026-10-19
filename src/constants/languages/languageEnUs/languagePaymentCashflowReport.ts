// src/constants/languages/languageEnUs/languagePaymentCashflowReport.ts
// English translation of the "Monthly Payment Flow" module
// (`payment-cashflow.report`, Financial report — F-293, esteira
// 97-Esteiras/078, TASK-F293-F01). Mirror of
// `languagePtBr/languagePaymentCashflowReport.ts`.

import { ModulePaymentCashflowReport } from '@/@types/language/module-payment-cashflow-report';

export const languagePaymentCashflowReport: ModulePaymentCashflowReport = {
  report: {
    pageTitle: 'Monthly Payment Flow',
    pageSubtitle: 'Report of payment flow by account, category and cost center.',
    fields: {
      accounts: 'Accounts',
      categories: 'Categories',
      proprietary: 'Proprietaries',
      costCenter: 'Cost Center',
      farm: 'Farm',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    proprietaryPlaceholder: 'All',
    costCenterPlaceholder: 'All',
    farmPlaceholder: 'All',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'fluxo-mensal-pagamento',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
    checkbox: {
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      selectedCount: 'selected',
      empty: 'No records found.',
      error: 'Error loading records.',
      retry: 'Try again',
      searchPlaceholder: 'Search...',
    },
  },
};
