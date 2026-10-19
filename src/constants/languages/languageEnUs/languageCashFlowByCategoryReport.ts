// src/constants/languages/languageEnUs/languageCashFlowByCategoryReport.ts
// English translation of the "Monthly Cash Flow" module — F-240, esteira
// 97-Esteiras/053, TASK-053-240-FE-01. Mirror of
// `languagePtBr/languageCashFlowByCategoryReport.ts`.

import { ModuleCashFlowByCategoryReport } from '@/@types/language/module-cash-flow-by-category-report';

export const languageCashFlowByCategoryReport: ModuleCashFlowByCategoryReport = {
  report: {
    pageTitle: 'Monthly Cash Flow',
    pageSubtitle: 'Monthly cash flow report grouped by financial category.',
    fields: {
      regime: 'Regime',
      startDate: 'Start Date',
      endDate: 'End Date',
      accounts: 'Accounts',
      lastBalance: 'Previous Balance',
      proprietary: 'Proprietary',
      costCenter: 'Cost Center',
      farm: 'Farm',
      reportType: 'Report Type',
      format: 'Format',
    },
    regimePlaceholder: 'Select the regime',
    proprietaryPlaceholder: 'All proprietaries',
    costCenterPlaceholder: 'All cost centers',
    farmPlaceholder: 'All',
    regimeOptions: {
      cash: 'Cash',
      accrual: 'Accrual',
    },
    lastBalanceOptions: {
      yes: 'Yes',
      no: 'No',
    },
    reportTypeOptions: {
      analytic: 'Analytic',
      synthetic: 'Synthetic',
    },
    lookupSearchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    lookupEmptyMessage: 'No items found.',
    generateButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
