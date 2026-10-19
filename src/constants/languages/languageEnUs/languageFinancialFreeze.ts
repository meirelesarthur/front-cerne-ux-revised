// src/constants/languages/languageEnUs/languageFinancialFreeze.ts
// EN-US translation of the "Financial Freezes" feature (FinancialFreeze —
// F-110, esteira 97-Esteiras/008, Tarefa 31). Composed inside
// `languageFinancial.ts` (key `financial.financialFreeze`, mirror
// `expense`/`mercadoPago`/`ofxImport`) — see
// `@/@types/language/module-financial/financial-freeze.d.ts` for the type.
//
// `singularLabel`/`pluralLabel` feed the query-key (canonical: derived from
// translation, English key — `get_pwa_constants_and_mappers_pattern` §6).

import type { FinancialFreezeLanguage } from '@/@types/language/module-financial/financial-freeze';

export const languageFinancialFreeze: FinancialFreezeLanguage = {
  singularLabel: 'Financial Freeze',
  pluralLabel: 'Financial Freezes',

  months: {
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },

  list: {
    pageTitle: 'Financial Freezes',
    pageSubtitle: 'Months with blocked financial entries.',
    table: {
      month: 'Month',
      year: 'Year',
      responsible: 'Responsible',
      isFrozen: 'Frozen?',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },
    actions: {
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
    },
    emptyState: {
      titleEmpty: 'No financial freeze registered.',
      descriptionEmpty: 'Register a freeze to block entries for the month.',
      titleFiltered: 'No results for this filter.',
      descriptionFiltered: 'Adjust the filters and try again.',
      cta: 'New',
    },
    deletedToast: 'deleted successfully',
  },

  filter: {
    title: 'Filter Financial Freezes',
    month: 'Month',
    monthAll: 'All months',
    year: 'Year',
    yearPlaceholder: 'E.g.: 2026',
  },

  form: {
    title: {
      create: 'New Financial Freeze',
      edit: 'Edit Financial Freeze',
      view: 'View Financial Freeze',
    },
    fields: {
      month: 'Month',
      year: 'Year',
      isFrozen: 'Frozen?',
    },
    validation: {
      monthRequired: 'Month is required.',
      yearRequired: 'Year is required.',
      yearDigits: 'Year must have 4 digits.',
      isFrozenRequired: 'The frozen field is required.',
    },
    createdToast: 'created successfully',
    updatedToast: 'updated successfully',
    historySection: {
      title: 'Movement History',
      emptyLabel: 'No movement registered.',
      columns: {
        isFrozen: 'Frozen?',
        responsible: 'Responsible',
        date: 'Date',
      },
    },
  },
};
