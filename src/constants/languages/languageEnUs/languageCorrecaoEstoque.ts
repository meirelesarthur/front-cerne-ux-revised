// src/constants/languages/languageEnUs/languageCorrecaoEstoque.ts
// EN-US translation of the STOCK CORRECTION module (Administrative — Stock).

import { ModuleCorrecaoEstoque } from '@/@types/language/module-correcao-estoque';

export const languageCorrecaoEstoque: ModuleCorrecaoEstoque = {
  stockCorrection: {
    singularLabel: 'Stock Correction',
    pluralLabel: 'Stock Corrections',
    list: {
      pageTitle: 'Stock Correction',
      pageSubtitle: 'View and import manual stock corrections via spreadsheet.',
      table: {
        code: 'Code',
        date: 'Date',
        user: 'Responsible',
        createdAt: 'Registered at',
        actions: {
          viewDetail: 'View Detail',
          delete: 'Delete',
        },
      },
      emptyState: {
        titleEmpty: 'No stock corrections found.',
        descriptionEmpty: 'No corrections have been imported for the active farm yet.',
        titleFiltered: 'No stock corrections found.',
        descriptionFiltered: 'Try adjusting the period or clearing the filter.',
      },
      deletedToast: 'Stock correction deleted successfully',
      deleteDialog: {
        description: 'Are you sure you want to delete the stock correction',
        warning:
          'Deleting this correction reverses its effect on the stock balance and recalculates the average cost of every product on the farm. This action cannot be undone and may impact financial reports already issued.',
      },
    },
    filter: {
      title: 'Filter stock corrections',
      startDate: 'Registration date (from)',
      endDate: 'Registration date (to)',
      dateRangeInvalid: 'The end date cannot be earlier than the start date.',
    },
    importModal: {
      menuButtonLabel: 'Import spreadsheet',
      title: 'Import Stock Correction',
      subtitle:
        'Download the template, fill it in and upload the spreadsheet to record a new correction.',
      downloadShortcut: 'Download template',
      instructions:
        'The spreadsheet has 5 columns: Warehouse, Product, Lot, Total Qty. and New Average Cost. Lot and New Average Cost are optional per row — the remaining columns are required.',
      warning: {
        title: 'Farm-wide average cost recalculation',
        description:
          'Importing recalculates the average cost of the entire stock of the active farm and may take a few seconds on large product catalogs. This correction is always a NEW record — it never replaces or deletes any existing correction.',
      },
      fileUpload: {
        label: 'Spreadsheet (.xlsx)',
        hint: 'Up to 10MB .xlsx file.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted. Please upload an .xlsx file.',
        errorSizeMessage: 'The file exceeds the maximum allowed size (10MB).',
      },
      rowErrors: {
        title: 'Rows with errors',
      },
      result: {
        codeLabel: 'Generated code',
        rowsProcessedLabel: 'Rows processed',
      },
      cancelButton: 'Cancel',
      submitButton: 'Import',
      closeButton: 'Close',
      importSuccessToast: 'Stock correction imported successfully',
      downloadTemplateError: 'Could not download the template. Please try again.',
    },
    detail: {
      sections: {
        identification: 'Identification',
        items: 'Corrected Items',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        user: 'Responsible',
        product: 'Product',
        warehouse: 'Warehouse',
        lot: 'Lot',
        quantity: 'Corrected Quantity',
        differenceQuantity: 'Difference',
        averageCost: 'Average Cost',
        averageCostValue: 'Value',
      },
      table: {
        product: 'Product',
        warehouse: 'Warehouse',
        lot: 'Lot',
        quantity: 'Corrected Quantity',
        differenceQuantity: 'Difference',
        averageCost: 'Average Cost',
        averageCostValue: 'Value',
      },
      itemsEmpty: {
        title: 'No items found.',
        description: 'This correction has no registered items.',
      },
      notFound: {
        title: 'Correction not found.',
        description: 'There is no stock correction for the informed identifier.',
        back: 'Back to list',
      },
      invalidParamsToast: {
        title: 'Invalid parameters',
        description: 'The correction identifier is invalid to display the detail.',
      },
      noData: 'Not Available',
      backButton: 'Back',
    },
  },
};
