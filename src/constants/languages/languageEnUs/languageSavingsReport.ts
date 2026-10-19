// src/constants/languages/languageEnUs/languageSavingsReport.ts
// English translation of the "Savings" module (Procurement report — F-319,
// esteira 97-Esteiras/013, TASK-013-F319-FE-01/02). Mirror of
// `languagePtBr/languageSavingsReport.ts`.

import { ModuleSavingsReport } from '@/@types/language/module-savings-report';

export const languageSavingsReport: ModuleSavingsReport = {
  report: {
    pageTitle: 'Savings',
    pageSubtitle: 'Savings applied to purchase quotations report.',
    fields: {
      farmUuid: 'Farm',
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status',
      userId: 'Responsible Buyer',
    },
    statusPlaceholder: 'Select',
    userIdPlaceholder: 'Select',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    farmSearchPlaceholder: 'Search farm...',
    farmEmptyLabel: 'No farm found.',
    downloadPdfButton: 'Generate PDF',
    downloadExcelButton: 'Generate Excel',
    downloadError: 'Could not generate the report.',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    exportFileName: 'savings',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      farmRequired: 'Select at least one farm.',
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};
