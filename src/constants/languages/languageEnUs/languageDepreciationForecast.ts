// src/constants/languages/languageEnUs/languageDepreciationForecast.ts
// EN-US translation of the DEPRECIATION FORECAST module (Base Registrations /
// Assets). TASK-FE-230: single read-only/simulation screen, no list/filter.

import { ModuleDepreciationForecast } from '@/@types/language/module-depreciation-forecast';

export const languageDepreciationForecast: ModuleDepreciationForecast = {
  form: {
    title: 'Depreciation Forecast',
    fields: {
      equipment: 'Asset',
      forecastTime: 'Forecast Horizon',
    },
    placeholders: {
      select: 'Select',
    },
    forecastOptions: [
      '3 months',
      '6 months',
      '9 months',
      '12 months',
      '15 months',
      '18 months',
      '21 months',
      '24 months',
      '27 months',
      '30 months',
      '33 months',
      '36 months',
      '39 months',
      '42 months',
      '45 months',
      '48 months',
    ],
  },
  result: {
    table: {
      month: 'Month/Year',
      valueToDepreciate: 'Value to Depreciate',
      monthlyDepreciation: 'Monthly Depreciation',
      remainingBalance: 'Remaining Balance',
      monthAbbreviations: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
    empty: {
      selectPrompt: 'Select an asset and a horizon to simulate the forecast.',
      noDepreciation: 'The selected asset has no depreciation.',
    },
    error: {
      title: 'Unable to calculate the forecast',
      description: 'An error occurred while fetching the depreciation forecast. Please try again.',
      retry: 'Try again',
    },
  },
};
