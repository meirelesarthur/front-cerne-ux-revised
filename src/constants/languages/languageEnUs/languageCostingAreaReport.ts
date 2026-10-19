// src/constants/languages/languageEnUs/languageCostingAreaReport.ts
// English translation of the "Custeio/Área" (Costing/Area) module — F-252,
// esteira 079, TASK-252-FE-01. Mirror of
// `languagePtBr/languageCostingAreaReport.ts`.

import { ModuleCostingAreaReport } from '@/@types/language/module-costing-area-report';

export const languageCostingAreaReport: ModuleCostingAreaReport = {
  report: {
    pageTitle: 'Costing/Area',
    pageSubtitle: 'Costing report grouped by area.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    productionCyclePlaceholder: 'Select the production cycle',
    areasPlaceholder: 'Select the areas',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
