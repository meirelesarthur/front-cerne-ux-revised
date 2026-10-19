// src/constants/languages/languageEnUs/languageMarkingForecastAreaReport.ts
// English translation of the "Prev. Área/Receita" (Area/Revenue Forecast)
// module — F-280, esteira 97-Esteiras/075, TASK-MFA-FE-01. Mirror of
// `languagePtBr/languageMarkingForecastAreaReport.ts`.

import { ModuleMarkingForecastAreaReport } from '@/@types/language/module-marking-forecast-area-report';

export const languageMarkingForecastAreaReport: ModuleMarkingForecastAreaReport = {
  report: {
    pageTitle: 'Area/Revenue Forecast',
    pageSubtitle: 'Area and revenue forecast report by production cycle.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Area',
      startDate: 'Start Date',
      endDate: 'End Date',
      variety: 'Variety',
      order: 'Harvest',
      week: 'Year Week',
      year: 'Year',
    },
    productionCyclePlaceholder: 'Select a production cycle',
    areasPlaceholder: 'Select one or more areas',
    varietyPlaceholder: 'Select a variety',
    harvestOrderLabel: (order: number) => `${order}${orderSuffix(order)} Harvest`,
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      endDateAfterStartDate: 'The end date must be on or after the start date.',
    },
  },
};

// Sufixo ordinal EN (1st/2nd/3rd/4th) — universo fechado {1,2,3,4} (`CL-17`),
// sem util genérico de i18n de números ordinais no projeto.
function orderSuffix(order: number): string {
  switch (order) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
