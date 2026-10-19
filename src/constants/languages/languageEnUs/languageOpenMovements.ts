// src/constants/languages/languageEnUs/languageOpenMovements.ts
// EN-US translation of the "Opening Balance" module (OpenMovement — Base
// Registrations / Financial), execution 031. Mirror of
// languagePtBr/languageOpenMovements.ts.

import { ModuleOpenMovements } from '@/@types/language/module-open-movements';

export const languageOpenMovements: ModuleOpenMovements = {
  openMovement: {
    singularLabel: 'Opening Balance',
    pluralLabel: 'Opening Balances',
    list: {
      pageTitle: 'Opening Balance',
      pageSubtitle: 'Manage the opening balances of bank accounts.',
      deletedToast: 'Opening balance removed successfully',
      table: {
        code: 'Code',
        account: 'Bank Account',
        date: 'Date',
        value: 'Amount',
        proprietary: 'Owner',
      },
      actions: {
        view: 'View',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No opening balance registered.',
        descriptionEmpty: 'Start by adding the first opening balance.',
        titleFiltered: 'No opening balance found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Opening Balance',
      },
      deleteConfirm: {
        title: 'Delete opening balance',
        description: 'Are you sure you want to delete this opening balance',
      },
    },
    filter: {
      title: 'Filter Opening Balances',
      startDate: 'Start Date',
      endDate: 'End Date',
      account: 'Bank Account',
      accountPlaceholder: 'Search bank account',
      proprietary: 'Owner',
      proprietaryPlaceholder: 'Search owner',
    },
    form: {
      title: { create: 'New Opening Balance' },
      subtitle: { create: 'Register a new bank account opening balance.' },
      fields: {
        account: 'Bank Account',
        type: 'Type',
        typeCategory: 'Category Type',
        proprietary: 'Managing Owner',
        date: 'Movement Date',
        value: 'Amount',
        interest: 'Interest',
        document: 'Document',
        note: 'History',
      },
      placeholders: {
        account: 'Search bank account',
        proprietary: 'Search owner',
        document: 'Document number',
        note: 'Note about the movement',
      },
      fixedValues: {
        type: 'Income',
        typeCategory: 'Opening Balance',
      },
      apportionments: {
        sectionTitle: 'Apportionment',
        sectionHint: 'Split the opening balance amount between category and cost center.',
        sumLabel: 'Total apportioned',
        sumHint: 'the sum differs from the informed amount',
        emptyTitle: 'No apportionment item added. Add at least one item.',
        addRowLabel: 'Add Item',
        removeRowLabel: 'Remove item',
        fields: {
          category: 'Category',
          costCenter: 'Cost Center',
          value: 'Amount',
        },
        placeholders: {
          category: 'Search category',
          costCenter: 'Search cost center',
        },
        categoryLockedHelper: 'Only applicable category — selected automatically.',
      },
      validation: {
        accountRequired: 'Select the bank account.',
        dateRequired: 'Enter the movement date.',
        valueRequired: 'Enter the amount.',
        valueNotZero: 'The balance amount cannot be 0.',
        documentMaxLength: 'Maximum 100 characters.',
        noteMaxLength: 'Maximum 40 characters.',
        proprietaryRequired: 'Select the managing owner.',
        itemsMinLength: 'Add at least one apportionment item.',
        itemCategoryRequired: 'Select the category.',
        itemCostCenterRequired: 'Select the cost center.',
        itemValueRequired: 'Enter the item amount.',
        itemValueMin: 'The item amount must be greater than zero.',
      },
    },
    detail: {
      sections: {
        identification: 'Identification',
        apportionments: 'Apportionment',
      },
      fields: {
        account: 'Bank Account',
        type: 'Movement Type',
        typeCategory: 'Category Type',
        date: 'Movement Date',
        document: 'Document',
        value: 'Amount',
        interest: 'Interest',
        note: 'History',
        proprietary: 'Managing Owner',
      },
      table: {
        category: 'Category',
        costCenter: 'Cost Center',
        value: 'Amount',
      },
      notFound: {
        title: 'Opening balance not found',
        description: 'The record may have been deleted. Go back to the list and try again.',
        back: 'Back',
      },
      noData: 'Not Available',
    },
  },
};
