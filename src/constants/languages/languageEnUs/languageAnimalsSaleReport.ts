// src/constants/languages/languageEnUs/languageAnimalsSaleReport.ts
// English translation of the "Sales/Animals" module (Livestock domain,
// F-227, esteira 97-Esteiras/077). Mirror of
// `languagePtBr/languageAnimalsSaleReport.ts`.

import { ModuleAnimalsSaleReport } from '@/@types/language/module-animals-sale-report';

export const languageAnimalsSaleReport: ModuleAnimalsSaleReport = {
  report: {
    pageTitle: 'Sales/Animals',
    pageSubtitle: 'Animal sales report of the active farm, grouped by sale.',
    fields: {
      sale: 'Sale',
      batch: 'Batch',
      client: 'Client',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    salePlaceholder: 'All sales',
    batchPlaceholder: 'All batches',
    clientPlaceholder: 'All clients',
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'The End Date must be equal to or later than the Start Date.',
    },
  },
};
