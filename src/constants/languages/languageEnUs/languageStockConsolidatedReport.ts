// src/constants/languages/languageEnUs/languageStockConsolidatedReport.ts
// English translation of the "Consolidated Stock" module (Stock domain,
// F-323, feature_id e70b8cad, esteira 97-Esteiras/079). Mirror of
// `languagePtBr/languageStockConsolidatedReport.ts`.

import { ModuleStockConsolidatedReport } from '@/@types/language/module-stock-consolidated-report';

export const languageStockConsolidatedReport: ModuleStockConsolidatedReport = {
  report: {
    pageTitle: 'Consolidated Stock',
    pageSubtitle: 'Consolidated stock balance of the active farm, by warehouse and product.',
    fields: {
      warehouses: 'Warehouses',
      group: 'Group',
      category: 'Category',
      kind: 'Kind',
      search: 'Search',
      product: 'Product',
      date: 'Date',
      format: 'Format',
    },
    placeholders: {
      warehouses: 'Select the warehouses',
      group: 'Select the group',
      category: 'Select the category',
      categoryDisabledHint: 'Select the group first',
      kind: 'Select the kind',
      kindDisabledHint: 'Select the category first',
      product: 'Search a product',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    warehousesRequiredHint: 'Select at least one warehouse to generate the report.',
    validation: {
      warehousesRequired: 'Select at least one warehouse.',
    },
  },
};
