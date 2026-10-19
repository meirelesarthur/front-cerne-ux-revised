// src/constants/languages/languageEsEs/languageIdentificationAnimalSisbovReport.ts
// Traducción ES del módulo "Identificación/SISBOV" (dominio Pecuario, F-270,
// esteira 97-Esteiras/078, TASK-F270-F01). Mirror de
// `languagePtBr/languageIdentificationAnimalSisbovReport.ts`.

import { ModuleIdentificationAnimalSisbovReport } from '@/@types/language/module-identification-animal-sisbov-report';

export const languageIdentificationAnimalSisbovReport: ModuleIdentificationAnimalSisbovReport = {
  report: {
    pageTitle: 'Identificación/SISBOV',
    pageSubtitle: 'Informe de identificación con código SISBOV de la finca activa por período.',
    fields: {
      startDate: 'Fecha Inicio',
      endDate: 'Fecha Fin',
    },
    downloadPdfButton: 'Descargar PDF',
    downloadSuccess: 'Informe generado con éxito.',
    downloadError: 'No fue posible generar el informe.',
    validation: {
      periodRequired: 'El período es obligatorio.',
      endDateBeforeStartDate: 'La Fecha Fin debe ser igual o posterior a la Fecha Inicio.',
    },
  },
};
