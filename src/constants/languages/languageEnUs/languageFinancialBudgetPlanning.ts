// src/constants/languages/languageEnUs/languageFinancialBudgetPlanning.ts
// EN-US translation of the "Prev. Orçamentária" (Annual Budget Planning)
// feature (BudgetPlanning — F-106, esteira 97-Esteiras/067, TASK-PO-FE-02).
// Composed inside `languageFinancial.ts` (key `financial.budgetPlanning`,
// mirror `expense`/`mercadoPago`/`ofxImport`/`financialFreeze`) — see
// `@/@types/language/module-financial/budget-planning.d.ts` for the type.

import type { BudgetPlanningLanguage } from '@/@types/language/module-financial/budget-planning';

export const languageFinancialBudgetPlanning: BudgetPlanningLanguage = {
  singularLabel: 'Budget Planning',
  pluralLabel: 'Budget Plannings',
  titleModule: 'Budget Planning',
  createTitle: 'New Budget Planning',
  editTitle: 'Edit Budget Planning',
  viewTitle: 'View Budget Planning',

  list: {
    table: {
      code: 'Code',
      date: 'Date',
      year: 'Year',
      responsavel: 'Responsible',
      actions: 'Actions',
    },
    emptyState: {
      title: 'No budget planning found.',
    },
    error: {
      message: 'Could not load the budget plannings.',
      retry: 'Try again',
    },
    filter: {
      yearLabel: 'Year',
      filterButton: 'Filter',
      clearButton: 'Clear',
    },
  },

  form: {
    fields: {
      dateLabel: 'Date',
      yearLabel: 'Year',
      codePlaceholder: 'Automatically generated',
      authorLabel: 'Responsible',
    },
    grid: {
      categoryColumn: 'Category',
      lastYearValueColumn: 'Last Year Value',
      totalYearColumn: 'Year Total',
      totalMonthRow: 'Total',
      totalGeneral: 'Grand Total',
      emptyEligible: 'No eligible category found for the grid.',
      error: {
        message: 'Could not load the eligible categories for the grid.',
        retry: 'Try again',
      },
    },
    validation: {
      dateRequired: 'Date is required.',
      yearRequired: 'Year is required.',
      categoriesRequired: 'Enter at least 1 value in the grid.',
    },
  },

  import: {
    menuLabel: 'Import',
    title: 'Import Budget Planning',
    subtitle: 'Upload a spreadsheet (.xlsx) with the monthly category grid already filled in.',
    yearLabel: 'Year',
    yearRequired: 'Year is required.',
    fileRequired: 'Select a .xlsx file.',
    downloadShortcut: 'Download template',
    downloadTemplateError: 'Could not download the template.',
    fileUpload: {
      label: 'File (.xlsx)',
      hint: 'Upload the filled-in spreadsheet (.xlsx, up to 10MB).',
      dropzoneTitle: 'Drag a file or click to select',
      dropzoneDraggingTitle: 'Drop the file here',
      changeLabel: 'Change file',
      removeLabel: 'Remove file',
      errorTypeMessage: 'File type not accepted (use .xlsx).',
      errorSizeMessage: 'File exceeds the maximum size (10MB).',
    },
    rowErrors: {
      title: 'Fix the rows below and try again:',
    },
    cancelButton: 'Cancel',
    submitButton: 'Import',
    success: 'Budget planning imported successfully.',
  },

  predictedReport: {
    title: 'Annual Predicted × Realized',
    subtitle: 'Generate the report comparing predicted and actual values for the selected year.',
    menuLabel: 'Predicted × Realized Report',
    yearLabel: 'Year',
    yearRequired: 'Year is required.',
    typeLabel: 'Format',
    typeRequired: 'Format is required.',
    typePdf: 'PDF',
    typeXlsx: 'Excel',
    farmLabel: 'Farm',
    submitButton: 'Generate report',
    success: 'Report generated successfully.',
    genericError: 'Could not generate the report.',
  },

  actions: {
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
  },

  toasts: {
    createSuccess: 'Budget planning created successfully.',
    updateSuccess: 'Budget planning updated successfully.',
    deleteSuccess: 'Budget planning deleted successfully.',
  },
};
