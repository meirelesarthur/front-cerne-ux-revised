// src/constants/languages/languageEsEs/languageBirthReport.ts
// Traducción ES-ES del módulo "Nacimientos" (genérico) — F-236, esteira 053,
// TASK-053-236-FE-01. Mirror de `languagePtBr/languageBirthReport.ts`.

import { ModuleBirthReport } from '@/@types/language/module-birth-report';

export const languageBirthReport: ModuleBirthReport = {
  report: {
    pageTitle: 'Nacimientos',
    pageSubtitle: 'Informe de nacimientos por categoría y período.',
    fields: {
      category: 'Categoría',
      format: 'Formato',
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    categoryPlaceholder: 'Seleccione la categoría',
    downloadButton: 'Generar informe',
    downloadError: 'No fue posible generar el informe.',
    downloadSuccess: 'Informe generado con éxito.',
    periodRequiredHint: 'Informe el período (Fecha Inicio y Fecha Fin) para generar el informe.',
    validation: {
      periodRequired: 'El período (Fecha Inicio y Fecha Fin) es obligatorio.',
    },
  },
};
