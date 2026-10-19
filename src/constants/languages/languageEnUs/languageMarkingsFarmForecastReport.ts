// src/constants/languages/languageEnUs/languageMarkingsFarmForecastReport.ts
// English translation of the "Farm/Revenue Forecast" module (Agriculture
// report, F-281, esteira 055, TASK-055-F281-FRONT-01). Mirror of
// `languagePtBr/languageMarkingsFarmForecastReport.ts`. Fixes the legacy
// screen, which showed `harvestOrderOptions` in Spanish regardless of the
// active locale (FID-G3F CL-016/RN-13).

import { ModuleMarkingsFarmForecastReport } from '@/@types/language/module-markings-farm-forecast-report';

export const languageMarkingsFarmForecastReport: ModuleMarkingsFarmForecastReport = {
  report: {
    pageTitle: 'Farm/Revenue Forecast',
    pageSubtitle: 'Harvest and revenue forecast report for the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      cultivation: 'Variety',
      forecast: 'Harvest Order',
      week: 'Week',
      year: 'Year',
    },
    cultivationPlaceholder: 'All varieties',
    forecastPlaceholder: 'All harvests',
    downloadButton: 'Generate PDF',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    harvestOrderOptions: {
      first: '1st Harvest',
      second: '2nd Harvest',
      third: '3rd Harvest',
    },
    validation: {
      periodInvalidRange: 'The End Date must be greater than or equal to the Start Date.',
      weekInvalid: 'Enter a valid week (1 to 53).',
      yearInvalid: 'Enter a valid year (4 digits).',
    },
  },
};
