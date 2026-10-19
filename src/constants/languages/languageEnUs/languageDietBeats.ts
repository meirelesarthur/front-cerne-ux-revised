// src/constants/languages/languageEnUs/languageDietBeats.ts
// EN-US translation of the "Batida" module (DietBeat — Operational/
// Livestock, TASK-FE-DIET-04).

import { ModuleDietBeats } from '@/@types/language/module-diet-beats';

export const languageDietBeats: ModuleDietBeats = {
  dietBeat: {
    singularLabel: 'Diet Beat',
    pluralLabel: 'Diet Beats',
    list: {
      pageTitle: 'Diet Beat',
      pageSubtitle: 'Manage the registered diet beats.',
      deletedToast: 'Diet beat removed successfully',
      columns: {
        code: 'Code',
        date: 'Date',
        diet: 'Diet',
        equipment: 'Feed Wagon',
        user: 'Operator',
        total: 'Total',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No diet beats registered.',
        descriptionEmpty: 'Start by adding the first diet beat.',
        titleFiltered: 'No diet beats found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Diet Beat',
      },
    },
    filter: {
      title: 'Filter diet beats',
      equipment: 'Feed Wagon',
      equipmentPlaceholder: 'Search by feed wagon',
      diet: 'Diet',
      dietPlaceholder: 'Search by diet',
      date: 'Date',
    },
    form: {
      title: {
        create: 'New Diet Beat',
        edit: 'Edit Diet Beat',
      },
      fields: {
        header: {
          code: 'Code',
          responsible: 'Operator',
          equipment: 'Feed Wagon',
          diet: 'Diet',
          measurement: 'Unit',
          quantity: 'Produced Quantity',
          date: 'Date',
        },
        item: {
          product: 'Ingredient',
          measurement: 'Unit',
          stock: 'Warehouse',
          stockAvailable: 'Available Balance',
          dryMatter: 'Dry Matter (%)',
          costValue: 'Unit Cost',
          quantityPlanned: 'Planned Quantity',
          quantityRealized: 'Realized Quantity',
          percentage: 'Percentage (%)',
          difference: 'Difference',
          total: 'Total',
          sectionTitle: 'Diet Beat Items',
          insufficientStock: 'The realized quantity cannot exceed the available balance.',
          emptyUntilDiet: 'Select a diet to generate the items.',
        },
      },
      hints: {
        quantityTooltip: 'Enter the total quantity produced in this diet beat.',
      },
      validation: {
        equipmentRequired: 'Select the feed wagon.',
        dietRequired: 'Select the diet.',
        measurementRequired: 'Select the unit.',
        dateRequired: 'Enter the date.',
        quantityRequired: 'Enter the quantity.',
        quantityMin: 'Enter a quantity greater than zero.',
        itemStockRequired: 'Select the source warehouse.',
        itemQuantityRealizedRequired: 'Enter the realized quantity.',
        itemQuantityRealizedMin: 'Enter a quantity greater than zero.',
        itemsMin: 'Select a diet with at least one ingredient.',
        numberType: 'Enter a valid number.',
      },
    },
  },
};
