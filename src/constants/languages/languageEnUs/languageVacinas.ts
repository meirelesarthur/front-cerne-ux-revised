// src/constants/languages/languageEnUs/languageVacinas.ts
// EN-US translation of the VACCINES module (Base Registrations / Livestock).

import { ModuleVaccines } from '@/@types/language/module-vaccines';

export const languageVacinas: ModuleVaccines = {
  vaccine: {
    singularLabel: 'Vaccine',
    list: {
      pageTitle: 'Vaccines',
      pageSubtitle: 'Manage the vaccine types applicable to animals.',
      deletedToast: 'Vaccine deleted successfully',
      table: {
        description: 'Description',
        specie: 'Species',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: { edit: 'Edit', delete: 'Delete' },
      emptyState: {
        titleEmpty: 'No vaccines registered.',
        descriptionEmpty: 'Start by adding your first vaccine.',
        titleEmptyNoCreate: 'No vaccines available.',
        descriptionEmptyNoCreate:
          'There are no vaccines registered yet. Contact the platform administrator.',
        titleFiltered: 'No vaccines found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Vaccine',
      },
      deleteConfirm: {
        title: 'Delete vaccine',
        description: 'Are you sure you want to delete the vaccine',
        warning:
          'This action cannot be undone. A vaccine with linked records cannot be deleted; deactivate it instead.',
      },
    },
    filter: {
      title: 'Filter vaccines',
      search: 'Search',
      searchPlaceholder: 'Search by description',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: { active: 'Active', inactive: 'Inactive' },
      specie: 'Species',
      specieAll: 'All',
      specieSearchPlaceholder: 'Search by description',
    },
    form: {
      title: { create: 'New Vaccine', edit: 'Edit Vaccine' },
      subtitle: {
        create: 'Register a new vaccine type.',
        edit: 'Update the vaccine data.',
      },
      fields: { description: 'Description', isEnabled: 'Status', specie: 'Species' },
      placeholders: { description: 'E.g.: Foot-and-mouth', specie: 'Search by description' },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
      },
    },
  },
};
