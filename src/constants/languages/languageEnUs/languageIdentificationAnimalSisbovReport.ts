// src/constants/languages/languageEnUs/languageIdentificationAnimalSisbovReport.ts
// English translation of the "Identification/SISBOV" module (Livestock
// domain, F-270, esteira 97-Esteiras/078, TASK-F270-F01). Mirror of
// `languagePtBr/languageIdentificationAnimalSisbovReport.ts`.

import { ModuleIdentificationAnimalSisbovReport } from '@/@types/language/module-identification-animal-sisbov-report';

export const languageIdentificationAnimalSisbovReport: ModuleIdentificationAnimalSisbovReport = {
  report: {
    pageTitle: 'Identification/SISBOV',
    pageSubtitle: 'Identification report with SISBOV code for the active farm by period.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    downloadPdfButton: 'Download PDF',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period is required.',
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
