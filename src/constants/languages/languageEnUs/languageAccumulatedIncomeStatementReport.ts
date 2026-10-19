// src/constants/languages/languageEnUs/languageAccumulatedIncomeStatementReport.ts
// English translation of the "Accumulated Production Cost" module
// (financial report — F-217, esteira 97-Esteiras/058, TASK-058-F217-FE-01).
// Mirror of `languagePtBr/languageAccumulatedIncomeStatementReport.ts`.

import { ModuleAccumulatedIncomeStatementReport } from '@/@types/language/module-accumulated-income-statement-report';

export const languageAccumulatedIncomeStatementReport: ModuleAccumulatedIncomeStatementReport = {
  report: {
    pageTitle: 'Accumulated Production Cost',
    pageSubtitle: 'Accumulated production cost report by period (max. 12 months).',
    fields: {
      group: 'Basis',
      type: 'Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      calculationModule: 'Calculation Module',
      farm: 'Farm',
      proprietary: 'Owner',
      hasStock: 'Consider Stock',
      harvest: 'Harvest',
      costCenter: 'Cost Center',
      format: 'Report Type',
    },
    groupOptions: { cash: 'Cash', accrual: 'Accrual' },
    typeOptions: { synthetic: 'Synthetic', analytical: 'Analytical' },
    calculationModuleOptions: { financial: 'Financial', appropriation: 'Appropriation' },
    calculationModuleTooltip:
      'Financial considers posted financial movements; Appropriation also adds stock consumption/appropriations (only when Basis is Cash).',
    hasStockOptions: { no: 'No', yes: 'Yes' },
    hasStockTooltip: 'Injects Supplies/Production stock variation as a subgroup of Gross Revenue.',
    formatOptions: { pdf: 'PDF', excel: 'Excel' },
    farmPlaceholder: 'All',
    proprietaryPlaceholder: 'All',
    harvestPlaceholder: 'All',
    generateButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    lookupSearchPlaceholder: 'Search...',
    lookupEmptyMessage: 'No items found.',
    selectAll: 'Select all',
    deselectAll: 'Clear selection',
    validation: {
      invalidDateRange:
        'The period (Start Date and End Date) is required and End Date must be greater than or equal to Start Date.',
      maxTwelveMonths: 'The report period is limited to 12 months.',
    },
  },
};
