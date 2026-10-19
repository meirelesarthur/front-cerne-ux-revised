// src/constants/languages/languageEnUs/languageFinancialOfxImport.ts
// EN-US translation of the Consolidated Account Reconciliation Report
// (RelatorioConsolidado — SURF-033/034). Mirror of
// `languagePtBr/languageFinancialOfxImport.ts` (same key shape).
//
// REDUCED SCOPE (TASK-065-OFX-FE-01, merge 065 reconciliation): only
// `consolidatedReport` survives — the other sections were pruned, screens
// discarded/rebuilt under `languageOfxImports` (own module).

import type { OfxImportLanguage } from '@/@types/language/module-financial/ofx-import';

export const languageFinancialOfxImport: OfxImportLanguage = {
  singularLabel: 'OFX Import',
  pluralLabel: 'OFX Imports',

  consolidatedReport: {
    pageTitle: 'Consolidated Account Reconciliation Report',
    pageSubtitle: 'Consolidated reconciliation report by category/cost center.',
    accountLabel: 'Account',
    accountPlaceholder: 'All accounts',
    startDate: 'Start Date',
    endDate: 'End Date',
    conditionLabel: 'Category/Cost Center',
    conditionOptions: { withoutCategory: 'Without Category', withCategory: 'With Category' },
    providerLabel: 'Provider',
    providerPlaceholder: 'All providers',
    clientLabel: 'Client',
    clientPlaceholder: 'All clients',
    orderByLabel: 'Order by',
    orderByOptions: { recent: 'Most recent', oldest: 'Oldest' },
    periodRequiredHint: 'Select the period (Start and End Date) to generate the report.',
    downloadPdfButton: 'Export PDF',
    downloadExcelButton: 'Export Excel',
    downloadError: 'Unable to generate the report.',
    emptyState: 'No results for the given filters.',
    // NEW (F-213, batch 079, FE rework) — on-screen preview table.
    filterButton: 'Filter',
    emptyBeforeFilter: 'Fill in the period and click "Filter" to see the report.',
    previewError: 'Unable to load the report.',
    retryButton: 'Try again',
    recordsCount: (count: number) => `Records: ${count}`,
    table: {
      document: 'Document',
      participant: 'Participant',
      movementType: 'Movement Type',
      date: 'Consolidation Date',
      account: 'Account',
      value: 'Value',
      category: 'Category',
      center: 'Cost Center',
    },
    movementTypes: {
      income: 'Income',
      expense: 'Expense',
      both: 'Both',
      internalTransaction: 'Internal Transaction',
      movement: 'Movement',
      financing: 'Financing',
    },
  },
};
