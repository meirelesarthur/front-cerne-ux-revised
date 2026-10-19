// src/constants/languages/languageEnUs/languageSaleClientReport.ts
// English translation of the "Cliente/Produto" (Client/Product) module —
// F-313, esteira 054. Mirror of
// `languagePtBr/languageSaleClientReport.ts`.

import { ModuleSaleClientReport } from '@/@types/language/module-sale-client-report';

export const languageSaleClientReport: ModuleSaleClientReport = {
  report: {
    pageTitle: 'Client/Product',
    pageSubtitle: 'Sales report grouped by client and product.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      client: 'Client',
      product: 'Product',
      type: 'Type',
    },
    clientPlaceholder: 'Select the client',
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
