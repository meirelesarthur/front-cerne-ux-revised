// src/constants/languages/languageEnUs/languageCashBooks.ts
// English translation of the "CashBook" module (LCDPR — Livro Caixa Digital
// do Produtor Rural, Fiscal domain, execution 045, TASK-LCDPR-FE-01).
// Structural mirror of `languageDfes` (same Fiscal domain).

import { ModuleCashBooks } from '@/@types/language/module-cash-books';

export const languageCashBooks: ModuleCashBooks = {
  cashBook: {
    singularLabel: 'Cash Book (LCDPR)',
    pluralLabel: 'Cash Books (LCDPR)',

    list: {
      pageTitle: 'Cash Book (LCDPR)',
      pageSubtitle: 'Manage the Digital Rural Producer Cash Book records.',
      table: {
        year: 'Year',
        proprietary: 'Proprietary',
        contador: 'Accountant',
      },
      actions: {
        view: 'View',
        downloadTxt: 'Download TXT',
        printReport: 'Print Report',
        delete: 'Delete',
      },
      downloadTxtError: 'Could not download this record’s TXT file.',
      downloadReportError: 'Could not generate this record’s report.',
      deleteConfirm: {
        title: 'Delete Cash Book record',
        description: 'Are you sure you want to delete the record for year',
        warning: 'This action cannot be undone.',
      },
      deleteSuccess: 'Record deleted successfully.',
      deleteError: 'Could not delete this record.',
      emptyState: {
        titleEmpty: 'No record generated yet.',
        descriptionEmpty: 'Create the first Cash Book (LCDPR) record for this farm.',
        titleFiltered: 'No record found.',
        descriptionFiltered: 'Try adjusting the applied filters.',
        cta: 'New Record',
      },
      error: {
        message: 'Could not load the Cash Book (LCDPR) records.',
        retry: 'Try again',
      },
    },

    filter: {
      title: 'Filter Cash Book (LCDPR)',
      year: 'Year',
      yearPlaceholder: 'e.g. 2026',
      proprietary: 'Proprietary',
      proprietaryPlaceholder: 'Search proprietary...',
      proprietaryAll: 'All',
    },

    form: {
      pageTitle: 'New Cash Book (LCDPR) Record',
      pageSubtitle: 'Generate a new Digital Rural Producer Cash Book record.',
      fields: {
        startDate: 'Start Date',
        endDate: 'End Date',
        proprietary: 'Proprietary',
        proprietaryPlaceholder: 'Select the proprietary',
        period: 'Bookkeeping Period',
        periodPlaceholder: 'Select the period',
        special: 'Special Situation',
        specialPlaceholder: 'Select the special situation',
        dtSpecial: 'Special Situation Date',
        verification: 'Assessment Method',
        verificationPlaceholder: 'Select the assessment method',
        contador: 'Accountant',
        contadorPlaceholder: 'Select the accountant',
      },
      validation: {
        startDateRequired: 'The start date is required.',
        endDateRequired: 'The end date is required.',
        endDateNotBeforeStart: 'The end date cannot be before the start date.',
        endDateNotTodayOrFuture: 'The end date cannot be today or in the future.',
        endDateSameYearAsStart: 'The start and end dates must be in the same year.',
        dateInvalid: 'The date entered is invalid.',
        dateMinYear: 'The year of the date cannot be earlier than 2000.',
        dtSpecialAfterEnd: 'The special situation date cannot be later than the end date.',
        proprietaryRequired: 'Select a proprietary.',
        proprietaryCpfRequired: 'Requires a valid CPF — fix the proprietary registration',
        periodRequired: 'Select the bookkeeping period.',
        specialRequired: 'Select the special situation.',
        dtSpecialRequired: 'The special situation date is required.',
        verificationRequired: 'Select the assessment method.',
        contadorRequired: 'Select an accountant.',
      },
      createSuccess: 'Record created successfully.',
      createGenericError: 'Could not create the record.',
      cancelButton: 'Cancel',
      submitButton: 'Save',
    },

    detail: {
      pageTitle: 'Cash Book (LCDPR) Record',
      metadata: {
        year: 'Year',
        proprietary: 'Proprietary',
        period: 'Bookkeeping Period',
        special: 'Special Situation',
        dtSpecial: 'Special Situation Date',
        dtSpecialEmpty: '—',
        verification: 'Assessment Method',
        contador: 'Accountant',
      },
      monthly: {
        title: 'Monthly Summary',
        table: {
          month: 'Month/Year',
          entrance: 'Income (R$)',
          exit: 'Expense (R$)',
          balance: 'Accumulated Balance',
        },
        totalsLabel: 'Annual totals',
      },
      actions: {
        downloadTxt: 'Download TXT',
        printReport: 'Print Report',
        delete: 'Delete',
      },
      downloadTxtError: 'Could not download the TXT file.',
      downloadReportError: 'Could not generate the report.',
      deleteConfirm: {
        title: 'Delete Cash Book record',
        description: 'Are you sure you want to delete this record',
        warning: 'This action cannot be undone.',
      },
      deleteSuccess: 'Record deleted successfully.',
      deleteError: 'Could not delete this record.',
      loadError: {
        message: 'Could not load this record.',
        retry: 'Try again',
      },
    },
  },
};
