// src/constants/languages/languageEnUs/languageTransferSalesContractReport.ts
// English translation of the "Delivery Note/Sales/Contract" module
// (Agriculture report, F-331, 97-Esteiras/008, TASK-RVC-FE-01). Mirror of
// `languagePtBr/languageTransferSalesContractReport.ts`.

import { ModuleTransferSalesContractReport } from '@/@types/language/module-transfer-sales-contract-report';

export const languageTransferSalesContractReport: ModuleTransferSalesContractReport = {
  report: {
    pageTitle: 'Delivery Note/Sales/Contract',
    pageSubtitle: 'Delivery note items report by sale/contract for the period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      client: 'Client',
      type: 'Type',
      product: 'Product',
      contract: 'Contract Number',
      format: 'Format',
    },
    clientPlaceholder: 'All clients',
    typePlaceholder: 'All types',
    productPlaceholder: 'All products',
    contractPlaceholder: 'All contracts',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    submitButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      startDateRequired: 'Start Date is required.',
      endDateRequired: 'End Date is required.',
      endDateAfterStartDate: 'End Date must be equal to or later than Start Date.',
    },
  },
};
