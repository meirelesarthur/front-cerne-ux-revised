// src/constants/languages/languageEnUs/languageReceiptCashflowReport.ts
// EN-US translation of the "Monthly Receipt Flow" module (Financial report
// — F-303, execution 059). Structural mirror of
// `languageCashFlowByCategoryReport.ts`'s `report` block.

import { ModuleReceiptCashflowReport } from '@/@types/language/module-receipt-cashflow-report';

export const languageReceiptCashflowReport: ModuleReceiptCashflowReport = {
  report: {
    pageTitle: 'Monthly Receipt Flow',
    pageSubtitle: 'Monthly receipt flow report, by account, category and period.',
    fields: {
      accounts: 'Accounts',
      startDate: 'Start Date',
      endDate: 'End Date',
      proprietary: 'Owner',
      costCenter: 'Cost Center',
      categories: 'Categories',
      farm: 'Farm',
      format: 'Format',
    },
    proprietaryPlaceholder: 'Select the owner',
    costCenterPlaceholder: 'Select the cost center',
    farmPlaceholder: 'Select the farm',
    lookupSearchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    lookupEmptyMessage: 'No items found.',
    generateButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The date is required.',
    },
  },
};
