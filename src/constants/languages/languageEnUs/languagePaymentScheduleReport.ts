// src/constants/languages/languageEnUs/languagePaymentScheduleReport.ts
// EN-US translation of the "Payment Schedule" module (Financial report —
// F-294, execution 059). Structural mirror of
// `languageReceiptScheduleReport.ts`'s `report` block (F-304).

import { ModulePaymentScheduleReport } from '@/@types/language/module-payment-schedule-report';

export const languagePaymentScheduleReport: ModulePaymentScheduleReport = {
  paymentScheduleReport: {
    singularLabel: 'Payment Schedule Entry',
    pluralLabel: 'Payment Schedule',
  },
  report: {
    pageTitle: 'Payment Schedule',
    pageSubtitle: 'Payment schedule report, by period, status and other filters.',
    submitButton: 'Generate Report',
    fields: {
      number: 'Number',
      farm: 'Farm',
      startDate: 'Start Date',
      endDate: 'End Date',
      proprietary: 'Owner',
      status: 'Status',
      costCenter: 'Cost Center',
      category: 'Category',
      format: 'Format',
    },
    statusOptions: {
      dueSoon: 'Due soon',
      overdue: 'Overdue',
      partial: 'Partial',
      settled: 'Settled',
    },
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodOrder: 'End Date must be on or after Start Date.',
    },
    empty: 'No categories found.',
    error: 'Could not load the categories.',
    retry: 'Try again',
    searchPlaceholder: 'Search category...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
  },
};
