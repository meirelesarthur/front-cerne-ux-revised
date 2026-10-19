// src/constants/languages/languageEnUs/languageGruposProduto.ts
// EN-US translation of the PRODUCT GROUPS module (Base Registrations).

import { ModuleProductGroups } from '@/@types/language/module-product-groups';

export const languageGruposProduto: ModuleProductGroups = {
  productGroup: {
    singularLabel: 'Product Group',
    list: {
      pageTitle: 'Product Groups',
      pageSubtitle: 'Manage the groups used to classify stock products.',
      deletedToast: 'Product group deleted successfully',
      table: {
        description: 'Description',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No product groups registered.',
        descriptionEmpty: 'Start by adding your first product group.',
        titleEmptyNoCreate: 'No product groups available.',
        descriptionEmptyNoCreate:
          'There are no product groups registered yet. Contact the platform administrator.',
        titleFiltered: 'No product groups found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Product Group',
      },
      deleteConfirm: {
        title: 'Delete product group',
        description: 'Are you sure you want to delete the product group',
        warning:
          'This deletion is permanent and cannot be undone — product groups do not use reversible deletion (no trash bin).',
      },
    },
    filter: {
      title: 'Filter product groups',
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
        create: 'New Product Group',
        edit: 'Edit Product Group',
      },
      subtitle: {
        create: 'Register a new group to classify stock products.',
        edit: 'Update the product group data.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
      },
      placeholders: {
        description: 'E.g.: Agricultural Inputs',
      },
      isEnabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 100 characters',
        isEnabledRequired: 'Select the status',
      },
    },
  },
};
