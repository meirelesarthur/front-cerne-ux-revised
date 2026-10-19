// src/constants/languages/languageEnUs/languageStocks.ts
// EN-US translation of the STOCK BALANCE module (Administrative — Stock).

import { ModuleStocks } from '@/@types/language/module-stocks';

export const languageStocks: ModuleStocks = {
  stock: {
    singularLabel: 'Stock Balance',
    pluralLabel: 'Stock Balances',
    list: {
      pageTitle: 'Stock Balance',
      pageSubtitle: 'View the current stock balance by product and warehouse.',
      report: 'Report',
      table: {
        product: 'Product',
        warehouse: 'Warehouse',
        quantity: 'Quantity',
        lot: 'Lot',
        expirationDate: 'Expiration',
        averageCost: 'Average Cost',
        total: 'Total',
        info: 'Info',
        actions: {
          viewDetail: 'View Detail',
        },
      },
      emptyState: {
        titleEmpty: 'No stock balance found.',
        descriptionEmpty: 'There is no stock recorded for the active farm yet.',
        titleFiltered: 'No stock balance found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
      },
    },
    filter: {
      title: 'Filter stock balance',
      search: 'Search',
      searchPlaceholder: 'Search by product or lot',
      product: 'Product',
      productPlaceholder: 'Select a product',
      warehouse: 'Warehouse',
      warehousePlaceholder: 'Select a warehouse',
    },
    detail: {
      sections: {
        identification: 'Identification',
        balance: 'Consolidated Balance',
        lots: 'Lots',
        addressing: 'Addressing',
      },
      fields: {
        product: 'Product',
        warehouse: 'Warehouse',
        quantity: 'Quantity',
        total: 'Total',
        addressingType: 'Type',
      },
      table: {
        lot: 'Lot',
        providerLot: 'Provider Lot',
        expirationDate: 'Expiration',
        quantity: 'Quantity',
        averageCost: 'Average Cost',
        total: 'Total',
      },
      lotsEmpty: {
        title: 'No lots found.',
        description: 'This balance has no individual lots recorded.',
      },
      notFound: {
        title: 'Stock balance not found.',
        description: 'There is no stock balance for the given product and warehouse.',
        back: 'Back to list',
      },
      invalidParamsToast: {
        title: 'Invalid parameters',
        description: 'Product and warehouse are required to display the balance detail.',
      },
      noData: 'Not available',
    },
    report: {
      title: 'Stock Balance Report',
      subtitle:
        'Generate a PDF or export an XLSX using the current filters — with no filter, it exports every stock balance in the farm.',
      exportPdf: 'Generate PDF',
      exportXlsx: 'Export XLSX',
      exportPdfError: {
        title: 'Error generating PDF',
        description: 'Could not generate the PDF report. Try again.',
      },
      exportXlsxError: {
        title: 'Error exporting XLSX',
        description: 'Could not export the spreadsheet. Try again.',
      },
    },
    consolidation: {
      groupButton: 'Group',
      alertTitle: 'Group Stock',
      selectAtLeastTwoAlert: 'Select at least two items.',
      differentUnitAlert: 'The items must have the same unit of measure.',
      modalTitle: 'Group Stock',
      modalPrimaryLabel: 'Select the product that will be the main one.',
      confirmButton: 'Group',
      cancelButton: 'Cancel',
      successToast: 'Stocks grouped successfully.',
      previewErrorTitle: 'Unable to group',
      previewErrorToast: 'Could not load the grouping preview. Try again.',
      columns: {
        product: 'Product',
        warehouse: 'Warehouse',
        quantity: 'Quantity',
        lot: 'Lot',
        expirationDate: 'Expiration',
      },
    },
  },
};
