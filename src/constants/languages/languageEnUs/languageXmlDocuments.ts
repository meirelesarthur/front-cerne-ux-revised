// src/constants/languages/languageEnUs/languageXmlDocuments.ts
// English (en-US) translation of the "Arquivos XML" module (F-133, Gestão
// Fiscal, esteira 97-Esteiras/008, Tarefa 36). `singularLabel`/`pluralLabel`/
// `issuersLabel` feed `queryKey.xmlDocuments.*` (query keys are always
// derived from the English dictionary — avoids cache collision across
// languages).

import { ModuleXmlDocuments } from '@/@types/language/module-xml-documents';

export const languageXmlDocuments: ModuleXmlDocuments = {
  singularLabel: 'XML File',
  pluralLabel: 'XML Files',
  issuersLabel: 'XML File Issuers',

  pageTitle: 'XML Files',
  pageSubtitle:
    'Query the electronic fiscal documents (NFe, MDFe, DFe, NFSe) of an issuer and period.',

  filter: {
    issuer: 'Issuer',
    issuerPlaceholder: 'Select the issuer',
    startDate: 'Issued from',
    endDate: 'Issued until',
    document: 'Document Type',
    status: 'Status',
    launched: 'Posted',
    launchedPlaceholder: 'All',
    submitButton: 'Search',
    clearButton: 'Clear',
    incompleteWarning: 'Enter issuer, period, type and status to search.',
  },

  documentTypeOptions: {
    todos: 'All',
    nfe: 'NFe',
    mdfe: 'MDFe',
    dfe: 'DFe',
    nfse: 'NFSe',
  },

  statusOptions: {
    aprovado: 'Approved',
    cancelado: 'Cancelled',
  },

  launchedOptions: {
    yes: 'Yes',
    no: 'No',
  },

  list: {
    table: {
      counterpartyName: 'Name / Company Name',
      chave: 'Access Key',
      amount: 'Amount',
      state: 'State',
      emittedAt: 'Issue Date',
    },
    groupFooterCount: '{{count}} docs',
  },

  totalsLabel: 'Grand total',
  awaitingFiltersTitle: 'Awaiting filters',
  awaitingFiltersDescription:
    'Enter issuer, period, type and status and click Search to list the XML files.',
  emptyTitle: 'No documents found.',
  emptyDescription: 'No documents in this period for the given filters.',
  errorMessage: 'Could not query the XML files.',

  copiedKeyLabel: 'Key copied!',
  copyKeyError: 'Could not copy the key.',

  actions: {
    downloadZip: 'Download ZIP',
    sendEmail: 'Send by email',
    noun: 'selected',
    clearSelection: 'Clear selection',
    selectAllInGroup: 'Select all in this group',
    downloadSuccess: 'ZIP downloaded successfully.',
    downloadError: 'Could not download the XML files ZIP.',
    sendEmailSuccess:
      'The XML files email was queued successfully. The accountants linked to the issuer will receive the ZIP by email shortly.',
    sendEmailError: 'Could not queue the XML files email.',
    notExportableReason: 'The XML for this document type is not yet available for export.',
  },
};
