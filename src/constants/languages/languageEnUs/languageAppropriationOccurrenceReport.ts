// src/constants/languages/languageEnUs/languageAppropriationOccurrenceReport.ts
// English translation of the "Ocorrências Talhões" (Plot Occurrences) module
// — F-232, Task 50, esteira CORE_WORKSPACE/97-Esteiras/015. Mirror of
// `languagePtBr/languageAppropriationOccurrenceReport.ts`.

import { ModuleAppropriationOccurrenceReport } from '@/@types/language/module-appropriation-occurrence-report';

export const languageAppropriationOccurrenceReport: ModuleAppropriationOccurrenceReport = {
  report: {
    pageTitle: 'Plot Occurrences',
    pageSubtitle: 'Report of phytosanitary occurrences logged in Appropriation.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    productionCyclePlaceholder: 'Select the production cycle',
    areasPlaceholder: 'Select the areas',
    submitButton: 'Generate Report',
    successToast: 'Report generated successfully.',
    errorToast: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      periodOrder: 'The end date must be greater than or equal to the start date.',
    },
  },
};
