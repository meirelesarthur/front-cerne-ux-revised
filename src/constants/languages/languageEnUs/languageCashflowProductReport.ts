// src/constants/languages/languageEnUs/languageCashflowProductReport.ts
// English translation of the "Financial Stock" module — F-241, esteira
// 97-Esteiras/013, TASK-013-241-FE-01. Mirror of
// `languagePtBr/languageCashflowProductReport.ts`.

import { ModuleCashflowProductReport } from '@/@types/language/module-cashflow-product-report';

export const languageCashflowProductReport: ModuleCashflowProductReport = {
  report: {
    pageTitle: 'Financial Stock',
    pageSubtitle: 'Financial stock report by product and financial category.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    generateButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
