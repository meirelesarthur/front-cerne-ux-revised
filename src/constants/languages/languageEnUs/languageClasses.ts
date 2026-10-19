// src/constants/languages/languageEnUs/languageClasses.ts
// EN-US translation of the Product Kind module (Kind — Base Registrations /
// Structure, execution 024).

import { ModuleKinds } from '@/@types/language/module-kinds';

export const languageClasses: ModuleKinds = {
  kind: {
    singularLabel: 'Kind',
    list: {
      pageTitle: 'Kinds',
      pageSubtitle: 'Manage the product kinds linked to registered categories.',
      deletedToast: 'Kind deleted successfully',
      table: {
        name: 'Name',
        category: 'Category',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No kinds registered.',
        descriptionEmpty: 'Start by adding the first kind.',
        titleEmptyNoCreate: 'No kinds available.',
        descriptionEmptyNoCreate:
          'There are no kinds registered yet. Contact the platform administrator.',
        titleFiltered: 'No kinds found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Kind',
      },
      deleteConfirm: {
        title: 'Delete kind',
        description: 'Are you sure you want to delete the kind',
        warning:
          'If there are products linked to this kind, deletion will be blocked by the system.',
      },
    },
    filter: {
      title: 'Filter kinds',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      category: 'Category',
      categoryAll: 'All',
      categorySearchPlaceholder: 'Search by description',
    },
    form: {
      title: {
        create: 'New Kind',
        edit: 'Edit Kind',
      },
      subtitle: {
        create: 'Register a new product kind linked to a category.',
        edit: 'Update the kind data.',
      },
      fields: {
        name: 'Name',
        isEnabled: 'Active',
        category: 'Category',
      },
      placeholders: {
        name: 'E.g.: Nitrogen Fertilizer',
        category: 'Search by description',
      },
      hints: {
        categoryRequired: 'Category is required.',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 100 characters',
        categoryRequired: 'Select a category',
      },
    },
  },
};
