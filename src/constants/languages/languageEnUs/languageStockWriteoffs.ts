// src/constants/languages/languageEnUs/languageStockWriteoffs.ts
// EN-US translation of the STOCK WRITEOFF module (Administrative). Esteira
// 038, READ slice (TASK-FE-3001/3002/3003) + WRITE slice (TASK-FE-3004/3005/3006).

import { ModuleStockWriteoffs } from '@/@types/language/module-stock-writeoffs';

export const languageStockWriteoffs: ModuleStockWriteoffs = {
  stockWriteoff: {
    singularLabel: 'Stock Writeoff',
    pluralLabel: 'Stock Writeoffs',
    list: {
      pageTitle: 'Stock Writeoff',
      pageSubtitle: 'View and delete stock writeoffs recorded for the active farm.',
      reportButton: 'Report',
      table: {
        code: 'Code',
        user: 'Responsible',
        warehouse: 'Warehouse',
        createdAt: 'Registered at',
        type: 'Type',
        actions: {
          viewDetail: 'View Detail',
          delete: 'Delete',
          emitNfe: 'Issue NFe',
        },
      },
      emptyState: {
        title: 'No stock writeoffs found.',
        description: 'No stock writeoffs have been recorded for the active farm yet.',
        titleFiltered: 'No stock writeoffs found.',
        descriptionFiltered: 'Try adjusting the period or clearing the filter.',
        cta: 'New writeoff',
      },
      deletedToast: 'Stock writeoff deleted successfully',
      deleteDialog: {
        description: 'Are you sure you want to delete the stock writeoff',
        warning:
          'Deleting this writeoff restores the stock debited by it. This action cannot be undone and may impact reports already issued.',
      },
    },
    filter: {
      title: 'Filter stock writeoffs',
      startDate: 'Registration date (from)',
      endDate: 'Registration date (to)',
      dateRangeInvalid: 'The end date cannot be earlier than the start date.',
    },
    detail: {
      sections: {
        identification: 'Identification',
        items: 'Writeoff Items',
      },
      fields: {
        code: 'Code',
        type: 'Type',
        typeNote: 'Type note',
        createdAt: 'Registered at',
        user: 'Responsible',
        warehouse: 'Warehouse',
        justification: 'Justification',
      },
      table: {
        product: 'Product',
        quantity: 'Quantity',
        value: 'Unit Value',
        amount: 'Total Value',
        lot: 'Lot',
      },
      totals: {
        quantity: 'Total Quantity',
        amount: 'Grand Total',
      },
      itemsEmpty: {
        title: 'No items found.',
        description: 'This writeoff has no registered items.',
      },
      notFound: {
        title: 'Stock writeoff not found.',
        description: 'There is no stock writeoff for the given identifier.',
        back: 'Back to list',
      },
      invalidParamsToast: {
        title: 'Invalid parameters',
        description: 'The writeoff identifier is invalid to display the detail.',
      },
      noData: 'Not Available',
      backButton: 'Back',
      actions: {
        emitNfe: 'Issue NFe',
      },
    },
    typeOptions: {
      loss: 'Loss',
      deterioration: 'Deterioration',
      theft: 'Theft',
      damage: 'Damage',
      inventory: 'Inventory',
      accounting: 'Accounting',
      pettyTheft: 'Petty Theft',
      expirationDate: 'Expiration Date',
      freeGift: 'Free Gift',
      donation: 'Donation',
      others: 'Others',
      consumption: 'Consumption',
      paymentInProduct: 'Payment in Product',
    },
    form: {
      title: 'New Stock Writeoff',
      subtitle: 'Record a stock writeoff for the active farm.',
      header: {
        sectionTitle: 'Identification',
        code: 'Code',
        user: 'User',
        date: 'Date',
        type: 'Writeoff Reason',
        typePlaceholder: 'Select the writeoff reason',
        typeNote: 'Note',
        typeNotePlaceholder: 'Additional note about the selected reason (optional)',
        warehouse: 'Warehouse',
        warehousePlaceholder: 'Select the warehouse',
        justification: 'Justification',
        justificationPlaceholder: 'Describe the reason for this stock writeoff',
        costCenter: 'Cost Center',
        costCenterPlaceholder: 'Select the cost center (optional)',
        costCenterHint: 'Informational field only — not persisted by the system.',
      },
      items: {
        sectionTitle: 'Writeoff Items',
        addItem: 'Add Item',
        removeItem: 'Remove item',
        emptyRow: 'No item added.',
        stock: 'Product / Lot',
        stockPlaceholder: 'Select the warehouse to list the stocks',
        saldo: 'Balance',
        unit: 'Unit',
        lot: 'Lot',
        quantity: 'Quantity',
        value: 'Unit Value',
        amount: 'Total Value',
      },
      attachments: {
        sectionTitle: 'Attachments',
        addButton: 'Add Attachment',
        removeButton: 'Remove attachment',
        emptyLabel: 'No attachment added.',
        fields: {
          name: 'Name',
          namePlaceholder: 'Attachment name',
          file: 'File',
        },
        fillBeforeAddError: 'Fill in the current attachment before adding a new one.',
        defaultName: 'Not Informed',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'File type not accepted.',
        errorSizeMessage: 'The file exceeds the maximum allowed size (10MB).',
      },
      footer: {
        cancel: 'Cancel',
        save: 'Save',
      },
      errors: {
        invalidFields: 'Check the highlighted fields and try again.',
      },
      createdToast: 'Stock writeoff created successfully',
    },
    report: {
      title: 'Stock Writeoffs Report',
      subtitle: 'Generate the PDF report of stock writeoffs for the active farm.',
      filters: {
        warehouse: 'Warehouse',
        warehousePlaceholder: 'Select the warehouse',
        product: 'Product',
        productPlaceholder: 'Select the product (optional)',
        startDate: 'Start date',
        endDate: 'End date',
      },
      submit: 'Generate Report',
      openError: 'Could not generate the report. Please try again.',
    },
    nfeHandoff: {
      button: 'Issue NFe',
      alreadyEmittedWarning: {
        title: 'NFe already issued',
        description: 'This stock writeoff already has an NFe linked to it.',
      },
      draftErrorToast: {
        title: 'Could not prepare the NFe',
        description:
          'Could not load the writeoff data to pre-fill the NFe. You can still create the NFe manually.',
      },
      linkedToast: 'NFe linked successfully',
      autoLinkErrorToast: {
        title: 'Could not link the NFe to the writeoff',
        description:
          'The NFe was saved successfully, but it could not be linked to the source stock writeoff. The "Issue NFe" action may still appear on this writeoff.',
      },
    },
  },
};
