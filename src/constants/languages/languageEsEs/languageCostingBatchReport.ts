// src/constants/languages/languageEsEs/languageCostingBatchReport.ts
// Traducción ES del módulo "Custeio/Lote" (informe de costeo de Lote —
// F-20c552f0, esteira 97-Esteiras/074, TASK-CL-FE-01). Mirror de
// `languagePtBr/languageCostingBatchReport.ts`.

import { ModuleCostingBatchReport } from '@/@types/language/module-costing-batch-report';

export const languageCostingBatchReport: ModuleCostingBatchReport = {
  report: {
    pageTitle: 'Costeo/Lote',
    pageSubtitle: 'Informe de costeo de Lote por período.',
    fields: {
      batches: 'Lotes',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
    },
    batchesPlaceholder: 'Todos los lotes',
    periodRequiredHint: 'Informe el período (Fecha Inicial y Fecha Final) para generar el informe.',
    exportPdfButton: 'Descargar PDF',
    exportXlsxButton: 'Descargar Excel',
    successToast: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicial y Fecha Final) es obligatorio.',
    },
  },
};
