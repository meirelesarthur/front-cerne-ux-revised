// src/constants/languages/languageEnUs/languageSpecies.ts
// EN-US translation of the SPECIES module (Base Registrations).

import { ModuleSpecies } from '@/@types/language/module-species';

export const languageSpecies: ModuleSpecies = {
  specie: {
    singularLabel: 'Species',
    list: {
      pageTitle: 'Species',
      pageSubtitle: 'Manage the species used when registering animals.',
      deletedToast: 'Species removed successfully',
      table: {
        description: 'Description',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No species registered.',
        descriptionEmpty: 'Start by adding your first species.',
        titleFiltered: 'No species found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Species',
      },
    },
    filter: {
      title: 'Filter species',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Species',
        edit: 'Edit Species',
      },
      subtitle: {
        create: 'Register a new species for use in animal registration.',
        edit: 'Update the species data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
        costCenter: 'Cost Center',
      },
      placeholders: {
        description: 'E.g.: Bovine',
        costCenter: 'Search by code or description',
      },
      hints: {
        costCenterOptional: 'Optional — link a cost center to allocate revenue and expenses for this species.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
};
