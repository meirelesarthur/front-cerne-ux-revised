// src/constants/languages/languageEnUs/languageProductionCostingAreaReport.ts
// English translation of the "Produção/Custeio/Área" (Production/Costing/Area)
// module — F-298, esteira 051, TASK-298-FE-01. Mirror of
// `languagePtBr/languageProductionCostingAreaReport.ts`.

import { ModuleProductionCostingAreaReport } from '@/@types/language/module-production-costing-area-report';

export const languageProductionCostingAreaReport: ModuleProductionCostingAreaReport = {
  report: {
    pageTitle: 'Production/Costing/Area',
    pageSubtitle: 'Production and costing report grouped by area.',
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
