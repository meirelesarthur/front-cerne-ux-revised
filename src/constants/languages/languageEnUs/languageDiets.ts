// src/constants/languages/languageEnUs/languageDiets.ts
// EN-US translation of the "Dieta" module (Diet — Operational/Livestock,
// TASK-FE-DIET-01).

import { ModuleDiets } from '@/@types/language/module-diets';

export const languageDiets: ModuleDiets = {
  diet: {
    singularLabel: 'Diet',
    pluralLabel: 'Diets',
    list: {
      pageTitle: 'Diet',
      pageSubtitle: 'Manage the registered diets.',
      deletedToast: 'Diet removed successfully',
      columns: {
        code: 'Code',
        date: 'Date',
        product: 'Product',
        objective: 'Objective',
        estimatedCost: 'Estimated Cost',
        costPerKg: 'Cost per Kg',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No diets registered.',
        descriptionEmpty: 'Start by adding the first diet.',
        titleFiltered: 'No diets found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Diet',
      },
    },
    filter: {
      title: 'Filter diets',
      search: 'Product',
      searchPlaceholder: 'Search by product',
      objective: 'Objective',
      objectiveAll: 'All',
      date: 'Date',
    },
    form: {
      title: {
        create: 'New Diet',
        edit: 'Edit Diet',
      },
      fields: {
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        product: 'Product',
        quantity: 'Reference Quantity',
        measurement: 'Unit',
        objective: 'Objective',
        type: 'Type',
        observation: 'Notes',
        ingredients: 'Composition',
        ingredientProduct: 'Ingredient',
        ingredientMeasurement: 'Unit',
        ingredientDryMatter: 'Dry Matter (%)',
        ingredientCostValue: 'Unit Cost',
        ingredientQuantityP: 'Percentage (%)',
        ingredientQuantityU: 'Quantity',
        ingredientTotal: 'Total',
        addIngredient: 'Add Ingredient',
        removeIngredient: 'Remove',
      },
      objectiveOptions: {
        adaptation: 'Adaptation',
        growth: 'Growth',
        termination: 'Termination',
      },
      typeOptions: {
        percentage: 'Percentage',
        unit: 'Unit',
      },
      hints: {
        quantityTooltip:
          'This is the diet standard measure. If the diet was created for 1kg but you will produce 10kg, the system automatically multiplies the ingredients by 10.',
      },
      validation: {
        productRequired: 'Select the product.',
        measurementRequired: 'Select the unit.',
        dateRequired: 'Enter the date.',
        objectiveRequired: 'Select the objective.',
        typeRequired: 'Select the type.',
        quantityMin: 'Enter a quantity greater than zero.',
        observationMax: 'Notes must have at most 1500 characters.',
        ingredientsMin: 'Add at least one ingredient.',
        ingredientProductRequired: 'Select the ingredient.',
        ingredientMeasurementRequired: 'Select the unit.',
        dryMatterMin: 'Enter a value greater than or equal to zero.',
        costValueMin: 'Enter a value greater than or equal to zero.',
        ingredientQuantityMin: 'Enter a value greater than zero.',
        ingredientsSumMustBe100: 'The sum of percentages must equal 100%.',
      },
    },
  },
};
