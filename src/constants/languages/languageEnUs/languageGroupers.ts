// src/constants/languages/languageEnUs/languageGroupers.ts
// EN-US translation of the GROUPERS module (Grouper — Base Registrations / Financial).

import { ModuleGroupers } from '@/@types/language/module-groupers';

export const languageGroupers: ModuleGroupers = {
  grouper: {
    singularLabel: 'Grouper',
    list: {
      pageTitle: 'Groupers',
      pageSubtitle: 'Manage the grouper tree used in the financial chart of accounts.',
      deletedToast: 'Grouper removed successfully',
      table: {
        code: 'Code',
        name: 'Name',
        description: 'Description',
        type: 'Type',
        condition: 'Condition',
        order: 'Order',
        operations: 'Operations',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        addChild: 'Add child grouper',
        expand: 'Expand',
        collapse: 'Collapse',
      },
      emptyState: {
        titleEmpty: 'No groupers registered.',
        descriptionEmpty: 'Start by adding your first grouper.',
        titleFiltered: 'No groupers found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Grouper',
      },
      deleteConfirm: {
        title: 'Delete grouper',
        description: 'Are you sure you want to delete the grouper',
        warning:
          'This action will also delete every descendant grouper, if any, and cannot be undone.',
      },
      loadingChildren: 'Loading descendants...',
      error: {
        message: 'Could not load the descendants of this grouper.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter groupers',
      search: 'Search',
      searchPlaceholder: 'Search by name or code',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        cost: 'Cost',
        revenue: 'Revenue',
        depreciation: 'Depreciation',
        financial: 'Financial',
      },
      condition: 'Condition',
      conditionAll: 'All',
      conditionOptions: {
        category: 'Category',
        calculation: 'Calculation',
      },
    },
    form: {
      title: {
        create: 'New Grouper',
        edit: 'Edit Grouper',
        createChild: 'New Child Grouper',
      },
      subtitle: {
        create: 'Register a new grouper in the financial chart of accounts.',
        edit: 'Update the grouper data.',
      },
      fields: {
        name: 'Name',
        description: 'Description',
        type: 'Type',
        condition: 'Condition',
        isEnabled: 'Status',
        order: 'Order',
        formula: 'Formula',
        parent: 'Parent grouper',
      },
      placeholders: {
        name: 'E.g.: Fixed Costs, Operating Revenue',
        description: 'Optional description of the grouper',
        formula: 'Optional calculation formula',
      },
      parentPlaceholder: {
        root: 'None (root grouper)',
      },
      typeOptions: {
        cost: 'Cost',
        revenue: 'Revenue',
        depreciation: 'Depreciation',
        financial: 'Financial',
      },
      conditionOptions: {
        category: 'Category',
        calculation: 'Calculation',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 60 characters',
        descriptionMaxLength: 'Description must be at most 50 characters',
        typeRequired: 'Type is required',
        conditionRequired: 'Condition is required',
        isEnabledRequired: 'Status is required',
        orderRequired: 'Order is required',
        orderMin: 'Order must be at least 1',
        formulaMaxLength: 'Formula must be at most 191 characters',
      },
    },
  },
};
