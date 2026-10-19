// src/constants/languages/languageEsEs/languageFeedlotWeighingPerformanceReport.ts
// Traducción ES-ES del módulo "Desempenho Pesagem Confinamento" (Desempeño
// de Pesaje del Confinamiento) — F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`. Mirror de
// `languagePtBr/languageFeedlotWeighingPerformanceReport.ts`.

import { ModuleFeedlotWeighingPerformanceReport } from '@/@types/language/module-feedlot-weighing-performance-report';

export const languageFeedlotWeighingPerformanceReport: ModuleFeedlotWeighingPerformanceReport = {
  report: {
    pageTitle: 'Desempeño de Pesaje del Confinamiento',
    pageSubtitle:
      'Informe de GMD y ganancia de peso del confinamiento, agrupado por Corral y Lote.',
    fields: {
      corral: 'Corral',
      batch: 'Lote',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    corralPlaceholder: 'Todos los corrales',
    batchPlaceholder: 'Todos los lotes',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
