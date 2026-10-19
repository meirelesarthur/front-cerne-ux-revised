// src/constants/languages/languageEnUs/languageWarehouses.ts
// EN-US translation of the WAREHOUSES module (Base Registrations).

import { ModuleWarehouses } from '@/@types/language/module-warehouses';

export const languageWarehouses: ModuleWarehouses = {
  warehouse: {
    singularLabel: 'Warehouse',
    list: {
      pageTitle: 'Warehouses',
      pageSubtitle: 'Manage the warehouses used for stock control.',
      deletedToast: 'Warehouse removed successfully',
      table: {
        initials: 'Initials',
        description: 'Description',
        type: 'Type',
        active: 'Status',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No warehouses registered.',
        descriptionEmpty: 'Start by adding your first warehouse.',
        titleFiltered: 'No warehouses found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Warehouse',
      },
    },
    filter: {
      title: 'Filter warehouses',
      search: 'Search',
      searchPlaceholder: 'Search by initials or description',
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        insumos: 'Supplies',
        producao: 'Production',
        formulacao: 'Formulation',
      },
      isActive: 'Status',
      isActiveAll: 'All',
      activeOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Warehouse',
        edit: 'Edit Warehouse',
      },
      subtitle: {
        create: 'Register a new warehouse for stock control.',
        edit: 'Update the warehouse data.',
      },
      fields: {
        initials: 'Initials',
        type: 'Type',
        description: 'Description',
        isActive: 'Active',
      },
      placeholders: {
        initials: 'E.g.: ALG',
        description: 'E.g.: Supplies Warehouse - Headquarters',
      },
      hints: {
        isActiveHelp:
          'Inactive warehouses stop appearing as an option in other screens of the system.',
      },
      validation: {
        initialsRequired: 'Initials are required',
        initialsMinLength: 'Initials must have at least 2 characters',
        initialsMaxLength: 'Initials must have at most 6 characters',
        typeRequired: 'Select a type',
        descriptionRequired: 'Description is required',
        descriptionMinLength: 'Description must have at least 2 characters',
        descriptionMaxLength: 'Description must have at most 80 characters',
      },
    },
  },
};
