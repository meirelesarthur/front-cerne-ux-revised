// src/constants/languages/languageEnUs/languageCategoriaAnimal.ts
// EN-US translation of the "Categorias Animais" (CategoryAnimal — Base
// Registrations / Livestock, execução 025) module. TASK-FE-540 (infra +
// validation) + TASK-FE-541 (listing/filter).

import { ModuleCategoryAnimals } from '@/@types/language/module-category-animals';

export const languageCategoriaAnimal: ModuleCategoryAnimals = {
  categoryAnimal: {
    singularLabel: 'Animal Category',
    pluralLabel: 'Animal Categories',

    genderOptions: {
      male: 'Male',
      female: 'Female',
      both: 'Both',
    },

    list: {
      pageTitle: 'Animal Categories',
      pageSubtitle: 'Manage the animal categories used in livestock management.',
      deletedToast: 'Animal category deleted successfully',
      table: {
        description: 'Description',
        specie: 'Species',
        specieEmpty: '—',
        gender: 'Gender',
        ageRange: 'Age range',
        ageRangeEmpty: '—',
        ageRangeFrom: 'from {months} months',
        ageRangeTo: 'up to {months} months',
        ageRangeBetween: '{start} to {end} months',
        active: 'Status',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No animal categories registered.',
        descriptionEmpty: 'Start by adding the first category.',
        titleEmptyNoCreate: 'No animal categories available.',
        descriptionEmptyNoCreate:
          'No categories registered yet. Contact the platform administrator.',
        titleFiltered: 'No categories found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Category',
      },
      deleteConfirm: {
        title: 'Delete animal category',
        description: 'Are you sure you want to delete the category',
        warning:
          'This action is permanent and cannot be undone. If there are dependent links, the deletion may be blocked by the system.',
      },
    },

    filter: {
      title: 'Filter animal categories',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      specie: 'Species',
      specieAll: 'All',
      gender: 'Gender',
      genderAll: 'All',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },

    form: {
      title: {
        create: 'New Animal Category',
        edit: 'Edit Animal Category',
      },
      subtitle: {
        create: 'Register a new animal category linked to a species.',
        edit: 'Update the animal category data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Active',
        specie: 'Species',
        gender: 'Gender',
        startMonth: 'Start month',
        endMonth: 'End month',
        nextCategory: 'Next Category (Evolution)',
      },
      placeholders: {
        description: 'E.g.: Calf',
        specie: 'Search by description',
        nextCategory: 'Search by description',
      },
      hints: {
        specieRequired: 'Species is required.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        specieRequired: 'Select a species',
        genderRequired: 'Select the gender',
        startMonthMin: 'Start month cannot be negative',
        endMonthMin: 'End month cannot be negative',
      },
    },
  },
};
