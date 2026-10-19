// src/constants/languages/languageEsEs/languageDeathAnimalSisbovReport.ts
// Traducción ES del módulo "Muertes/SISBOV" (dominio Pecuario, F-253,
// esteira 97-Esteiras/054, TASK-054-253-FE-01). Mirror de
// `languagePtBr/languageDeathAnimalSisbovReport.ts`.

import { ModuleDeathAnimalSisbovReport } from '@/@types/language/module-death-animal-sisbov-report';

export const languageDeathAnimalSisbovReport: ModuleDeathAnimalSisbovReport = {
  report: {
    pageTitle: 'Muertes/SISBOV',
    pageSubtitle: 'Informe de muertes con identificación SISBOV de la finca activa.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
