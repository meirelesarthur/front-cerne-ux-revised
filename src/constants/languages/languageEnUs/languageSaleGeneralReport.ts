// src/constants/languages/languageEnUs/languageSaleGeneralReport.ts
// English translation of the "Vendas/Cliente" (Sales/Client) module — F-317,
// esteira 077. Mirror of `languagePtBr/languageSaleGeneralReport.ts`.

import { ModuleSaleGeneralReport } from '@/@types/language/module-sale-general-report';

export const languageSaleGeneralReport: ModuleSaleGeneralReport = {
  report: {
    pageTitle: 'Client',
    pageSubtitle: 'Sales report by client and product, without grouping.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      client: 'Client',
      product: 'Product',
      reportType: 'Format',
    },
    clientPlaceholder: 'Select the client',
    productPlaceholder: 'Select the product',
    formatOptions: {
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
