// src/constants/languages/languageEnUs/languageAccountsPayableReceivableReport.ts
// English translation of the "Consolidated Payable/Receivable" module —
// F-214, esteira 97-Esteiras/052. Mirror of
// `languagePtBr/languageAccountsPayableReceivableReport.ts`.

import { ModuleAccountsPayableReceivableReport } from '@/@types/language/module-accounts-payable-receivable-report';

export const languageAccountsPayableReceivableReport: ModuleAccountsPayableReceivableReport = {
  report: {
    pageTitle: 'Consolidated (Payable/Receivable)',
    pageSubtitle: 'Consolidated report of accounts payable and receivable, with write-off status.',
    fields: {
      startEmissionDate: 'Emission Date Start',
      endEmissionDate: 'Emission Date End',
      startWriteOffDate: 'Write-off Date Start',
      endWriteOffDate: 'Write-off Date End',
      provider: 'Provider',
      client: 'Client',
      center: 'Cost Center',
      account: 'Account',
      category: 'Financial Category',
      status: 'Status',
      format: 'Format',
    },
    providerPlaceholder: 'All providers',
    clientPlaceholder: 'All clients',
    centerPlaceholder: 'All cost centers',
    accountPlaceholder: 'All accounts',
    categoryPlaceholder: 'All categories',
    statusOptions: {
      open: 'Open',
      partial: 'Partial',
      settled: 'Settled',
      advance: 'Advance',
    },
    lookupSearchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    lookupEmptyMessage: 'No items found.',
    generateButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      emissionRequired: 'The emission date is required.',
      invalidEmissionDateRange: 'The emission end date must be equal to or after the start date.',
      invalidWriteOffDateRange: 'The write-off end date must be equal to or after the start date.',
      formatRequired: 'The format is required.',
    },
  },
};
