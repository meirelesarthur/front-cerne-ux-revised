// src/constants/languages/languageEnUs/languageMaintenances.ts
// EN-US translation of the Fleet Management — Maintenances module (F-103) —
// Tasks 43/44/45 (esteira 010).

import { ModuleMaintenances } from '@/@types/language/module-maintenances';

export const languageMaintenances: ModuleMaintenances = {
  maintenance: {
    singularLabel: 'Maintenance',
    pluralLabel: 'Maintenances',
    list: {
      pageTitle: 'Maintenances',
      pageSubtitle: 'Fleet maintenances by equipment, with stock and labor consumption.',
      deletedToast: 'Maintenance removed successfully',
      table: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
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
        executor: 'Executor',
        laborCost: 'Labor Cost',
        note: 'Note',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      filter: {
        title: 'Filter maintenances',
        equipment: 'Equipment',
        equipmentPlaceholder: 'Search equipment',
        startDate: 'Start date',
        endDate: 'End date',
      },
      emptyState: {
        title: 'No maintenance registered.',
        description: 'Start by adding your first maintenance.',
        titleFiltered: 'No maintenance found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add New',
      },
      errorState: {
        title: 'Could not load the maintenances.',
        description: 'Check your connection and try again.',
        retry: 'Try again',
      },
    },
    form: {
      title: {
        create: 'New Maintenance',
        edit: 'Edit Maintenance',
      },
      subtitle: {
        create: 'Register a new fleet maintenance.',
        edit: 'Update the maintenance data.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
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
          note: 'Note',
          executorType: 'Executor Type',
          employee: 'Employee',
          employeeHours: 'Hours',
          provider: 'Provider',
          providerTotal: 'Total Cost',
        },
        placeholders: {
          equipment: 'Search equipment',
          warehouse: 'Search warehouse',
          product: 'Search product',
          measurement: 'Select the unit',
          employee: 'Search employee',
          provider: 'Search provider',
          requester: 'Search user',
        },
        executorTypeOptions: {
          employee: 'Employee',
          provider: 'Provider',
        },
      },
      stockExceedsDialog: {
        title: 'Warning',
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
      title: 'Maintenance',
      sections: {
        header: 'Identification',
        items: 'Items',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        generateFinancial: 'Generate Financial',
      },
      notFound: {
        title: 'Maintenance not found.',
        description: 'Check whether it still exists.',
        back: 'Back to list',
      },
    },
    generateFinancial: {
      pageTitlePrefix: 'Generate Financial — Maintenance',
      backToDetail: 'Back to Maintenance',
      providerBlock: {
        fields: {
          provider: 'Provider',
          number: 'Title Number',
          typeTitle: 'Title Type',
          proprietary: 'Proprietary',
          note: 'Note',
          fiscalDocument: 'Fiscal Document',
          total: 'Total Value',
        },
        placeholders: {
          number: 'Title number',
          typeTitle: 'Search title type',
          proprietary: 'Search proprietary',
        },
      },
      apportionment: {
        title: 'Apportionment',
        addButton: 'Add Category',
        removeButton: 'Remove',
        emptyLabel: 'No category added.',
        sumBadgeLabel: 'Apportionment sum',
        sumNotClosed: 'The apportionment sum must exactly match the Total Value.',
        fields: {
          category: 'Financial Category',
          center: 'Cost Center',
          value: 'Value',
        },
        placeholders: {
          category: 'Search category',
          center: 'Search cost center',
        },
      },
      installments: {
        title: 'Installments',
        generateButton: 'Generate Installments',
        addButton: 'Add Installment',
        removeButton: 'Remove',
        emptyLabel: 'No installment added.',
        sumBadgeLabel: 'Installments sum',
        overwriteConfirm: 'Installments already generated. Do you want to replace them?',
        fields: {
          installmentCount: 'Nº Installments',
          firstDueDate: '1st Due Date',
          intervalDays: 'Interval (days)',
          dueDate: 'Due Date',
          value: 'Value',
        },
      },
      errors: {
        alreadyGenerated: 'The financial entries for this Maintenance were already generated.',
        noProviderItems: 'This Maintenance has no items with a provider.',
        apportionmentNotClosed:
          'The apportionment of one or more providers does not match the Total Value.',
        installmentsRequired: 'Generate or add at least one installment for provider {provider}.',
        installmentsInvalid:
          'Enter a due date and a value greater than zero for every installment of provider {provider}.',
      },
      actions: {
        generate: 'Generate',
        cancel: 'Cancel',
      },
      notFound: {
        title: 'Maintenance not found.',
        description: 'Check whether it still exists.',
        back: 'Back to list',
      },
    },
  },
};
