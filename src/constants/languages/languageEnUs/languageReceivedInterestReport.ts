// src/constants/languages/languageEnUs/languageReceivedInterestReport.ts
// English translation of the "Received Interest" report module (Financeiro —
// esteira 97-Esteiras/014, Tarefa 49). Mirror of
// `languagePtBr/languageReceivedInterestReport.ts`.

import { ModuleReceivedInterestReport } from '@/@types/language/module-received-interest-report';

export const languageReceivedInterestReport: ModuleReceivedInterestReport = {
  receivedInterestReport: {
    singularLabel: 'Received Interest',
    pluralLabel: 'Received Interest',
  },
  report: {
    pageTitle: 'Received Interest',
    pageSubtitle: 'Received interest report for the active farm.',
    submitButton: 'Generate Report',
    fields: {
      client: 'Client',
      proprietary: 'Proprietary',
      startDate: 'Start Date',
      endDate: 'End Date',
      farm: 'Farm',
      format: 'Format',
    },
    downloadSuccess: 'Report generated successfully.',
    downloadError: 'Could not generate the report.',
    validation: {
      periodRequired: 'The period (Start Date and End Date) is required.',
      periodOrder: 'The end date must be greater than or equal to the start date.',
    },
    empty: 'No item found.',
    error: 'Could not load the list.',
    retry: 'Try again',
    searchPlaceholder: 'Search...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
  },
};
