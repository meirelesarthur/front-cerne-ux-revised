// src/constants/languages/languageEnUs/languageLedgerReport.ts
// English translation of the "Ledger Report" module — F-274, 97-Esteiras/008,
// TASK-FE-LR-01. Mirror of `languagePtBr/languageLedgerReport.ts`. Post-delivery
// fix (2026-09-09): NO on-screen preview — download-only (PDF+Excel), true to
// the legacy screen.

import { ModuleLedgerReport } from '@/@types/language/module-ledger-report';

export const languageLedgerReport: ModuleLedgerReport = {
  report: {
    pageTitle: 'Ledger Report',
    pageSubtitle:
      'Accounting statement of a bank account over a period, with opening balance, current balance and monthly totals.',
    fields: {
      account: 'Account',
      startDate: 'Start Date',
      endDate: 'End Date',
      condition: 'Condition',
      proprietary: 'Managing Proprietary',
      costCenter: 'Cost Center',
      planAccount: 'Plan Account',
      categories: 'Financial Categories',
    },
    accountPlaceholder: 'Select the account',
    conditionPlaceholder: 'Select the condition',
    proprietaryPlaceholder: 'All proprietaries',
    costCenterPlaceholder: 'All cost centers',
    planAccountPlaceholder: 'All plan accounts',
    conditionOptions: {
      withoutCategory: 'Without Category',
      withCategory: 'With Category',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    emptyBeforeFilter:
      'Enter the account and the period (Start Date and End Date) to generate the report.',
    validation: {
      accountRequired: 'The account is required.',
      periodRequired: 'The period (Start Date and End Date) is required.',
      conditionRequired: 'The condition is required.',
    },
  },
};
