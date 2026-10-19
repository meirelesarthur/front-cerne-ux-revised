// src/constants/languages/languageEnUs/languageFinancialCashFlow.ts
// EN-US translation of the "Cash Flow" report (F-107, esteira 070,
// TASK-CF-FE-01). Mirror of
// `languagePtBr/languageFinancialCashFlow.ts` (same key shape).

import type { CashFlowLanguage } from '@/@types/language/module-financial/cash-flow';

export const languageFinancialCashFlow: CashFlowLanguage = {
  singularLabel: 'Cash Flow',
  pluralLabel: 'Cash Flows',
  pageTitle: 'Cash Flow Analysis',
  pageSubtitle: 'Realized Cash Flow',

  filter: {
    accountLabel: 'Bank Account',
    accountPlaceholder: 'All accounts',
    periodLabel: 'Period',
    periodOptions: {
      diary: 'Daily',
      monthly: 'Monthly',
      yearly: 'Yearly',
    },
    typeLabel: 'Type',
    typeOptions: {
      synthetic: 'Synthetic',
      analytical: 'Analytical',
    },
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    filterButton: 'Filter',
    clearButton: 'Clear',
    endAfterStartError: 'The end date must be on or after the start date.',
  },

  emptyBeforeFilter: 'Apply the filters and click Filter.',
  emptyReport: 'No information found.',
  errorMessage: 'Unable to load the cash flow report.',
  retryButton: 'Try again',

  cards: {
    sectionTitle: 'Balances',
    cashierLabel: 'Cash on Hand',
    accountsLabel: 'In Banks',
  },

  charts: {
    incomeExpenseTitle: 'Income x Expenses',
    balanceTitle: 'Starting Balance x Ending Balance',
    initialBalanceLabel: 'Starting Balance',
    finalBalanceLabel: 'Ending Balance',
  },

  table: {
    dateColumn: 'Movement Date',
    incomesColumn: 'Income',
    expensesColumn: 'Expenses',
    balanceDayColumn: 'Day Balance',
    balanceColumn: 'Bank Balance',
    totalRowLabel: 'Total',
  },

  drilldown: {
    title: 'Movements for the Date',
    dateColumn: 'Date',
    noteColumn: 'Note',
    typeColumn: 'Type',
    valueColumn: 'Value',
    notInformed: 'Not informed',
    incomeLabel: 'Income',
    expenseLabel: 'Expense',
  },

  resultTitle: 'Period result',
  printButton: 'Print',
};
