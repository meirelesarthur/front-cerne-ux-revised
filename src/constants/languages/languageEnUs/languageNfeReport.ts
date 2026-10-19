// src/constants/languages/languageEnUs/languageNfeReport.ts
// English translation of the "NFe/Issued" module (Fiscal Management domain,
// F-287, esteira 97-Esteiras/079, TASK-F287-FE-01). Mirror of
// `languagePtBr/languageNfeReport.ts`.

import { ModuleNfeReport } from '@/@types/language/module-nfe-report';

export const languageNfeReport: ModuleNfeReport = {
  report: {
    pageTitle: 'NFe/Issued',
    pageSubtitle: 'Report of NF-e invoices issued by the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status',
      clientIds: 'Client',
      farmIds: 'Farm',
      centerIds: 'Cost Center',
      issuerId: 'NF-e Issuer',
      providerId: 'Service Provider',
      format: 'Report Type',
    },
    statusPlaceholder: 'Select the status',
    clientsSearchPlaceholder: 'Search client...',
    clientsSelectAll: 'Select all',
    clientsDeselectAll: 'Deselect all',
    clientsSelectedCount: 'Selected clients',
    clientsEmptyLabel: 'No client found.',
    farmsSearchPlaceholder: 'Search farm...',
    farmsSelectAll: 'Select all',
    farmsDeselectAll: 'Deselect all',
    farmsSelectedCount: 'Selected farms',
    farmsEmptyLabel: 'No farm found.',
    centersSearchPlaceholder: 'Search cost center...',
    centersSelectAll: 'Select all',
    centersDeselectAll: 'Deselect all',
    centersSelectedCount: 'Selected cost centers',
    centersEmptyLabel: 'No cost center found.',
    issuerPlaceholder: 'Select the issuer',
    providerPlaceholder: 'Select the service provider',
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Generate report',
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      endDateBeforeStartDate: 'End Date must be on or after Start Date.',
    },
  },
};
