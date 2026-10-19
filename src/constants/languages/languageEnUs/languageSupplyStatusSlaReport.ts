// src/constants/languages/languageEnUs/languageSupplyStatusSlaReport.ts
// English translation of the "SLA Report" module (SupplyStatusSlaReport —
// Administrative / Supplies, TASK-SLA-FE-01, esteira 97-Esteiras/037). See
// `@/@types/language/module-supply-status-sla-report` for the full contract.

import { ModuleSupplyStatusSlaReport } from '@/@types/language/module-supply-status-sla-report';

export const languageSupplyStatusSlaReport: ModuleSupplyStatusSlaReport = {
  titleModule: 'SLA Report',
  pageTitle: 'SLA Report',
  pageSubtitle:
    'Filter by a single purchase request or by a date range and generate the SLA report (.xlsx).',
  filter: {
    uuid: 'Purchase request',
    uuidPlaceholder: 'Search by code...',
    startDate: 'From',
    endDate: 'To',
    status: 'Status',
    statusPlaceholder: 'All statuses',
    generateButton: 'Generate',
    noTriggerHint: 'Select a purchase request or fill in both dates to generate the report.',
  },
  validation: {
    dateRangeRequired: 'Fill in both dates — from and to.',
  },
  toasts: {
    generating: 'Generating report...',
    success: 'Report generated successfully.',
    noDataError: 'No purchase request found with the informed filters.',
    slaConfigMissingError:
      'Configure the SLA parameter for every status before generating the report.',
    noActiveFarmError: 'No active farm in the request context.',
  },
};
