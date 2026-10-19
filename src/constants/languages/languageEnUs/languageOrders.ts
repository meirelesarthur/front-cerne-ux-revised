// src/constants/languages/languageEnUs/languageOrders.ts
// EN-US translation of the "Orders" module (Order — Operacional / Sales,
// F-051, 97-Esteiras/043, PED-FE-01 — foundation).

import { ModuleOrders } from '@/@types/language/module-orders';

export const languageOrders: ModuleOrders = {
  order: {
    singularLabel: 'Order',
    pluralLabel: 'Orders',
    titleModule: 'Orders',

    list: {
      pageTitle: 'Orders',
      table: {
        columns: {
          status: 'Status',
          code: 'No.',
          date: 'Date',
          client: 'Client',
          user: 'Responsible',
          total: 'Total',
          actions: 'Actions',
        },
        actions: {
          view: 'View',
          edit: 'Edit',
          delete: 'Delete',
          print: 'Print',
          generateSale: 'Generate Sale',
          generateSaleTooltip: 'Available only for open or in-progress orders.',
          editDisabledTooltip: 'Only open or in-progress orders can be edited.',
          deleteDisabledTooltip: 'Only open or in-progress orders can be deleted.',
        },
      },
      emptyState: {
        titleEmpty: 'No orders registered.',
        descriptionEmpty: 'Start by adding your first order.',
        titleFiltered: 'No orders found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Order',
      },
      deletedToast: 'Order successfully removed',
      printErrorToast: 'Unable to generate the order PDF.',
      deleteConfirm: {
        title: 'Are you sure?',
        description: 'This action cannot be undone.',
      },
      error: {
        message: 'Unable to load the orders.',
        retry: 'Try again',
      },
    },

    filter: {
      title: 'Filter orders',
      search: 'No.',
      searchPlaceholder: 'Search by number',
      product: 'Product',
      productPlaceholder: 'Search by product',
      client: 'Client',
      clientPlaceholder: 'Search by client',
      startDate: 'Start date',
      endDate: 'End date',
      paginationQuantity: 'Records per page',
    },

    detail: {
      notFound: {
        title: 'Order not found',
        description: 'The requested order does not exist or has been removed.',
        back: 'Back to list',
      },
      backButton: 'Back',
      editButton: 'Edit',
      printButton: 'Print',
      generateSaleButton: 'Generate Sale',
      sections: {
        header: 'Order Data',
        items: 'Items',
        payment: 'Payment',
        totals: 'Totals',
      },
      emptyItems: 'No items registered.',
      originBudgetLabel: 'Origin: Budget',
      dates: {
        createdAt: 'Created at',
        updatedAt: 'Updated at',
      },
    },

    status: {
      emAberto: 'Open',
      emProcessamento: 'Processing',
      finalizado: 'Finished',
      cancelado: 'Cancelled',
    },

    hasInputOptions: {
      sim: 'Yes',
      nao: 'No',
    },

    fiscalDocumentOptions: {
      sim: 'Yes',
      nao: 'No',
    },

    form: {
      title: {
        create: 'New Order',
        edit: 'Edit Order',
      },
      sections: {
        header: 'Order Data',
        items: 'Order Items',
        payment: 'Payment',
      },
      fields: {
        header: {
          code: 'Number',
          user: 'Responsible',
          date: 'Date',
          client: 'Client',
          note: 'Note',
        },
        footer: {
          subtotal: 'Subtotal',
          freight: 'Freight',
          discount: 'Discount',
          total: 'Total',
        },
        item: {
          sectionTitle: 'Order Items',
          product: 'Product',
          productPlaceholder: 'Search product',
          um: 'Unit',
          quantity: 'Quantity',
          price: 'Price',
          discount: 'Discount',
          discountPercent: 'Discount %',
          total: 'Total',
          addItem: 'Add item',
          removeItem: 'Remove item',
          addIncompleteError: 'Fill in every field of the current item before adding another one.',
          removeLastError: 'You must keep at least one item in the order.',
          removeConfirm: {
            title: 'Remove item?',
            description: 'This item will be removed from the order.',
          },
          productModal: {
            addAria: 'Add new product',
            editAria: 'Edit selected product',
          },
        },
        payment: {
          sectionTitle: 'Payment',
          paymentMethod: 'Payment Method',
          hasInput: 'Has Down Payment?',
          inputDate: 'Down Payment Date',
          inputValue: 'Down Payment Value',
          installments: 'Number of Installments',
          dueDate: 'Due Date (1st Installment)',
          interval: 'Interval Between Installments (days)',
          fiscalDocument: 'Deductible',
          installmentsTable: {
            date: 'Date',
            value: 'Value',
          },
          adjustRefusedToast:
            'Invalid adjustment: the last installment would become zero or negative.',
        },
      },
      placeholders: {
        header: {
          client: 'Select the client',
        },
      },
      clientModal: {
        addAria: 'Add new client',
        editAria: 'Edit selected client',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Leave without saving',
      },
      errors: {
        invalidFields: 'Check the highlighted required fields and try again.',
      },
      noChangesToast: 'Nothing to save — no changes were made.',
      validation: {
        clientRequired: 'Select the client.',
        dateRequired: 'Enter the date.',
        freightMin: 'Enter a freight value greater than or equal to zero.',
        itemsMin: 'Add at least one item.',
        itemProductRequired: 'Select the product.',
        itemQuantityRequired: 'Enter the quantity.',
        itemPriceRequired: 'Enter the price.',
        itemDiscountExceedsTotal: 'The discount amount cannot be greater than the item total!',
        itemDiscountPercentMax: 'The discount percentage cannot be greater than 100!',
        noteMax: 'The note must be at most 200 characters.',
        installmentInputDateRequired: 'Enter the down payment date.',
        installmentInputValueRequired: 'Enter the down payment value.',
        paymentMethodRequired: 'Select the payment method.',
        installmentsRequired: 'Enter the number of installments.',
        dueDateRequired: 'Enter the due date of the 1st installment.',
        installmentDateInvalid: 'Please enter a valid date.',
        numberType: 'Enter a valid number.',
      },
    },

    generateSaleScreen: {
      pageTitle: 'Generate Sale from Order',
      backButton: 'Back',
      saveButton: 'Generate Sale',
      sections: {
        order: 'Source Order',
        items: 'Eligible Items',
      },
      orderFields: {
        code: 'Order No.',
        client: 'Client',
        status: 'Status',
      },
      item: {
        orderedQuantity: 'Ordered Qty.',
        remainingQuantity: 'Available Balance',
        availableStock: 'Available Stock',
        stockLoadError: 'Could not look up stock for this item.',
      },
      emptyEligibleItems: {
        title: 'No item with available balance.',
        description: 'All items of this order have already been fully sold.',
      },
      loadError: {
        message: 'Unable to load the order data to generate the sale.',
        retry: 'Try again',
      },
      successToast: 'Sale generated successfully from the order',
      validation: {
        itemsMin: 'This order has no eligible items to generate a sale.',
        itemQuantityExceedsRemaining: 'The quantity cannot be greater than the available balance.',
      },
    },
  },
};
