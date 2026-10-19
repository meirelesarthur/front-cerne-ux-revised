// src/constants/languages/languageEnUs/languageWarehouseTransfers.ts
// EN-US translation of the "Trans. Armazém" module (WarehouseTransfer —
// Inventory, write, TASK-WT-FE-01).

import { ModuleWarehouseTransfers } from '@/@types/language/module-warehouse-transfers';

export const languageWarehouseTransfers: ModuleWarehouseTransfers = {
  warehouseTransfer: {
    singularLabel: 'Warehouse Transfer',
    pluralLabel: 'Warehouse Transfers',
    list: {
      columns: {
        code: 'Code',
        date: 'Date',
        product: 'Product',
        originWarehouse: 'Origin Warehouse',
        destinationWarehouse: 'Destination Warehouse',
        quantity: 'Quantity',
        user: 'Responsible',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No warehouse transfers registered.',
        descriptionEmpty: 'Start by adding the first warehouse transfer.',
        titleFiltered: 'No warehouse transfers found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Transfer',
      },
      deletedToast: 'Warehouse transfer removed successfully',
    },
    filter: {
      title: 'Filter warehouse transfers',
      product: 'Product',
      productPlaceholder: 'Search by product',
      destinationWarehouse: 'Destination Warehouse',
      destinationWarehousePlaceholder: 'Search by destination warehouse',
      dateFrom: 'Start date',
      dateTo: 'End date',
    },
    form: {
      title: {
        create: 'New Warehouse Transfer',
        edit: 'Edit Warehouse Transfer',
      },
      fields: {
        header: {
          code: 'Code',
          user: 'Responsible',
          date: 'Date',
          type: 'Type',
          typeValue: 'Transfer',
          originWarehouse: 'Warehouse (origin)',
          destinationWarehouse: 'Destination Warehouse',
        },
        item: {
          product: 'Product',
          measurement: 'Unit',
          stockAvailable: 'Stock',
          quantity: 'Quantity',
          unitValue: 'Unit Value',
          totalValue: 'Total Value',
          costCenter: 'Cost Center',
          addItem: 'Add Item',
          removeItem: 'Remove',
          sectionTitle: 'Transfer Items',
          insufficientStock: 'The quantity cannot exceed the available balance.',
          duplicateStock: 'This stock has already been selected in another line.',
          footerTotalLabel: 'Grand Total',
        },
      },
      hints: {
        originWarehouseHelp:
          'The origin warehouse filters the available products and is not sent with the transfer.',
      },
      validation: {
        dateRequired: 'Enter the date.',
        destinationWarehouseRequired: 'Select the destination warehouse.',
        originWarehouseRequired: 'Select the origin warehouse.',
        itemsMin: 'Add at least one item.',
        itemStockRequired: 'Select the product/source stock.',
        itemQuantityRequired: 'Enter the quantity.',
        quantityMin: 'Enter a quantity greater than zero.',
        itemCostCenterRequired: 'Select the cost center.',
        numberType: 'Enter a valid number.',
      },
    },
  },
};
