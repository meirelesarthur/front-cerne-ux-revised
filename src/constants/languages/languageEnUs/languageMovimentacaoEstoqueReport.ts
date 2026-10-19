// src/constants/languages/languageEnUs/languageMovimentacaoEstoqueReport.ts
// English translation of the "Movimentação de Estoque" (Stock Movement)
// module — F-1f1d23e3, esteira 97-Esteiras/074, TASK-MOV-FE-01. Mirror of
// `languagePtBr/languageMovimentacaoEstoqueReport.ts`.

import { ModuleStockMovementReport } from '@/@types/language/module-stock-movement-report';

export const languageMovimentacaoEstoqueReport: ModuleStockMovementReport = {
  report: {
    pageTitle: 'Stock Movement',
    pageSubtitle: 'Stock movement report for the selected warehouse.',
    fields: {
      warehouse: 'Warehouse',
      startDate: 'Start Date',
      endDate: 'End Date',
      products: 'Product',
    },
    warehousePlaceholder: 'Select a warehouse',
    productsPlaceholder: 'All products',
    warehouseRequiredHint: 'Select a warehouse to generate the report.',
    downloadPdfButton: 'Download PDF',
    downloadExcelButton: 'Download Excel',
    downloadError: 'Could not generate the report.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      warehouseRequired: 'The warehouse is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};
