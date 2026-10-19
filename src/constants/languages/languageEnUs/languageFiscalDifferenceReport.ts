// src/constants/languages/languageEnUs/languageFiscalDifferenceReport.ts
// English translation of the "Fiscal/Non-Fiscal" module — F-266, lote 076.
// Mirror of `languagePtBr/languageFiscalDifferenceReport.ts`.

import { ModuleFiscalDifferenceReport } from '@/@types/language/module-fiscal-difference-report';

export const languageFiscalDifferenceReport: ModuleFiscalDifferenceReport = {
  report: {
    pageTitle: 'Fiscal/Non-Fiscal',
    pageSubtitle:
      'Financial report of movements classified as fiscal or non-fiscal, filterable by account, proprietary, cost center and category.',
    fields: {
      accounts: 'Accounts',
      proprietary: 'Proprietary',
      startDate: 'Start Date',
      endDate: 'End Date',
      costCenter: 'Cost Center',
      categories: 'Financial Categories',
      isFiscal: 'Fiscal/Non-Fiscal',
      condition: 'Type',
    },
    proprietaryPlaceholder: 'All proprietaries',
    costCenterPlaceholder: 'All cost centers',
    isFiscalOptions: {
      both: 'Both',
      yes: 'Yes',
      no: 'No',
    },
    conditionOptions: {
      withoutCategory: 'Without Category',
      withCategory: 'With Category',
    },
    lookupSearchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    lookupEmptyMessage: 'No items found.',
    exportPdfButton: 'Download PDF',
    exportXlsxButton: 'Download Excel',
    successToast: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
