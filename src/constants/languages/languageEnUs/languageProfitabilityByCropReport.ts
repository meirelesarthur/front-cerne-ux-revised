// src/constants/languages/languageEnUs/languageProfitabilityByCropReport.ts
// English translation of the "Rentabilidade/Cultura" (Profitability by Crop)
// module — F-302, esteira 077. Mirror of
// `languagePtBr/languageProfitabilityByCropReport.ts`.

import { ModuleProfitabilityByCropReport } from '@/@types/language/module-profitability-by-crop-report';

export const languageProfitabilityByCropReport: ModuleProfitabilityByCropReport = {
  report: {
    pageTitle: 'Profitability by Crop',
    pageSubtitle: 'Consolidated profitability by crop/variety, for the period.',
    fields: {
      cultivation: 'Crop/Variety',
      harvest: 'Harvest',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    cultivationPlaceholder: 'Select the crop/variety',
    harvestPlaceholder: 'Select the harvest (optional)',
    downloadPdfButton: 'Download PDF',
    downloadError: 'Could not generate the report.',
    periodRequiredHint: 'Select the period (Start Date and End Date) to generate the report.',
    validation: {
      endDateAfterStartDate: 'The end date must be greater than or equal to the start date.',
    },
  },
};
