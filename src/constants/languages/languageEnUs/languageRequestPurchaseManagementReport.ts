// src/constants/languages/languageEnUs/languageRequestPurchaseManagementReport.ts
// English translation of the "Management of Requests" (Gerencial de
// Solicitações) module — F-310, esteira 053, TASK-053-F310-FE-01. Mirror of
// `languagePtBr/languageRequestPurchaseManagementReport.ts`.

import { ModuleRequestPurchaseManagementReport } from '@/@types/language/module-request-purchase-management-report';

export const languageRequestPurchaseManagementReport: ModuleRequestPurchaseManagementReport = {
  report: {
    pageTitle: 'Management of Requests',
    pageSubtitle: 'Management report of purchase requests by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
      typeRequest: 'Type',
      status: 'Status',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      invalidDateRange: 'End Date must be greater than or equal to Start Date.',
    },
  },
};
