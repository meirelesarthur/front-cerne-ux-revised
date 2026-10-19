// src/constants/languages/languageEnUs/languageRacas.ts
// EN-US translation of the BREEDS module (Base Registrations).

import { ModuleBreeds } from '@/@types/language/module-breeds';

export const languageRacas: ModuleBreeds = {
  breed: {
    singularLabel: 'Breed',
    list: {
      pageTitle: 'Breeds',
      pageSubtitle: 'Manage the breeds linked to the registered species.',
      deletedToast: 'Breed deleted successfully',
      table: {
        description: 'Description',
        specie: 'Species',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No breeds registered.',
        descriptionEmpty: 'Start by adding your first breed.',
        titleEmptyNoCreate: 'No breeds available.',
        descriptionEmptyNoCreate:
          'There are no breeds registered yet. Contact the platform administrator.',
        titleFiltered: 'No breeds found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Breed',
      },
      deleteConfirm: {
        title: 'Delete breed',
        description: 'Are you sure you want to delete the breed',
        warning:
          'This action cannot be undone. A breed with linked records cannot be deleted; deactivate it instead.',
      },
    },
    filter: {
      title: 'Filter breeds',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      specie: 'Species',
      specieAll: 'All',
      specieSearchPlaceholder: 'Search by description',
    },
    form: {
      title: {
        create: 'New Breed',
        edit: 'Edit Breed',
      },
      subtitle: {
        create: 'Register a new breed linked to a species.',
        edit: 'Update the breed data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Active',
        specie: 'Species',
      },
      placeholders: {
        description: 'E.g.: Nelore',
        specie: 'Search by description',
      },
      hints: {
        specieRequired: 'The species is required.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        specieRequired: 'Select a species',
      },
    },
  },
};
