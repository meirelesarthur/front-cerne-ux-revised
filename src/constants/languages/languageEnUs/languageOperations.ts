// src/constants/languages/languageEnUs/languageOperations.ts
// EN-US translation of the OPERATIONS module (Operation — Base Registrations / Agriculture).

import { ModuleOperations } from '@/@types/language/module-operations';

export const languageOperations: ModuleOperations = {
  operation: {
    singularLabel: 'Operation',
    list: {
      pageTitle: 'Operations',
      pageSubtitle: 'Manage the operations linked to agriculture and livestock activities.',
      deletedToast: 'Operation removed successfully',
      table: {
        name: 'Name',
        grouper: 'Grouper',
        order: 'Order',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        noGrouper: 'None',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No operations registered.',
        descriptionEmpty: 'Start by adding your first operation.',
        titleFiltered: 'No operations found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Operation',
      },
    },
    filter: {
      title: 'Filter operations',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      use: 'Use',
      useAll: 'All',
      useOptions: {
        both: 'Both',
        agriculture: 'Agriculture',
        livestock: 'Livestock',
      },
      grouper: 'Grouper',
      grouperAll: 'All',
    },
    form: {
      title: {
        create: 'New Operation',
        edit: 'Edit Operation',
      },
      subtitle: {
        create: 'Register a new operation for use in agriculture and livestock activities.',
        edit: 'Update the operation data.',
      },
      fields: {
        name: 'Name',
        description: 'Description',
        grouper: 'Grouper',
        order: 'Order',
        use: 'Use',
        isEnabled: 'Status',
      },
      placeholders: {
        name: 'E.g.: Planting, Harvest, Spraying',
        description: 'Optional description of the operation',
        grouper: 'Search grouper by code or name',
        order: '0',
      },
      useOptions: {
        both: 'Both',
        agriculture: 'Agriculture',
        livestock: 'Livestock',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 30 characters',
        descriptionMaxLength: 'Description must be at most 50 characters',
        orderRequired: 'Order is required',
        useRequired: 'Use is required',
        isEnabledRequired: 'Status is required',
      },
    },
  },
};
