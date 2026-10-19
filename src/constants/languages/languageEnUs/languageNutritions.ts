// src/constants/languages/languageEnUs/languageNutritions.ts
// EN-US translation of the "Nutrição" module (Nutrition — Operational / Feed
// consumption launch, TASK-NT-FE-01).

import { ModuleNutritions } from '@/@types/language/module-nutritions';

export const languageNutritions: ModuleNutritions = {
  nutrition: {
    singularLabel: 'Nutrition',
    pluralLabel: 'Nutritions',
    list: {
      columns: {
        code: 'Code',
        date: 'Date',
        employeeOrUser: 'Responsible',
        areasGrazings: 'Areas/Grazings',
        batches: 'Batches',
        products: 'Products',
        quantity: 'Total Quantity',
        timeControl: 'Time Control',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No nutrition entries registered.',
        descriptionEmpty: 'Start by adding the first nutrition entry.',
        titleFiltered: 'No nutrition entries found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Nutrition',
      },
      deletedToast: 'Nutrition entry removed successfully',
    },
    filter: {
      title: 'Filter nutrition entries',
      startDate: 'Start date',
      endDate: 'End date',
      product: 'Product',
      productPlaceholder: 'Search by product',
      batch: 'Batch',
      batchPlaceholder: 'Search by batch',
      employee: 'Employee',
      employeePlaceholder: 'Search by employee',
    },
    detail: {
      back: 'Back',
    },
    form: {
      title: {
        create: 'New Nutrition',
        edit: 'Edit Nutrition',
        view: 'View Nutrition',
      },
      fields: {
        header: {
          code: 'Code',
          date: 'Date',
          user: 'Responsible',
          timeControl: 'Time Control',
        },
        item: {
          sectionTitle: 'Items',
          warehouse: 'Warehouse',
          warehouseDeletedSuffix: '(deleted)',
          product: 'Product',
          dietBeat: 'Automatic Diet',
          um: 'Unit',
          stock: 'Stock',
          quantity: 'Quantity',
          area: 'Area',
          grazing: 'Grazing',
          trough: 'Trough',
          note: 'Note',
          costCenter: 'Cost Center',
          batches: 'Batches',
          batchesSearchPlaceholder: 'Search batch',
          batchesSelectedCountLabel: 'Selected batches',
          addItem: 'Add Item',
          removeItem: 'Remove',
          insufficientStock: 'The quantity cannot exceed the available stock.',
        },
        employee: {
          sectionTitle: 'Time Control',
          funcType: 'Type',
          funcExecutor: 'Executor',
          funcUm: 'Unit',
          funcTotalQuantity: 'Total Quantity',
          addEmployee: 'Add',
          removeEmployee: 'Remove',
        },
      },
      validation: {
        dateRequired: 'Enter the date.',
        numberType: 'Enter a valid number.',
        quantityMin: 'Enter a quantity greater than zero.',
        itemTroughRequired: 'Select the trough.',
        itemQuantityRequired: 'Enter the quantity.',
        itemProductOrDietRequired: 'Select the product or the automatic diet.',
        itemWarehouseRequired: 'Select the warehouse.',
        itemBatchesMin: 'Select at least one batch.',
        itemsMin: 'Add at least one item.',
        employeeFuncTypeRequired: 'Select the type.',
        employeeFuncExecutorRequired: 'Select the executor.',
        employeeFuncUmRequired: 'Select the unit.',
        employeeFuncTotalRequired: 'Enter the total quantity.',
      },
    },
    options: {
      funcType: {
        employee: 'Employee',
        function: 'Function',
        provider: 'Provider',
      },
      timeControl: {
        yes: 'Yes',
        no: 'No',
      },
    },
  },
};
