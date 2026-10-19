// src/constants/languages/languageEsEs/languageWeighingBatchReport.ts
// Traducción ES-ES del módulo "Pesaje/Animal" (informe de Pecuaria —
// F-334). Mirror estructural del bloque `report` de
// `languageAccumulatedWeighingBatchReport.ts` (hermano "Pesaje/Lote").

import { ModuleWeighingBatchReport } from '@/@types/language/module-weighing-batch-report';

export const languageWeighingBatchReport: ModuleWeighingBatchReport = {
  report: {
    pageTitle: 'Pesaje/Animal',
    pageSubtitle: 'Informe de pesaje por animal, lote y categoría, en el período seleccionado.',
    fields: {
      batch: 'Lote',
      category: 'Categoría',
      animal: 'Animal',
      startDate: 'Fecha Inicial',
      endDate: 'Fecha Final',
      format: 'Formato',
    },
    batchPlaceholder: 'Seleccione el lote',
    categoryPlaceholder: 'Seleccione la categoría',
    animalPlaceholder: 'Seleccione el animal',
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    periodRequiredHint: 'Seleccione la Fecha Inicial y la Fecha Final para generar el informe.',
    validation: {
      periodRequired: 'La fecha es obligatoria.',
    },
  },
};
