// src/constants/languages/languageEnUs/languageOpeningBalances.ts
// EN-US translation of the OPENING BALANCE module (Base Registrations).
// TASK-FE-1040 (foundation) — label faithful to the legacy
// (`trad.estoque_inicial`, Doc Bruta §13). TASK-FE-1042 (list) adds
// `list`/`filter`.

import { ModuleOpeningBalances } from '@/@types/language/module-opening-balances';

export const languageOpeningBalances: ModuleOpeningBalances = {
  openingBalance: {
    singularLabel: 'Initial Stock',
    pluralLabel: 'Initial Stocks',
    list: {
      pageTitle: 'Initial Stocks',
      pageSubtitle: 'Manage the opening balances entered per product and warehouse.',
      deletedToast: 'Initial Stock removed successfully',
      table: {
        product: 'Product',
        measurement: 'Measure. Unit',
        warehouse: 'Warehouse',
        quantity: 'Quantity',
        movementDate: 'Movement Date',
        providerLot: 'Supplier Lot',
        classification: 'Classification',
        // Legacy literal fallback (`trad.var_nao_possui`).
        noData: 'Not applicable',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No initial stock registered.',
        descriptionEmpty: 'Start by adding the first initial stock.',
        titleFiltered: 'No initial stock found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Initial Stock',
      },
    },
    filter: {
      title: 'Filter initial stocks',
      search: 'Search',
      searchPlaceholder: 'Search by product or lot',
      product: 'Product',
      productPlaceholder: 'All products',
      warehouse: 'Warehouse',
      warehousePlaceholder: 'All warehouses',
    },
    // Create/Edit form, Zones 1-3 — TASK-FE-1043.
    form: {
      title: {
        create: 'New Initial Stock',
        edit: 'Edit Initial Stock',
      },
      subtitle: {
        create: 'Fill in the opening balance details',
        edit: 'Update the opening balance',
      },
      sections: {
        identification: 'Identification',
        quantitiesValues: 'Quantities & Values',
        additionalInfo: 'Additional Information',
        coffeeInfo: 'Coffee Information',
      },
      fields: {
        product: 'Product',
        warehouse: 'Warehouse',
        measurement: 'Unit of Measurement',
        quantity: 'Total Qty.',
        amount: 'Unit Price',
        totalAmount: 'Total Amount',
        averageCost: 'Average Unit Cost',
        providerLot: 'Provider Lot',
        expirationDate: 'Expiration Date',
        classification: 'Classification',
        drink: 'Drink',
      },
      placeholders: {
        product: 'Search product by name or code...',
        warehouse: 'Select the warehouse...',
        providerLot: 'E.g.: LOT-2025-001',
        classification: 'Select the classification...',
      },
      hints: {
        measurementAutoFilled: 'Automatically filled from the selected product',
        totalAmountFormula: '= Qty. × Unit Price',
        averageCostFormula: '= Total Amount ÷ Total Qty.',
      },
      // Coffee drink/cup-quality classification jargon
      // (`agro365/app/ItemInvoice.php::drinks()`) — IDENTICAL text in all 3
      // languages, same spelling as the legacy (technical jargon is not
      // translated).
      drinkOptions: {
        extMole: 'EXT. MOLE',
        mole: 'MOLE',
        duroMais: 'DURO +',
        duro: 'DURO',
        duroVerde: 'DURO/VERDE',
        duroSujo: 'DURO/SUJO',
        duroFrtd: 'DURO/FRTD',
        duro1Riada: 'DURO/1 RIADA',
        duro2Riadas: 'DURO/2 RIADAS',
        duro3Riadas: 'DURO/3 RIADAS',
        duro4Riadas: 'DURO/4 RIADAS',
        duroRiado: 'DURO RIADO',
        riado: 'RIADO',
        d1ri1rio: 'D/1RI/1RIO',
        d1ri2rio: 'D/1RI/2RIO',
        d2ri1rio: 'D/2RI/1RIO',
        dRiRio: 'D/RI/RIO',
        riadoRio: 'RIADO/RIO',
        rio: 'RIO',
        rioZona: 'RIO ZONA',
        rioZonal: 'RIO ZONAL',
      },
      validation: {
        quantityRequired: 'Enter the quantity',
        quantityMin: 'Enter a valid quantity (greater than zero)',
        quantityMax: 'The total quantity exceeds the maximum allowed.',
        amountRequired: 'Enter the unit price',
        amountMin: 'The unit price cannot be negative',
        amountMax: 'The unit price exceeds the maximum allowed.',
        totalMax:
          'The total amount (quantity × unit price) exceeds the maximum allowed (99,999,999.99).',
        providerLotRequired: 'Lot is required for this product',
        providerLotMaxLength: 'Lot must be at most 15 characters',
        expirationDateRequired: 'Expiration date is required for this product',
      },
      duplicateAlert: {
        title: 'An opening balance already exists for this product in this warehouse.',
        dismissAction: 'Got it',
      },
      errors: {
        invalidFields: 'There are required fields missing or invalid.',
      },
    },
    // Detail (view) — TASK-FE-1045.
    detail: {
      pageTitle: 'View Initial Stock',
      notFound: {
        title: 'Initial Stock not found',
        description: 'The requested record does not exist or has been removed.',
        back: 'Back',
      },
      actions: {
        back: 'Back',
        edit: 'Edit',
      },
    },
    // Excel actions (download template/import/export) — TASK-FE-1047.
    excel: {
      downloadTemplate: 'Download template',
      export: 'Export',
      downloadTemplateError: 'Could not download the template. Please try again.',
      exportError: 'Could not export the data. Please try again.',
      import: {
        menuLabel: 'Import',
        title: 'Import Initial Stock',
        subtitle:
          'Download the template, fill it in, and upload the spreadsheet to post opening balances in bulk.',
        instructions:
          'The Product, Warehouse, Total Qty. and Unit Price columns are required in every row. Select the Product and Warehouse from the validated dropdowns (auxiliary sheets of the spreadsheet) — the balance is always imported without a lot.',
        warning: {
          title: 'Existing records are overwritten',
          description:
            'If an opening balance already exists for the same product and warehouse, the quantity and unit price from this spreadsheet REPLACE the current values — the import never adds to quantities already posted.',
        },
        downloadShortcut: 'Download template',
        fileUpload: {
          label: 'Filled spreadsheet',
          hint: 'Upload the .xlsx file filled in from the downloaded template.',
          dropzoneTitle: 'Drag the spreadsheet or click to select',
          dropzoneDraggingTitle: 'Drop the spreadsheet here',
          changeLabel: 'Change file',
          removeLabel: 'Remove file',
          errorTypeMessage: 'Format not accepted. Upload a .xlsx file.',
          errorSizeMessage: 'File exceeds the maximum size of 10MB.',
        },
        cancelButton: 'Cancel',
        submitButton: 'Import',
        importSuccessToast: 'Initial stock import completed successfully.',
        result: {
          imported: 'Imported',
        },
        rowErrors: {
          title: 'Some rows could not be imported — fix them and upload again',
          rowPrefix: 'Row {row}:',
        },
        closeButton: 'Close',
      },
    },
  },
};
