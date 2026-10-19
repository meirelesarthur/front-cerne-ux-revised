// src/constants/languages/languageEnUs/languageFoods.ts
// EN-US translation of the "Formulação" module (Food — Factory/Feed,
// TASK-FOOD-FE-01). `singularLabel`/`pluralLabel` use "Feed Formula" to
// avoid colliding with "Food" already used internally as the EN permission
// slug — the screen label doesn't need to mirror the slug name.

import { ModuleFoods } from '@/@types/language/module-foods';

export const languageFoods: ModuleFoods = {
  food: {
    singularLabel: 'Feed Formula',
    pluralLabel: 'Feed Formulas',
    list: {
      pageTitle: 'Feed Formula',
      pageSubtitle: 'Manage the factory feed formulas.',
      deletedToast: 'Feed formula removed successfully',
      duplicatedToast: 'Feed formula duplicated successfully',
      reportErrorToast: 'Could not generate the feed formula report.',
      columns: {
        code: 'Code',
        product: 'Product',
        date: 'Date',
        quantity: 'Quantity',
        measurement: 'Unit',
        type: 'Type',
        status: 'Status',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        duplicate: 'Duplicate',
        report: 'Report',
      },
      emptyState: {
        titleEmpty: 'No feed formulas registered.',
        descriptionEmpty: 'Start by adding the first feed formula.',
        titleFiltered: 'No feed formulas found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Feed Formula',
      },
    },
    filter: {
      title: 'Filter feed formulas',
      product: 'Product',
      productPlaceholder: 'Search by feed',
      status: 'Status',
      statusAll: 'All',
      statusOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      type: 'Type',
      typeAll: 'All',
    },
    form: {
      title: {
        create: 'New Feed Formula',
        edit: 'Edit Feed Formula',
      },
      fields: {
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        status: 'Active',
        product: 'Product',
        quantity: 'Quantity',
        measurement: 'Unit',
        type: 'Type',
        feedstocks: 'Composition',
        feedstockProduct: 'Feedstock',
        feedstockMeasurement: 'Unit',
        feedstockPercentageP: 'Percentage (%)',
        feedstockPercentageU: 'Quantity',
        total: 'Total',
        addFeedstock: 'Add Feedstock',
        removeFeedstock: 'Remove',
      },
      typeOptions: {
        percentage: 'Percentage',
        unit: 'Unit',
      },
      hints: {
        quantityTooltip:
          'This is the formula standard measure. If the formula was created for 1kg, but you will produce 10kg, the system will automatically multiply the ingredients by 10.',
      },
      validation: {
        productRequired: 'Select the feed.',
        dateRequired: 'Enter the date.',
        quantityMin: 'Enter a quantity greater than zero.',
        measurementRequired: 'Select the unit.',
        typeRequired: 'Select the type.',
        feedstocksMin: 'Add at least one feedstock.',
        feedstockProductRequired: 'Select the feedstock.',
        percentageMin: 'Enter a value greater than or equal to zero.',
        percentageSumMustBe100: 'The sum of percentages must equal 100%.',
      },
    },
  },
};
