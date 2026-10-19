// src/constants/languages/languageEnUs/languageWeighingHarvestReport.ts
// English translation of the "Weighing/Harvest" module (Agriculture report,
// F-335, esteira 053, TASK-053-335-FE-01). Mirror of
// `languagePtBr/languageWeighingHarvestReport.ts`.

import { ModuleWeighingHarvestReport } from '@/@types/language/module-weighing-harvest-report';

export const languageWeighingHarvestReport: ModuleWeighingHarvestReport = {
  report: {
    pageTitle: 'Weighing/Harvest',
    pageSubtitle: 'Harvest weighing report for the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      product: 'Product',
      area: 'Area',
      warehouse: 'Warehouse',
      client: 'Client',
      type: 'Weighing Type',
      format: 'Format',
    },
    productPlaceholder: 'All products',
    areaPlaceholder: 'All areas',
    warehousePlaceholder: 'All warehouses',
    clientPlaceholder: 'All clients',
    typePlaceholder: 'All types',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
