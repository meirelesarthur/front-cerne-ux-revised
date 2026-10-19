// src/constants/languages/languageEnUs/languageCategoryMatrix.ts
// EN-US translation of the CATEGORY MATRIX (Reproductive Stage) module — Base
// Registrations > Livestock.

import { ModuleCategoryMatrix } from '@/@types/language/module-category-matrix';

export const languageCategoryMatrix: ModuleCategoryMatrix = {
  categoryMatrix: {
    singularLabel: 'Reproductive Stage',
    list: {
      pageTitle: 'Reproductive Stage',
      pageSubtitle: 'Manage the reproductive stages used when registering animals.',
      deletedToast: 'Reproductive stage removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        specie: 'Species',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No reproductive stage registered.',
        descriptionEmpty: 'Start by adding the first reproductive stage.',
        titleFiltered: 'No reproductive stage found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Reproductive Stage',
      },
    },
    filter: {
      title: 'Filter reproductive stages',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      specie: 'Species',
      speciePlaceholder: 'Search by species',
    },
    form: {
      title: {
        create: 'New Reproductive Stage',
        edit: 'Edit Reproductive Stage',
      },
      subtitle: {
        create: 'Register a new reproductive stage for use in animal registration.',
        edit: 'Update the reproductive stage data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
        specie: 'Species',
      },
      placeholders: {
        description: 'E.g.: Heifer',
        specie: 'Search by species',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        specieRequired: 'Species is required',
      },
    },
  },
};
