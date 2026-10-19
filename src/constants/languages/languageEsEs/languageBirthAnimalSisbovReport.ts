// src/constants/languages/languageEsEs/languageBirthAnimalSisbovReport.ts
// Traducción ES del módulo "Nacimientos/SISBOV" (dominio Pecuario, F-235,
// esteira 97-Esteiras/052, TASK-052-235-FE-01). Mirror de
// `languagePtBr/languageBirthAnimalSisbovReport.ts`.

import { ModuleBirthAnimalSisbovReport } from '@/@types/language/module-birth-animal-sisbov-report';

export const languageBirthAnimalSisbovReport: ModuleBirthAnimalSisbovReport = {
  report: {
    pageTitle: 'Nacimientos/SISBOV',
    pageSubtitle: 'Informe de nacimientos con identificación SISBOV de la finca activa.',
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
