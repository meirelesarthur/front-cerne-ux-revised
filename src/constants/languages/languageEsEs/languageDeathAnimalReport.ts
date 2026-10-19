// src/constants/languages/languageEsEs/languageDeathAnimalReport.ts
// Traducción ES del módulo "Mortes" (dominio Pecuária, F-254, esteira
// 97-Esteiras/077). Mirror de
// `languagePtBr/languageDeathAnimalReport.ts`.

import { ModuleDeathAnimalReport } from '@/@types/language/module-death-animal-report';

export const languageDeathAnimalReport: ModuleDeathAnimalReport = {
  report: {
    pageTitle: 'Muertes',
    pageSubtitle: 'Informe de muertes de animales de la finca activa por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
      format: 'Formato',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generar Informe',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
