// src/constants/languages/languageEnUs/languageNfeProductReport.ts
// English translation of the "Billing" module (Fiscal Management domain,
// F-286, esteira 97-Esteiras/054, TASK-054-286-FE-01). Mirror of
// `languagePtBr/languageNfeProductReport.ts`.

import { ModuleNfeProductReport } from '@/@types/language/module-nfe-product-report';

export const languageNfeProductReport: ModuleNfeProductReport = {
  report: {
    pageTitle: 'Billing',
    pageSubtitle: 'Billing report by product/invoice for the active farm.',
    fields: {
      startDate: 'Start Date',
      endDate: 'End Date',
      clientIds: 'Clients',
      farmIds: 'Farms',
      productIds: 'Products',
      issuerId: 'Issuer',
      type: 'File Type',
    },
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
    productsSearchPlaceholder: 'Search product...',
    productsSelectAll: 'Select all',
    productsDeselectAll: 'Deselect all',
    productsSelectedCount: 'Selected products',
    productsEmptyLabel: 'No product found.',
    issuerPlaceholder: 'Select the issuer',
    typeOptions: {
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
