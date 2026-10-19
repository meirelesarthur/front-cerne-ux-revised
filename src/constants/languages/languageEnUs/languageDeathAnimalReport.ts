// src/constants/languages/languageEnUs/languageDeathAnimalReport.ts
// English translation of the "Deaths" module (Livestock domain, F-254,
// esteira 97-Esteiras/077). Mirror of
// `languagePtBr/languageDeathAnimalReport.ts`.

import { ModuleDeathAnimalReport } from '@/@types/language/module-death-animal-report';

export const languageDeathAnimalReport: ModuleDeathAnimalReport = {
  report: {
    pageTitle: 'Deaths',
    pageSubtitle: 'Report of animal deaths on the active farm by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    formatOptions: {
      pdf: 'PDF',
      excel: 'Excel',
    },
    downloadButton: 'Generate Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
