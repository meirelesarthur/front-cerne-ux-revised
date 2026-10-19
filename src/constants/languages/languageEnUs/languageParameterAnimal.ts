// src/constants/languages/languageEnUs/languageParameterAnimal.ts
// EN-US translation of the ANIMAL PARAMETERS module (Cadastros Base / Livestock).
// Foundation of the screen regeneration (TASK-FE-1074) — mirror `languageCausaMortePerda`.
// Field labels faithful to contract v1.1 §2 ("Feeding Area (cm³)", "Water
// Consumption (L)", "DM Consumption (Kg)", "Average Weight (Kg)").

import { ModuleParameterAnimals } from '@/@types/language/module-parameter-animals';

export const languageParameterAnimal: ModuleParameterAnimals = {
  parameterAnimal: {
    singularLabel: 'Animal Parameter',
    pluralLabel: 'Animal Parameters',
    list: {
      pageTitle: 'Animal Parameters',
      pageSubtitle: 'Manage the nutritional reference parameters per animal category.',
      deletedToast: 'Animal parameter deleted successfully',
      table: {
        code: 'Code',
        description: 'Description',
        category: 'Category',
        employee: 'Responsible',
        averageWeight: 'Average Weight',
      },
      actions: {
        edit: 'Edit animal parameter',
        delete: 'Delete animal parameter',
      },
      emptyState: {
        titleEmpty: 'No animal parameters registered.',
        titleFiltered: 'No results found.',
        titleEmptyNoCreate: 'No animal parameters available.',
        descriptionEmpty: 'Start by adding the first animal parameter.',
        descriptionFiltered: 'Try adjusting or clearing the current filters.',
        descriptionEmptyNoCreate:
          'There are no animal parameters registered yet. Contact the platform administrator.',
        cta: 'New Animal Parameter',
      },
      deleteConfirm: {
        title: 'Delete animal parameter',
        description: 'Are you sure you want to delete the animal parameter',
        warning: 'This deletion is permanent and cannot be undone.',
      },
    },
    filter: {
      title: 'Filter Animal Parameters',
      description: 'Search by description',
    },
    form: {
      title: {
        create: 'New Animal Parameter',
        edit: 'Edit Animal Parameter',
      },
      subtitle: {
        create: 'Register a new nutritional reference parameter.',
        edit: 'Update the animal parameter data.',
      },
      fields: {
        code: 'Code',
        description: 'Description',
        employee: 'Responsible',
        specie: 'Species',
        category: 'Category',
        feedingArea: 'Feeding Area (cm³)',
        waterConsumption: 'Water Consumption (L)',
        msConsumption: 'DM Consumption (Kg)',
        averageWeight: 'Average Weight (Kg)',
      },
      placeholders: {
        description: 'E.g.: Weaned calves',
        employee: 'Search by name',
        specie: 'Select the species',
        category: 'Search by description',
        feedingArea: '0.00',
        waterConsumption: '0.00',
        msConsumption: '0.00',
        averageWeight: '0.00',
      },
      hints: {
        specieRequired: 'Select the species to enable Category.',
      },
      warnings: {
        categoryClearedBySpecieChange:
          'The selected category was removed because it does not belong to the new species.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 255 characters',
        employeeRequired: 'Select a responsible',
        specieRequired: 'Select a species',
        categoryRequired: 'Select a category',
        feedingAreaRequired: 'Feeding area is required',
        waterConsumptionRequired: 'Water consumption is required',
        msConsumptionRequired: 'DM consumption is required',
        averageWeightRequired: 'Average weight is required',
      },
    },
  },
};
