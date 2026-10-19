// src/constants/languages/languageEsEs/languageAnimalMovementAnalysisReport.ts
// Traducción ES-ES del módulo "Análisis de Movimiento de Lote" (informe de
// Pecuaria — F-223, CONTRATO-F223-analise-mov-lote.md, ejecución 059).
// Mirror estructural del bloque `report` de
// `languageAnimalBatchHistoryReport.ts` (F-221).

import { ModuleAnimalMovementAnalysisReport } from '@/@types/language/module-animal-movement-analysis-report';

export const languageAnimalMovementAnalysisReport: ModuleAnimalMovementAnalysisReport = {
  report: {
    pageTitle: 'Análisis de Movimiento de Lote',
    pageSubtitle: 'Informe de movimiento de animales por lote, en el período seleccionado.',
    fields: {
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      batch: 'Lote',
      type: 'Formato',
    },
    outputTypeOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    validation: {
      endDateBeforeStart: 'La Fecha Final debe ser igual o posterior a la Fecha Inicial.',
    },
    downloadButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
  },
};
