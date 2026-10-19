// src/constants/languages/languageEnUs/languageTransferBatchGrazingAreaReport.ts
// English translation of the "Transf/Lote/Módulo/Área" (Transfer/Batch/Module/
// Area) module — F-329, esteira 077, F-329-plano-front.md. Mirror of
// `languagePtBr/languageTransferBatchGrazingAreaReport.ts`.

import { ModuleTransferBatchGrazingAreaReport } from '@/@types/language/module-transfer-batch-grazing-area-report';

export const languageTransferBatchGrazingAreaReport: ModuleTransferBatchGrazingAreaReport = {
  report: {
    pageTitle: 'Transfer/Batch/Module/Area',
    pageSubtitle: 'Timeline of each batch by location (area/module/pen), within the period.',
    fields: {
      batchId: 'Batch',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    batchIdPlaceholder: 'Select the batch',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateBeforeStartDate: 'End Date cannot be earlier than Start Date.',
    },
  },
};
