// src/constants/languages/languageEnUs/languageWeighingInOutReport.ts
// English translation of the "Weighing In/Out" module (Agriculture report,
// F-336, esteira 058, FRONT-F336-plano.md). Mirror of
// `languagePtBr/languageWeighingInOutReport.ts`.

import { ModuleWeighingInOutReport } from '@/@types/language/module-weighing-in-out-report';

export const languageWeighingInOutReport: ModuleWeighingInOutReport = {
  report: {
    pageTitle: 'Weighing In/Out',
    pageSubtitle: 'Weighing balance report by client (in/out).',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      product: 'Product',
      client: 'Client',
      warehouse: 'Warehouse',
      format: 'Format',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'Enter the period (Start Date and End Date).',
      productRequired: 'Select the product.',
    },
  },
};
