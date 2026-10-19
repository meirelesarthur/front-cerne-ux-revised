// src/constants/languages/languageEnUs/languageFinancialCategories.ts
// EN-US translation of the FINANCIAL CATEGORIES module (FinancialCategory —
// Base Registrations / Financial), execution 023.

import { ModuleFinancialCategories } from '@/@types/language/module-financial-categories';

export const languageFinancialCategories: ModuleFinancialCategories = {
  financialCategory: {
    singularLabel: 'Financial Category',
    list: {
      pageTitle: 'Financial Categories',
      pageSubtitle: 'Manage the financial category tree used in the chart of accounts.',
      deletedToast: 'Financial category removed successfully',
      table: {
        code: 'Code',
        description: 'Description',
        typeGrouper: 'Type / Grouper',
        classification: 'Classification',
        operations: 'Operations',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        addChild: 'Add child category',
        expand: 'Expand',
        collapse: 'Collapse',
      },
      emptyState: {
        titleEmpty: 'No financial categories registered.',
        descriptionEmpty: 'Start by adding your first category.',
        titleFiltered: 'No financial categories found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New category',
      },
      deleteConfirm: {
        title: 'Delete financial category',
        description: 'Are you sure you want to delete the category',
        warning:
          'This action will also delete every descendant category, if any, and cannot be undone.',
      },
      error: {
        message: 'Could not load the financial categories.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter financial categories',
      search: 'Search',
      searchPlaceholder: 'Search by description or code',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      classification: 'Classification',
      classificationAll: 'All',
      classificationOptions: {
        unclassified: 'Unclassified',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
    },
    form: {
      title: {
        create: 'New Financial Category',
        edit: 'Edit Financial Category',
        createChild: 'New Child Financial Category',
      },
      subtitle: {
        create: 'Register a new financial category in the chart of accounts.',
        edit: 'Update the financial category data.',
        createChild: 'The new category inherits Type and Grouper from the selected group.',
      },
      fields: {
        description: 'Description',
        isEnabled: 'Status',
        type: 'Type',
        grouper: 'Grouper',
        generatesObligationOrRight: 'Generates obligation or right',
        classification: 'Classification',
        accountingGrouper: 'Accounting grouper',
        centers: 'Linked Cost Centers',
        parent: 'Parent group',
        code: 'Code',
        class: 'Class',
      },
      placeholders: {
        description: 'E.g.: Fuel, Direct labor',
      },
      classificationOptions: {
        unclassified: 'Unclassified',
        capex: 'CAPEX',
        opex: 'OPEX',
      },
      classLabels: {
        synthetic: 'Synthetic',
        analytical: 'Analytical',
      },
      hints: {
        codeGenerated: 'Automatically generated on save',
        classPreviewBadge: 'Preview',
        typeGrouperInherited: 'Inherited from the parent group — not editable on this category',
        classificationLockedSynthetic: 'Synthetic (group) categories have no classification',
        lockedByTenantContext: 'Locked — not editable for users linked to a farm/tenant',
      },
      parentPreview: {
        loading: 'Loading parent group...',
        errorTitle: 'Could not load the parent group',
        errorDescription: 'Go back to the listing and try again from the desired group.',
      },
      centersTree: {
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        emptyGroup: 'No cost centers in this group',
        noCategories: 'No cost centers available.',
        searchPlaceholder: 'Search cost center by code or description',
        noResults: 'No cost center found for this search.',
        errorLabel: 'Error loading cost centers.',
        retryLabel: 'Try again',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 120 characters',
        typeRequired: 'Type is required',
        grouperRequired: 'Grouper is required',
        classificationRequired: 'Classification is required',
      },
    },
    report: {
      tooltip: 'Print report',
      documentTitle: 'Financial Categories',
      columnCode: 'Code',
      columnClass: 'Class',
      columnType: 'Type',
      columnDescription: 'Description',
      metaCountSingular: 'financial category',
      metaCountPlural: 'financial categories',
      errorToast: 'Could not generate the report. Try again.',
      popupBlockedToast:
        'The browser blocked the print window. Allow pop-ups for this site and try again.',
    },
  },
};
