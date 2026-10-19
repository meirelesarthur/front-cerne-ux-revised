// src/constants/languages/languageEnUs/languageTaxAccountsReport.ts
// EN-US translation of the "Tax Accounts" module (Financial report —
// F-327, execution 060). Structural mirror of
// `languageWeighingStockClientReport.ts`'s `report` block.

import { ModuleTaxAccountsReport } from '@/@types/language/module-tax-accounts-report';

export const languageTaxAccountsReport: ModuleTaxAccountsReport = {
  report: {
    pageTitle: 'Tax Accounts',
    pageSubtitle: 'Tax accounts report.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      isTaxation: 'Taxation',
      costCenter: 'Cost Center',
      provider: 'Provider',
      format: 'Format',
    },
    taxationOptions: {
      yes: 'Yes',
      no: 'No',
    },
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Download Report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      datesRequired: 'The period is required.',
      invalidDateRange: 'The end date must be greater than or equal to the start date.',
    },
  },
};
