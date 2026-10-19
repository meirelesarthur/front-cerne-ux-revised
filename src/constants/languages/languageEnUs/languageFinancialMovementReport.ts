// src/constants/languages/languageEnUs/languageFinancialMovementReport.ts
// English translation of the "Financial Movement" (Bank Movement) module —
// F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01. Mirror of
// `languagePtBr/languageFinancialMovementReport.ts`.

import { ModuleFinancialMovementReport } from '@/@types/language/module-financial-movement-report';

export const languageFinancialMovementReport: ModuleFinancialMovementReport = {
  report: {
    pageTitle: 'Bank Movement',
    pageSubtitle: 'Bank/financial movement report by period.',
    fields: {
      accounts: 'Accounts',
      proprietary: 'Proprietary',
      types: 'Movement Type',
      centerId: 'Cost Center',
      categories: 'Categories',
      farm: 'Farm',
      condition: 'Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Report Type',
    },
    proprietaryPlaceholder: 'All',
    centerIdPlaceholder: 'All',
    farmPlaceholder: 'All',
    conditionOptions: {
      withoutCategory: 'Without Category',
      withCategory: 'With Category',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    typeOptions: {
      initialBalance: 'Initial Balance',
    },
    generateButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    lookupSearchPlaceholder: 'Search...',
    lookupEmptyMessage: 'No items found.',
    selectAll: 'Select all',
    deselectAll: 'Clear selection',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      invalidDateRange: 'The End Date must be greater than or equal to the Start Date.',
    },
  },
};
