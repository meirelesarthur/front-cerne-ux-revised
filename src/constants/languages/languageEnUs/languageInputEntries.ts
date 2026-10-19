// src/constants/languages/languageEnUs/languageInputEntries.ts
// English (US) translation of the "Input Entry" module (InputEntry) — own
// domain, esteira 037 (TASK-IE-FE-03).

import { ModuleInputEntries } from '@/@types/language/module-input-entries';

export const languageInputEntries: ModuleInputEntries = {
  inputEntry: {
    singularLabel: 'Input Entry',
    pluralLabel: 'Input Entries',

    list: {
      pageTitle: 'Input Entries',
      pageSubtitle: 'Manage input entries and stock generation.',
      deletedToast: 'Input entry removed successfully',
      table: {
        code: 'Code',
        date: 'Date',
        farm: 'Farm',
        proprietary: 'Proprietary',
        user: 'Responsible',
        totalAmount: 'Total Amount',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No input entry registered.',
        descriptionEmpty: 'Start by adding your first input entry.',
        titleFiltered: 'No input entry found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Input Entry',
      },
    },

    filter: {
      title: 'Filter input entries',
      proprietary: 'Proprietary',
      startDate: 'From',
      endDate: 'To',
    },

    form: {
      title: {
        create: 'New Input Entry',
        edit: 'Edit Input Entry',
      },
      subtitle: {
        create: 'Register a new input entry.',
        edit: 'Update the input entry data.',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        responsible: 'Responsible',
        farm: 'Farm',
        harvest: 'Harvest',
        proprietary: 'Proprietary',
        note: 'Notes',

        product: 'Product',
        measurement: 'Measurement',
        quantity: 'Qty',
        unitValue: 'Unit Value',
        totalValue: 'Total Value',
        generateStock: 'Generate stock?',
        warehouse: 'Warehouse',
        appropriationType: 'Appropriation Type',
        providerLot: 'Provider Lot',
        shelfLife: 'Shelf Life',
        // F-084 item 3 — the legacy label is actually "Classification"
        // (internal `cultivation` field kept, mirror `Cultivation-contrato.md`).
        cultivation: 'Classification',
        category: 'Financial Category',
        center: 'Cost Center',
        area: 'Area',
        batch: 'Batch',

        automaticWriteoff: 'Automatic write-off',
        account: 'Bank Account',
        movementDate: 'Movement Date',
        accountBalancePreview: 'Balance on date',
      },
      placeholders: {
        harvest: 'Search a harvest',
        proprietary: 'Search a proprietary',
        product: 'Search a product',
        measurement: 'Search a measurement',
        warehouse: 'Search a warehouse',
        appropriationType: 'Select the appropriation type',
        cultivation: 'Search a cultivation',
        category: 'Search a financial category',
        center: 'Search a cost center',
        area: 'Search an area',
        batch: 'Search a batch',
        account: 'Search a bank account',
      },
      appropriationTypeOptions: {
        agriculture: 'Agriculture',
        livestock: 'Livestock',
      },
      sections: {
        items: 'Items',
        automaticWriteoff: 'Automatic Write-off',
      },
      itemRow: {
        addButton: 'Add Item',
        removeButton: 'Remove item',
        emptyLabel: 'No item added yet.',
      },
      hints: {
        insufficientBalanceWarning: 'The bank account does not have sufficient balance.',
        productLockedWhenSaved: 'To change the product, remove the item and add another',
      },
      validation: {
        dateRequired: 'Date is required',
        dateFuture: 'Date cannot be in the future',
        itemsRequired: 'Add at least one item',
        productRequired: 'Product is required',
        measurementRequired: 'Measurement is required',
        quantityRequired: 'Quantity is required',
        quantityMin: 'Quantity must be greater than 0',
        unitValueRequired: 'Unit value is required',
        warehouseRequiredWhenGenerateStock: 'Warehouse is required when "Generate stock?" is Yes',
        appropriationTypeMaxLength: 'Appropriation type must be at most 10 characters',
        providerLotMaxLength: 'Provider lot must be at most 15 characters',
        providerLotRequiredWhenHasLot: 'Provider lot is required for lot-tracked products',
        shelfLifeRequiredWhenHasLot: 'Shelf life is required for lot-tracked products',
        categoryRequired: 'Financial category is required',
        centerRequired: 'Cost center is required',
        accountRequiredWhenAutomaticWriteoff:
          'Bank account is required when automatic write-off is enabled',
        movementDateRequiredWhenAutomaticWriteoff:
          'Movement date is required when automatic write-off is enabled',
      },
      errors: {
        invalidFields: 'Check the highlighted fields before saving.',
      },
    },

    detail: {
      invalidParamsToast: {
        title: 'Invalid input entry',
        description: 'The provided identifier is not valid.',
      },
      deleteButton: 'Delete',
      notInformed: 'Not informed',
      notFound: {
        title: 'Input entry not found',
        description: 'The requested input entry does not exist or was removed.',
        back: 'Back to list',
      },
      sections: {
        generalData: 'General Data',
      },
      movement: {
        code: 'Movement Code',
        value: 'Movement Value',
        date: 'Movement Date',
        account: 'Bank Account',
        empty: 'No automatic write-off registered for this entry.',
      },
    },
  },
};
