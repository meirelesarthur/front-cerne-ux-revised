// src/constants/languages/languageEsEs/languageTransferBatchGrazingAreaReport.ts
// Traducción ES-ES del módulo "Transf/Lote/Módulo/Área" — F-329, esteira 077,
// F-329-plano-front.md. Mirror de
// `languagePtBr/languageTransferBatchGrazingAreaReport.ts`.

import { ModuleTransferBatchGrazingAreaReport } from '@/@types/language/module-transfer-batch-grazing-area-report';

export const languageTransferBatchGrazingAreaReport: ModuleTransferBatchGrazingAreaReport = {
  report: {
    pageTitle: 'Transf/Lote/Módulo/Área',
    pageSubtitle: 'Línea de tiempo de cada lote por ubicación (área/módulo/corral), en el período.',
    fields: {
      batchId: 'Lote',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    batchIdPlaceholder: 'Seleccione el lote',
    downloadPdfButton: 'Descargar PDF',
    downloadError: 'No fue posible generar el informe.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
      endDateBeforeStartDate: 'La Fecha Fin no puede ser anterior a la Fecha Inicio.',
    },
  },
};
