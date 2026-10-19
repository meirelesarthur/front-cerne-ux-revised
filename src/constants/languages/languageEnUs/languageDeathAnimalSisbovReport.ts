// src/constants/languages/languageEnUs/languageDeathAnimalSisbovReport.ts
// English translation of the "Deaths/SISBOV" module (Livestock domain,
// F-253, esteira 97-Esteiras/054, TASK-054-253-FE-01). Mirror of
// `languagePtBr/languageDeathAnimalSisbovReport.ts`.

import { ModuleDeathAnimalSisbovReport } from '@/@types/language/module-death-animal-sisbov-report';

export const languageDeathAnimalSisbovReport: ModuleDeathAnimalSisbovReport = {
  report: {
    pageTitle: 'Deaths/SISBOV',
    pageSubtitle: 'Deaths report with SISBOV identification for the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    downloadPdfButton: 'Download PDF',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
