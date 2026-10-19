// src/constants/languages/languageEnUs/languageBirthAnimalSisbovReport.ts
// English translation of the "Births/SISBOV" module (Livestock domain,
// F-235, esteira 97-Esteiras/052, TASK-052-235-FE-01). Mirror of
// `languagePtBr/languageBirthAnimalSisbovReport.ts`.

import { ModuleBirthAnimalSisbovReport } from '@/@types/language/module-birth-animal-sisbov-report';

export const languageBirthAnimalSisbovReport: ModuleBirthAnimalSisbovReport = {
  report: {
    pageTitle: 'Births/SISBOV',
    pageSubtitle: 'Birth report with SISBOV identification for the active farm.',
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
