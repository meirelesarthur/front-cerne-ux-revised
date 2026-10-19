// src/constants/languages/languageEnUs/languageFoodBeats.ts
// EN-US translation of the "Batida" module (FoodBeat — Factory / feed batch
// production or stock withdrawal appointment, TASK-FB-FE-01).

import { ModuleFoodBeats } from '@/@types/language/module-food-beats';

export const languageFoodBeats: ModuleFoodBeats = {
  foodBeat: {
    singularLabel: 'Feed Batch',
    pluralLabel: 'Feed Batches',
    list: {
      columns: {
        code: 'Code',
        date: 'Date',
        type: 'Type',
        warehouse: 'Warehouse',
        productOrFood: 'Feed/Product',
        quantity: 'Quantity',
        user: 'Responsible',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
        report: 'Report',
      },
      emptyState: {
        titleEmpty: 'No feed batches registered.',
        descriptionEmpty: 'Start by adding the first feed batch.',
        titleFiltered: 'No feed batches found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Feed Batch',
      },
      deletedToast: 'Feed batch removed successfully',
      reportErrorToast: 'Could not generate the feed batch report.',
    },
    filter: {
      title: 'Filter feed batches',
      product: 'Feed/Product',
      user: 'Responsible',
      startDate: 'Start date',
      endDate: 'End date',
      productPlaceholder: 'Search by feed or product',
      userPlaceholder: 'Search by responsible',
    },
    form: {
      title: {
        create: 'New Feed Batch',
        edit: 'Edit Feed Batch',
      },
      typeOptions: {
        formulation: 'Formula',
        stock: 'Stock',
      },
      fields: {
        header: {
          code: 'Code',
          responsible: 'Responsible',
          date: 'Date',
          type: 'Type',
          warehouse: 'Destination Warehouse',
          food: 'Feed',
          product: 'Product',
          productQuantity: 'Produced Quantity',
          measurement: 'Unit',
          quantity: 'Quantity',
          providerLot: 'Lot',
          shelfLife: 'Expiration',
          total: 'Total',
        },
        formulationItem: {
          stock: 'Warehouse',
          feedstock: 'Feedstock',
          measurement: 'Unit',
          stockAvailable: 'Available Balance',
          percentage: 'Percentage (%)',
          quantityPredicted: 'Predicted Quantity',
          quantityRealized: 'Realized Quantity',
          difference: 'Difference',
          amount: 'Unit Cost',
          total: 'Total',
          addItem: 'Add Feedstock',
          removeItem: 'Remove',
          sectionTitle: 'Composition (Feedstocks)',
          insufficientStock: 'The realized quantity cannot exceed the available balance.',
        },
        stockItem: {
          warehouse: 'Warehouse',
          stock: 'Feedstock',
          measurement: 'Unit',
          stockAvailable: 'Stock',
          quantity: 'Quantity',
          amount: 'Unit Cost',
          total: 'Total',
          addItem: 'Add Item',
          removeItem: 'Remove',
          sectionTitle: 'Stock Items',
          insufficientStock: 'The quantity cannot exceed the available balance.',
          duplicateStock: 'This stock has already been selected in another line.',
          footerTotalLabel: 'Grand Total',
        },
      },
      hints: {
        editReadonlyNotice:
          'When editing, only the date can be changed. The remaining fields are shown for reference only.',
        quantityHelp: 'Enter the quantity produced or withdrawn in this feed batch.',
      },
      validation: {
        warehouseRequired: 'Select the warehouse.',
        dateRequired: 'Enter the date.',
        typeRequired: 'Select the type.',
        foodRequired: 'Select the feed.',
        productRequired: 'Select the product.',
        quantityRequired: 'Enter the quantity.',
        quantityMin: 'Enter a quantity greater than zero.',
        providerLotMax: 'The lot must have at most 15 characters.',
        providerLotRequiredWhenHasLot: 'Enter the lot — the selected product requires lot control.',
        shelfLifeRequiredWhenHasLot:
          'Enter the expiration date — the selected product requires lot control.',
        itemStockRequired: 'Select the source stock.',
        itemWarehouseRequired: 'Select the warehouse.',
        itemQuantityRequired: 'Enter the quantity.',
        itemAmountRequired: 'Enter the unit cost.',
        itemTotalRequired: 'Enter the total.',
        itemsMin: 'Add at least one item.',
        numberType: 'Enter a valid number.',
      },
    },
    report: {
      aggregated: {
        title: 'Feed Batches Report',
        food: 'Feed',
        startDate: 'Start date',
        endDate: 'End date',
        generate: 'Generate Report',
      },
    },
  },
};
