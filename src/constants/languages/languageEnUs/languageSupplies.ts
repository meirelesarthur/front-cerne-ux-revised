// src/constants/languages/languageEnUs/languageSupplies.ts
// EN-US translation — Fleet Management module — Fuel Supplies (Supply) —
// own domain, Tasks 40/41 (esteira 009).

import { ModuleSupplies } from '@/@types/language/module-supplies';

export const languageSupplies: ModuleSupplies = {
  supply: {
    singularLabel: 'Fuel Supply',
    pluralLabel: 'Fuel Supplies',
    list: {
      pageTitle: 'Fuel Supplies',
      pageSubtitle: 'Fleet fuel supplies by equipment, consuming stock.',
      deletedToast: 'Fuel supply removed successfully',
      table: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        createdAt: 'Created At',
        actions: 'Actions',
      },
      itemsTable: {
        equipment: 'Equipment',
        warehouse: 'Warehouse',
        product: 'Product',
        measurement: 'Unit',
        hourMeter: 'Hour Meter',
        mileage: 'Mileage',
        quantity: 'Quantity',
        amount: 'Unit Value',
        totalAmount: 'Total Value',
        note: 'Note',
        responsible: 'Responsible',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      filter: {
        title: 'Filter fuel supplies',
        equipment: 'Equipment',
        equipmentPlaceholder: 'Search equipment',
        startDate: 'Start date',
        endDate: 'End date',
      },
      emptyState: {
        title: 'No fuel supplies registered.',
        description: 'Start by adding your first fuel supply.',
        titleFiltered: 'No fuel supplies found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add New',
      },
      errorState: {
        title: 'Could not load fuel supplies.',
        description: 'Check your connection and try again.',
        retry: 'Try again',
      },
    },
    form: {
      title: {
        create: 'New Fuel Supply',
        edit: 'Edit Fuel Supply',
      },
      subtitle: {
        create: 'Register a new fleet fuel supply.',
        edit: 'Update the fuel supply data.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        user: 'User',
      },
      items: {
        title: 'Items',
        addItem: 'Add Item',
        removeItem: 'Remove',
        emptyRow: 'No item added.',
        fields: {
          equipment: 'Equipment',
          hourMeter: 'Hour Meter',
          mileage: 'Mileage',
          warehouse: 'Warehouse',
          product: 'Product',
          measurement: 'Unit',
          quantity: 'Quantity',
          stock: 'Stock',
          responsible: 'Responsible',
          note: 'Note',
        },
        placeholders: {
          equipment: 'Search equipment',
          warehouse: 'Search warehouse',
          product: 'Search product',
          measurement: 'Select unit',
          responsible: 'Search responsible',
        },
      },
      stockExceedsDialog: {
        title: 'Attention',
        intro: 'The informed quantity is greater than the available stock quantity.',
        informedQuantityLabel: 'Informed Quantity',
        stockQuantityLabel: 'Stock Quantity',
        confirm: 'Close',
      },
      errors: {
        invalidFields: 'Review the highlighted fields.',
      },
    },
    detail: {
      title: 'Fuel Supply',
      sections: {
        header: 'Identification',
        items: 'Items',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
      },
      notFound: {
        title: 'Fuel supply not found.',
        description: 'Check if it still exists.',
        back: 'Back to list',
      },
    },
  },
};
