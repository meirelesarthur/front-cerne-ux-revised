// src/constants/languages/languageEnUs/languageAnimalMovementAnalysisReport.ts
// EN-US translation of the "Batch Movement Analysis" module (Livestock
// report — F-223, CONTRATO-F223-analise-mov-lote.md, execution 059).
// Structural mirror of `languageAnimalBatchHistoryReport.ts`'s `report`
// block (F-221).

import { ModuleAnimalMovementAnalysisReport } from '@/@types/language/module-animal-movement-analysis-report';

export const languageAnimalMovementAnalysisReport: ModuleAnimalMovementAnalysisReport = {
  report: {
    pageTitle: 'Batch Movement Analysis',
    pageSubtitle: 'Animal movement report by batch, for the selected period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      batch: 'Batch',
      type: 'Format',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    validation: {
      endDateBeforeStart: 'End Date must be on or after Start Date.',
    },
    downloadButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
  },
};
