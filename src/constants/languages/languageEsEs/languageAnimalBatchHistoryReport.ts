// src/constants/languages/languageEsEs/languageAnimalBatchHistoryReport.ts
// Traducción ES del módulo "Histórico de Animales/Lote" (informe de
// Pecuária, F-221, esteira 058, TASK-058-F221-FE-01). Mirror de
// `languagePtBr/languageAnimalBatchHistoryReport.ts`.

import { ModuleAnimalBatchHistoryReport } from '@/@types/language/module-animal-batch-history-report';

export const languageAnimalBatchHistoryReport: ModuleAnimalBatchHistoryReport = {
  report: {
    pageTitle: 'Histórico de Animales/Lote',
    pageSubtitle: 'Informe de histórico de animales por lote.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      batch: 'Lote',
      status: 'Estado',
      type: 'Tipo de Informe',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    requiredFieldsHint: 'Informe la Fecha Inicial y el Lote para generar el informe.',
    downloadButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
  },
};
