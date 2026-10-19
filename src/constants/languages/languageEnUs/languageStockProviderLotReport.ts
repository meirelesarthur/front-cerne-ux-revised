// src/constants/languages/languageEnUs/languageStockProviderLotReport.ts
// English translation of the "Lot/Provider" module (Stock domain, F-324,
// esteira 97-Esteiras/052, TASK-052-324-FE-01). Mirror of
// `languagePtBr/languageStockProviderLotReport.ts`.

import { ModuleStockProviderLotReport } from '@/@types/language/module-stock-provider-lot-report';

export const languageStockProviderLotReport: ModuleStockProviderLotReport = {
  report: {
    pageTitle: 'Lot/Provider',
    pageSubtitle: 'Lot by provider report for the active farm.',
    fields: {
      provider: 'Provider',
      startDate: 'Start Date',
      endDate: 'End Date',
      format: 'Format',
    },
    providerPlaceholder: 'Select the provider',
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
