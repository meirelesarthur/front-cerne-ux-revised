// src/constants/languages/languageEsEs/languageAnimalsPerBatchReport.ts
// Traducción ES-ES del módulo "Animais por Lote" (Animales por Lote) — Tarea
// 51, esteira CORE_WORKSPACE/97-Esteiras/015. Mirror de
// `languagePtBr/languageAnimalsPerBatchReport.ts`.

import { ModuleAnimalsPerBatchReport } from '@/@types/language/module-animals-per-batch-report';

export const languageAnimalsPerBatchReport: ModuleAnimalsPerBatchReport = {
  report: {
    pageTitle: 'Animales por Lote',
    pageSubtitle: 'Informe de animales agrupados por lote, individual o agregado.',
    fields: {
      batch: 'Lote',
      viewType: 'Modo de Visualización',
      animal: 'Animal',
      format: 'Formato',
      viewTypeOptions: {
        individual: 'Individual',
        aggregated: 'Agregado',
      },
    },
    batchPlaceholder: 'Seleccione el lote',
    animalPlaceholder: 'Seleccione el animal',
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
    validation: {
      batchRequired: 'El lote es obligatorio.',
      viewTypeRequired: 'El modo de visualización es obligatorio.',
    },
  },
};
