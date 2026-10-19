// src/constants/languages/languageEnUs/languageDiscardsReport.ts
// English translation of the "Discards Report" module (Agriculture report —
// F-256, esteira 97-Esteiras/078, TASK-F256-F01). Mirror of
// `languagePtBr/languageDiscardsReport.ts`.

import { ModuleDiscardsReport } from '@/@types/language/module-discards-report';

export const languageDiscardsReport: ModuleDiscardsReport = {
  report: {
    pageTitle: 'Discards Report',
    pageSubtitle: 'Discards report grouped by area.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      area: 'Area',
    },
    areaPlaceholder: 'All',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    exportFileName: 'relatorio_descarte_romaneio',
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
