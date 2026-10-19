// src/constants/languages/languageEnUs/languageWeighingStockClientReport.ts
// EN-US translation of the "Warehouse/Client Weighing" module (Inventory
// report — F-337, execution 059). Structural mirror of
// `languageStockAbcReport.ts`'s `report` block.

import { ModuleWeighingStockClientReport } from '@/@types/language/module-weighing-stock-client-report';

export const languageWeighingStockClientReport: ModuleWeighingStockClientReport = {
  report: {
    pageTitle: 'Warehouse/Client Weighing',
    pageSubtitle: 'Weighing report by warehouse and client.',
    fields: {
      product: 'Product',
      client: 'Client',
      warehouse: 'Warehouse',
      format: 'Format',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
  },
};
