// src/constants/languages/languageEnUs/languageTransferDifferenceReport.ts
// -----------------------------------------------------------------------------
// EN-US translation of the "Romaneio/Diferença" module (agriculture report —
// Task 49, pipeline 97-Esteiras/014, feature_id c0b2369d).
// -----------------------------------------------------------------------------

import { ModuleTransferDifferenceReport } from '@/@types/language/module-transfer-difference-report';

export const languageTransferDifferenceReport: ModuleTransferDifferenceReport = {
  report: {
    pageTitle: 'Shipment/Difference',
    pageSubtitle: 'Shipment difference report, by client and period.',
    fields: {
      client: 'Client',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    clientPlaceholder: 'All clients',
    generateButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      datesRequired: 'Date is required.',
      invalidDateRange: 'The end date must be on or after the start date.',
    },
  },
};
