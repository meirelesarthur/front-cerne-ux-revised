// src/constants/languages/languageEnUs/languageCostCenterReport.ts
// English translation of the "Cost Center" module — F-247, esteira
// 97-Esteiras/052, TASK-052-247-FE-02. Mirror of
// `languagePtBr/languageCostCenterReport.ts`.

import { ModuleCostCenterReport } from '@/@types/language/module-cost-center-report';

export const languageCostCenterReport: ModuleCostCenterReport = {
  report: {
    pageTitle: 'Cost Center',
    pageSubtitle: 'Result report grouped by Cost Center.',
    fields: {
      regime: 'Regime',
      startDate: 'Start Date',
      endDate: 'End Date',
      accounts: 'Accounts',
      proprietary: 'Proprietary',
      costCenter: 'Cost Center',
      farm: 'Farm',
    },
    regimePlaceholder: 'Select the regime',
    proprietaryPlaceholder: 'All proprietaries',
    costCenterPlaceholder: 'All cost centers',
    farmPlaceholder: 'All',
    regimeOptions: {
      cash: 'Cash',
      accrual: 'Accrual',
    },
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    previewError: 'Could not load the report preview.',
    retryButton: 'Try again',
    emptyBeforeFilter:
      'Enter the regime and the period (Start Date and End Date) to see the preview.',
    emptyReport: 'No information found.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
