// src/constants/languages/languageEsEs/languageAnimalRecordReport.ts
// Traducción ES del módulo "Ficha Animal" (Ficha del Animal) — F-225,
// 97-Esteiras/012, Tarefa 47. Mirror de
// `languagePtBr/languageAnimalRecordReport.ts`.

import { ModuleAnimalRecordReport } from '@/@types/language/module-animal-record-report';

export const languageAnimalRecordReport: ModuleAnimalRecordReport = {
  report: {
    pageTitle: 'Ficha del Animal',
    pageSubtitle: 'Informe de ficha individual de los animales de la finca activa.',
    filters: {
      category: 'Categoría',
      batch: 'Lote',
      animal: 'Animal',
    },
    filterAllPlaceholder: 'Todas',
    submitButton: 'Generar Informe',
    successToast: 'Informe generado con éxito.',
    errorToast: 'No fue posible generar el informe.',
  },
};
