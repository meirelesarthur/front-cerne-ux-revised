// src/constants/languages/languageEnUs/languageReceiptScheduleReport.ts
// English translation of the "Receipt Schedule" report module (Financeiro —
// F-304, esteira 97-Esteiras/055, TASK-055-F304-FE-01). Mirror
// `languagePtBr/languageReceiptScheduleReport.ts`.

import { ModuleReceiptScheduleReport } from '@/@types/language/module-receipt-schedule-report';

export const languageReceiptScheduleReport: ModuleReceiptScheduleReport = {
  receiptScheduleReport: {
    singularLabel: 'Receipt Schedule',
    pluralLabel: 'Receipt Schedules',
  },
  report: {
    pageTitle: 'Receipt Schedule',
    pageSubtitle: 'Accounts receivable report by due date.',
    submitButton: 'Generate Report',
    fields: {
      client: 'Client',
      farm: 'Farm',
      startDate: 'Due Date — Start',
      endDate: 'Due Date — End',
      proprietary: 'Managing Owner',
      costCenter: 'Cost Center',
      category: 'Financial Category',
      format: 'Format',
    },
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodOrder: 'The end date must be greater than or equal to the start date.',
    },
    empty: 'No item found.',
    error: 'Could not load the list.',
    retry: 'Try again',
    searchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
  },
};
