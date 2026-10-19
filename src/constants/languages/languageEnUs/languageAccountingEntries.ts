// src/constants/languages/languageEnUs/languageAccountingEntries.ts
// English translation of the "Partida Dobrada" module (AccountingEntry —
// Fiscal domain, F-128, 97-Esteiras/068, TASK-PD-FE-02). Structural mirror of
// `languageDfes.ts` (same Fiscal domain, own top-level module). Full shape
// required by `ModuleAccountingEntries` (both BR and US share the same
// `LanguageDate` interface) — `singularLabel`/`pluralLabel` are the pair
// actually consumed by the canonical `queryKey.accountingEntries` derivation.

import { ModuleAccountingEntries } from '@/@types/language/module-accounting-entries';

export const languageAccountingEntries: ModuleAccountingEntries = {
  accountingEntry: {
    singularLabel: 'Accounting Entry',
    pluralLabel: 'Accounting Entries',

    titleModule: 'Double-Entry Accounting',
    createTitle: 'New Accounting Entry',
    editTitle: 'Edit Accounting Entry',
    viewTitle: 'View Accounting Entry',

    list: {
      pageTitle: 'Double-Entry Accounting',
      pageSubtitle: 'Accounting entries for the active farm.',
      table: {
        code: 'Code',
        origin: 'Origin',
        description: 'Description',
        totalAmount: 'Total Amount',
        responsible: 'Responsible',
        date: 'Date',
      },
      emptyState: {
        titleEmpty: 'No accounting entries',
        descriptionEmpty: "You haven't created any Accounting Entry yet.",
        cta: 'New Entry',
        titleFiltered: 'No results found',
        descriptionFiltered: 'Adjust the applied filters and try again.',
      },
      error: {
        message: 'Could not load the accounting entries.',
        retry: 'Try again',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      deletedToast: 'Accounting Entry deleted successfully.',
    },

    origin: {
      administrative: 'Administrative',
      agriculture: 'Agriculture',
      livestock: 'Livestock',
    },

    condition: {
      debit: 'Debit',
      credit: 'Credit',
    },

    form: {
      fields: {
        date: 'Date',
        description: 'Description',
        origin: 'Origin',
        code: 'Code',
        codePlaceholder: 'Automatically generated',
        author: 'Responsible',
        totalAmount: 'Total Amount',
      },
      items: {
        sectionTitle: 'Entry Items (Debit and Credit)',
        sectionHint:
          'Each entry needs at least 1 debit item and 1 credit item, with matching totals.',
        fields: {
          planAccount: 'Chart of Accounts',
          condition: 'Type',
          value: 'Amount',
        },
        addRowLabel: 'Add item',
        removeRowLabel: 'Remove item',
        totalDebitLabel: 'Total Debit',
        totalCreditLabel: 'Total Credit',
        differenceHint: 'The difference between debit and credit must be zero to save.',
      },
    },

    validation: {
      itemsMinDebit: 'At least 1 debit item is required.',
      itemsMinCredit: 'At least 1 credit item is required.',
      itemsSumMismatch: 'The debit total must equal the credit total.',
      dateRequired: 'Date is required.',
      descriptionRequired: 'Description is required.',
      originRequired: 'Origin is required.',
      planAccountRequired: 'Chart of accounts is required.',
      conditionRequired: 'Type (Debit/Credit) is required.',
      valueRequired: 'Amount is required.',
      valueMin: 'Amount must be at least $0.01.',
    },

    filter: {
      title: 'Filter Accounting Entries',
      fields: {
        code: 'Code',
        origin: 'Origin',
        description: 'Description',
        startDate: 'Start date',
        endDate: 'End date',
        user: 'Responsible',
      },
    },

    // Double-Entry Accounting report (F-257, 069, TASK-PDR-FE-03).
    report: {
      pageTitle: 'Double-Entry Accounting',
      pageSubtitle: 'Double-Entry Accounting reports for the active farm.',
      reportTypeLabel: 'Report Type',
      reportTypeOptions: {
        journal: 'Journal',
        generalLedger: 'General Ledger',
        trialBalance: 'Trial Balance',
        balanceSheet: 'Balance Sheet (Simplified)',
      },
      planAccountLabel: 'Chart of Accounts',
      planAccountPlaceholder: 'All accounts',
      startDate: 'Start Date',
      endDate: 'End Date',
      periodRequiredHint: 'Enter the period (Start Date and End Date) to generate the report.',
      orderByLabel: 'Order by',
      orderByOptions: {
        recent: '+ Recent',
        oldest: '+ Oldest',
      },
      downloadPdfButton: 'Download PDF',
      downloadError: 'Could not generate the report.',
      validation: {
        reportTypeRequired: 'Report type is required.',
        planAccountProhibited: 'Chart of accounts does not apply to the Simplified Balance Sheet.',
        periodRequired: 'The period (Start Date and End Date) is required.',
      },
    },
  },
};
