// src/constants/languages/languageEnUs/languageFinancingsReport.ts
// English translation of the "Financings" module (Financial report — F-265,
// esteira 97-Esteiras/078, TASK-F265-F01). Mirror of
// `languagePtBr/languageFinancingsReport.ts`.

import { ModuleFinancingsReport } from '@/@types/language/module-financings-report';

export const languageFinancingsReport: ModuleFinancingsReport = {
  report: {
    pageTitle: 'Financings',
    pageSubtitle: 'Report of financings grouped by movement.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'relatorio_financiamentos',
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
