// src/constants/languages/languageEnUs/languageMovementSheets.ts
// EN-US translation of the "Bank Movement Import" module (Financial).
//
// Column labels (decision 2 — CLM-19 FIXED): the legacy screen swapped the
// "Responsible"/"Issue Date" headers against the rendered data (the
// "Responsible" header showed the DATE, the "Issue Date" header showed the
// user's NAME). Here each label is bound to the correct field — "Issue Date"
// → `date`, "Responsible" → `user.name`.

import { ModuleMovementSheets } from '@/@types/language/module-movement-sheets';

export const languageMovementSheets: ModuleMovementSheets = {
  movementSheet: {
    singularLabel: 'Bank Movement Import',
    pluralLabel: 'Bank Movement Imports',
    list: {
      pageTitle: 'Bank Movement Import',
      pageSubtitle: 'Review the bank movement batches already imported from spreadsheet.',
      importButtonLabel: 'Import spreadsheet',
      table: {
        code: 'Code',
        date: 'Issue Date',
        user: 'Responsible',
        createdAt: 'Imported at',
        actions: {
          viewDetail: 'View Detail',
        },
      },
      emptyState: {
        titleEmpty: 'No bank movement import found.',
        descriptionEmpty: 'No batches have been imported for the active farm yet.',
        titleFiltered: 'No bank movement import found.',
        descriptionFiltered: 'Try adjusting the date range or clearing the filter.',
      },
    },
    filter: {
      title: 'Filter imports',
      startDate: 'Issue Date (from)',
      endDate: 'Issue Date (to)',
      dateRangeInvalid: 'The end date cannot be earlier than the start date.',
    },
    importModal: {
      title: 'Import Bank Movements',
      subtitle: 'Download the template, fill it in and upload it to record a new batch.',
      downloadShortcut: 'Download template',
      instructions:
        'The spreadsheet has 15 columns (A-O): Bank Account, Account Type, Title No., Type, Managing Owner, Title Value, Issue Date, Due Date, Movement Date, Deductible, Description, Provider, Client, Category and Cost Center. Managing Owner is optional; Provider is required only for "C. à Pagar" and Client only for "C. à Receber" — the remaining columns are required on every row.',
      warning: {
        title: 'All-or-nothing import',
        description:
          'If any row in the spreadsheet has an error, NO row is imported — the operation creates and immediately settles a title for every valid row, so every row is validated in full before anything is saved.',
      },
      fileUpload: {
        label: 'Spreadsheet (.xls/.xlsx)',
        hint: '.xls or .xlsx file up to 10MB.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted. Upload an .xls or .xlsx file.',
        errorSizeMessage: 'The file exceeds the maximum allowed size (10MB).',
      },
      rowErrors: {
        title: 'Rows with errors',
      },
      result: {
        importedLabel: 'Movements imported',
        movementSheetCodeLabel: 'Batch code',
      },
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
      importSuccessToast: 'Bank movements imported successfully',
      downloadTemplateError: 'Could not download the template. Please try again.',
    },
    detail: {
      sections: {
        identification: 'Identification',
      },
      fields: {
        code: 'Code',
        date: 'Issue Date',
        user: 'Responsible',
      },
      notFound: {
        title: 'Import not found.',
        description: 'There is no bank movement import for the given identifier.',
        back: 'Back to list',
      },
      invalidParamsToast: {
        title: 'Invalid parameters',
        description: 'The import identifier is invalid to display the detail.',
      },
      noData: 'None',
      backButton: 'Back',
    },
  },
};
