// src/constants/languages/languageEnUs/languageRainfalls.ts
// EN-US translation of the OPERATIONAL — Rainfall module — execution 041,
// TASK-FE-041-PLV-01..05. Mirror `languageDeathAnimals`, with this feature's
// own fields.

import { ModuleRainfalls } from '@/@types/language/module-rainfalls';

export const languageRainfalls: ModuleRainfalls = {
  rainfall: {
    singularLabel: 'Rainfall',
    pluralLabel: 'Rainfalls',
    list: {
      pageTitle: 'Rainfall',
      pageSubtitle: 'Rainfall records by area.',
      deletedToast: 'Rainfall record deleted successfully',
      table: {
        date: 'Date',
        user: 'Responsible',
        areas: 'Areas',
        areasEmpty: 'No areas',
        amount: 'Rainfall (mm)',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        import: 'Import',
        new: 'New',
      },
      emptyState: {
        titleEmpty: 'No rainfall records yet.',
        descriptionEmpty: 'Start by registering the first rainfall reading.',
        titleEmptyNoCreate: 'No rainfall records yet.',
        descriptionEmptyNoCreate: 'You do not have permission to register a new rainfall reading.',
        titleFiltered: 'No rainfall records found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New record',
      },
    },
    filter: {
      title: 'Filter rainfall',
      startDate: 'Start date',
      endDate: 'End date',
    },
    detail: {
      generalData: { title: 'General Data' },
      fields: {
        date: 'Date',
        user: 'Responsible',
        amount: 'Rainfall (mm)',
        areas: 'Areas',
        areasEmpty: 'No areas',
      },
      actions: { edit: 'Edit', back: 'Back' },
      notFound: {
        title: 'Rainfall record not found.',
        description: 'Check the link or go back to the list.',
        back: 'Back to list',
      },
    },
    form: {
      title: { create: 'New Rainfall', edit: 'Edit Rainfall' },
      fields: {
        date: 'Date',
        amount: 'Rainfall (mm)',
        areas: 'Areas',
        user: 'Responsible',
      },
      areasPicker: {
        searchPlaceholder: 'Search area',
        selectedCountLabel: 'Selected areas',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        emptyLabel: 'No areas found.',
        errorLabel: 'Error loading areas.',
        retryLabel: 'Try again',
      },
      validation: {
        dateRequired: 'Date is required.',
        amountRequired: 'Rainfall (mm) is required.',
        amountRange: 'Enter a value between 0 and 9999.9.',
        areasRequired: 'Select at least one area.',
      },
    },
    import: {
      title: 'Import rainfall',
      subtitle: 'Download the template, fill it in and upload the completed spreadsheet.',
      downloadShortcut: 'Download template',
      instructions:
        'Fill in the spreadsheet following the template, without changing the sheet structure.',
      warning: {
        title: 'Warning',
        description:
          'If any row or area in the spreadsheet is invalid, no record is imported (all-or-nothing import).',
      },
      fileUpload: {
        label: 'File',
        hint: 'Accepted formats: XLS, XLSX. Maximum size: 10MB.',
        dropzoneTitle: 'Drag the spreadsheet or click to select',
        dropzoneDraggingTitle: 'Drop the spreadsheet here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted.',
        errorSizeMessage: 'File exceeds the maximum size.',
      },
      rowErrors: { title: 'Spreadsheet errors', rowPrefix: 'Row {row}:' },
      result: { created: 'Records imported' },
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
      importSuccessToast: 'Rainfall import completed successfully.',
      downloadTemplateError: 'Could not download the template.',
    },
  },
};
