// src/constants/languages/languageEnUs/languageAnimalsReport.ts
// English translation of the "Herd/Stock" module (Livestock report — F-228,
// esteira 97-Esteiras/078, TASK-F228-F01). Mirror of
// `languagePtBr/languageAnimalsReport.ts`.

import { ModuleAnimalsReport } from '@/@types/language/module-animals-report';

export const languageAnimalsReport: ModuleAnimalsReport = {
  report: {
    pageTitle: 'Herd/Stock',
    pageSubtitle: 'Herd stock report grouped by category.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      species: 'Species',
    },
    speciesPlaceholder: 'Select the species',
    downloadPdfButton: 'Download PDF',
    exportFileName: 'relatorio-estoque-rebanho',
    popupBlocked: 'Could not open the new tab. Check your pop-up blocker.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      endDateAfterStartDate: 'The end date must be on or after the start date.',
      speciesRequired: 'Select at least one species.',
    },
  },
};
