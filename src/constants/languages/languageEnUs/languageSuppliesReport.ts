// src/constants/languages/languageEnUs/languageSuppliesReport.ts
// English translation of the "Supplies" module (Procurement report — F-325,
// esteira CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Mirror of
// `languagePtBr/languageSuppliesReport.ts`.

import { ModuleSuppliesReport } from '@/@types/language/module-supplies-report';

export const languageSuppliesReport: ModuleSuppliesReport = {
  report: {
    pageTitle: 'Supplies',
    pageSubtitle: 'Supplies purchase request report.',
    fields: {
      farmUuid: 'Farm',
      userUuid: 'Requester',
      authorizerUuid: 'Authorizer',
      status: 'Status',
      priority: 'Priority',
      number: 'Number',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    statusPlaceholder: 'Select',
    priorityPlaceholder: 'Select',
    downloadPdfButton: 'Generate PDF',
    downloadExcelButton: 'Download Excel',
    downloadError: 'Could not generate the report.',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};
