// src/constants/languages/languageEnUs/languageCostingLivestockAreaReport.ts
// English translation of the "Custeio/Área Pecuária" (Livestock Area
// Costing) module — F-251, CusteioAreaPecuaria-contrato-api.md, lote 076.
// Mirror of `languagePtBr/languageCostingLivestockAreaReport.ts`.

import { ModuleCostingLivestockAreaReport } from '@/@types/language/module-costing-livestock-area-report';

export const languageCostingLivestockAreaReport: ModuleCostingLivestockAreaReport = {
  report: {
    pageTitle: 'Livestock Area Costing',
    pageSubtitle: 'Costing report grouped by pasture area.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Area',
      grazings: 'Grazing Module',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    productionCyclePlaceholder: 'Select the production cycle',
    areasPlaceholder: 'Select the areas',
    grazingsPlaceholder: 'Select the grazing modules',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
    },
  },
};
