// src/constants/languages/languageEnUs/languageBankStatementReport.ts
// English translation of the "Bank Statement" module (`bankEstatement.report`,
// Financial report — F-233, esteira 97-Esteiras/079, TASK-F233-FE-01). Mirror
// of `languagePtBr/languageBankStatementReport.ts`.

import { ModuleBankStatementReport } from '@/@types/language/module-bank-statement-report';

export const languageBankStatementReport: ModuleBankStatementReport = {
  report: {
    pageTitle: 'Bank Statement',
    pageSubtitle: 'Statement report of movements by account, category and cost center.',
    fields: {
      account: 'Bank Account',
      proprietary: 'Proprietaries',
      costCenter: 'Cost Center',
      categories: 'Categories',
      farm: 'Farm',
      condition: 'Type',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    accountPlaceholder: 'Select the account',
    proprietaryPlaceholder: 'All',
    costCenterPlaceholder: 'All',
    farmPlaceholder: 'All',
    condition: {
      semCategoria: 'Without Category',
      comCategoria: 'With Category',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'extrato-financeiro',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      accountRequired: 'Bank Account is required.',
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
