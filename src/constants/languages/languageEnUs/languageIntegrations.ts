// src/constants/languages/languageEnUs/languageIntegrations.ts
// English translation of the shared "Integrations" module — export screens
// of the Integrations area (F-119 "NFS-e Export → Domínio", canário of
// `97-Esteiras/071`; reusable by the sister features F-116/117/118/120,
// Decision E of `ExportNfseDominio-contrato-tela.md`). Mirror structure of
// languagePtBr/languageIntegrations.ts.

import { ModuleIntegrations } from '@/@types/language/module-integrations';

export const languageIntegrations: ModuleIntegrations['integrations'] = {
  singularLabel: 'Integration',
  pluralLabel: 'Integrations',
  exportNfseDominio: {
    titleModule: 'NFS-e Export (Domínio)',
    form: {
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      exportButton: 'Export data',
      validation: {
        endBeforeStart: 'The end date must be greater than or equal to the start date.',
      },
    },
    toasts: {
      successTitle: 'Export generated',
      successDescription: 'The file was downloaded successfully.',
      errorTitle: 'Export failed',
    },
  },
  exportMovementsDominio: {
    titleModule: 'Bank Movement Export (Domínio)',
    form: {
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      typeLabel: 'Data type',
      exportButton: 'Export data',
      typeOptions: {
        income: 'Income',
        expense: 'Expense',
      },
      validation: {
        endBeforeStart: 'The end date must be greater than or equal to the start date.',
      },
    },
    toasts: {
      successTitle: 'Export generated',
      successDescription: 'The file was downloaded successfully.',
      errorTitle: 'Export failed',
    },
  },
  exportEarningsDominio: {
    titleModule: 'Payroll Export (Domínio)',
    form: {
      yearLabel: 'Year',
      monthLabel: 'Month',
      exportButton: 'Export data',
      months: {
        jan: 'January',
        feb: 'February',
        mar: 'March',
        apr: 'April',
        may: 'May',
        jun: 'June',
        jul: 'July',
        aug: 'August',
        sep: 'September',
        oct: 'October',
        nov: 'November',
        dec: 'December',
      },
      validation: {
        yearRequired: 'Select the year.',
        monthRequired: 'Select the month.',
      },
    },
    toasts: {
      successTitle: 'Export generated',
      successDescription: 'The file was downloaded successfully.',
      errorTitle: 'Export failed',
    },
  },
  exportFinancialCsv: {
    titleModule: 'Financial CSV Export (Paid/Received Accounts)',
    form: {
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      exportButton: 'Export data',
      validation: {
        endBeforeStart: 'The end date must be greater than or equal to the start date.',
      },
    },
    toasts: {
      successTitle: 'Export generated',
      successDescription: 'The file was downloaded successfully.',
      errorTitle: 'Export failed',
    },
  },
  exportExpensesIncomesDominio: {
    titleModule: 'Export Data Domínio — Accounts Payable/Receivable',
    form: {
      farmLabel: 'Farm',
      startDateLabel: 'Issue date start',
      endDateLabel: 'Issue date end',
      startDueDateLabel: 'Due date start',
      endDueDateLabel: 'Due date end',
      proprietaryLabel: 'Managing owner',
      statusLabel: 'Status',
      centerLabel: 'Cost center',
      typeLabel: 'Data type',
      categoriesLabel: 'Categories',
      exportButton: 'Export data',
      validation: {
        endBeforeStart: 'The end date must be greater than or equal to the start date.',
        endDueBeforeStartDue:
          'The due end date must be greater than or equal to the due start date.',
      },
      status: {
        aVencer: 'Due',
        vencido: 'Overdue',
        baixaParcial: 'Partial write-off',
        baixado: 'Written off',
        adiantPendente: 'Advance pending',
        adiantBaixado: 'Advance written off',
        faturaPendente: 'Invoice pending',
        faturaBaixado: 'Invoice written off',
      },
      type: {
        expense: 'Accounts Payable',
        income: 'Accounts Receivable',
      },
    },
    toasts: {
      successTitle: 'Export generated',
      successDescription: 'The file was downloaded successfully.',
      errorTitle: 'Export failed',
    },
  },
};
