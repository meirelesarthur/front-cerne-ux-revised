// src/constants/languages/languageEnUs/languageSaleProductReport.ts
// English translation of the "Vendas/Produto" (Sales/Product) module — F-315,
// esteira 051, TASK-315-FE-01. Mirror of
// `languagePtBr/languageSaleProductReport.ts`.

import { ModuleSaleProductReport } from '@/@types/language/module-sale-product-report';

export const languageSaleProductReport: ModuleSaleProductReport = {
  report: {
    pageTitle: 'Sales/Product',
    pageSubtitle: 'Sales report grouped by product.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      product: 'Product',
      type: 'Type',
    },
    productPlaceholder: 'Select the product',
    typeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadError: 'Could not generate the report.',
    downloadSuccess: 'Report generated successfully.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      startDateRequired: 'The start date is required.',
      endDateRequired: 'The end date is required.',
      endDateAfterStartDate: 'The end date must be greater than or equal to the start date.',
    },
  },
};
