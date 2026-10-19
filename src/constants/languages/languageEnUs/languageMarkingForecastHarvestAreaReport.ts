// src/constants/languages/languageEnUs/languageMarkingForecastHarvestAreaReport.ts
// EN-US translation of the "Harvest Forecast/Area" module (Farming report —
// F-282, execution 059). Structural mirror of
// `languageMarkingForecastAreaReport.ts`'s `report` block (F-280).

import { ModuleMarkingForecastHarvestAreaReport } from '@/@types/language/module-marking-forecast-harvest-area-report';

export const languageMarkingForecastHarvestAreaReport: ModuleMarkingForecastHarvestAreaReport = {
  report: {
    pageTitle: 'Harvest Forecast/Area',
    pageSubtitle: 'Harvest forecast report by area, production cycle and crop.',
    fields: {
      productionCycle: 'Production Cycle',
      areas: 'Areas',
      startDate: 'Start Date',
      endDate: 'End Date',
      cultivation: 'Crop/Variety',
      forecast: 'Harvest',
      week: 'Week',
      year: 'Year',
    },
    productionCyclePlaceholder: 'Select the production cycle',
    areasPlaceholder: 'Select the areas',
    cultivationPlaceholder: 'Select the crop/variety',
    forecastPlaceholder: 'Select the harvest',
    forecastOrderLabel: (order: number) =>
      `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'} Harvest`,
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    toasts: {
      success: 'Report generated successfully.',
      genericError: 'Could not generate the report.',
    },
    validation: {
      endDateAfterStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
