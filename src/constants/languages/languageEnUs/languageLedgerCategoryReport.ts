// src/constants/languages/languageEnUs/languageLedgerCategoryReport.ts
// EN-US translation of the "Ledger by Category" module (Financial report —
// F-273, CONTRATO-F273-razao-categoria.md, execution 059). Structural
// mirror of `languageCashFlowByCategoryReport.ts`'s `report` block.

import { ModuleLedgerCategoryReport } from '@/@types/language/module-ledger-category-report';

export const languageLedgerCategoryReport: ModuleLedgerCategoryReport = {
  report: {
    pageTitle: 'Ledger by Category',
    pageSubtitle: 'Ledger report by financial category, for the selected period and filters.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
      proprietary: 'Owner',
      costCenter: 'Cost Center',
      categories: 'Categories',
      format: 'Format',
    },
    proprietaryPlaceholder: 'Select the owner',
    costCenterPlaceholder: 'Select the cost center',
    farmPlaceholder: 'Select the farm',
    lookupSearchPlaceholder: 'Search category...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    lookupEmptyMessage: 'No categories found.',
    generateButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The date is required.',
      periodOrder: 'End Date must be on or after Start Date.',
    },
  },
};
