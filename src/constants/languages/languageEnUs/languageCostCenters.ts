// src/constants/languages/languageEnUs/languageCostCenters.ts
// EN-US translation of the COST CENTERS module (Base Registrations).

import { ModuleCostCenters } from '@/@types/language/module-cost-centers';

export const languageCostCenters: ModuleCostCenters = {
  costCenter: {
    singularLabel: 'Cost Center',
    list: {
      pageTitle: 'Cost Centers',
      pageSubtitle: 'Manage the cost centers used to allocate revenue and expenses.',
      deletedToast: 'Cost center removed successfully',
      table: {
        code: 'Code',
        class: 'Class',
        condition: 'Condition',
        description: 'Description',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        view: 'View',
        createDescendant: 'Register descendant',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No cost centers registered.',
        descriptionEmpty: 'Start by adding your first cost center.',
        titleEmptyNoCreate: 'No cost centers available.',
        descriptionEmptyNoCreate:
          'There are no cost centers linked to your account yet. Contact the platform administrator.',
        titleFiltered: 'No cost centers found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Cost Center',
      },
    },
    filter: {
      title: 'Filter cost centers',
      search: 'Search',
      searchPlaceholder: 'Search by code or description',
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        productive: 'Productive',
        apportioned: 'Apportioned',
      },
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
    },
    form: {
      title: {
        create: 'New Cost Center',
        edit: 'Edit Cost Center',
        createDescendant: 'New Cost Center (Descendant)',
      },
      subtitle: {
        create: 'Register a new cost center to allocate revenue and expenses.',
        edit: 'Update the cost center data.',
        createDescendant: 'Register an analytical cost center linked to the selected parent.',
      },
      sectionData: 'Cost center data',
      fields: {
        description: 'Description',
        condition: 'Condition',
        isEnabled: 'Active',
        allowPointing: 'Pointing',
        type: 'Type',
        parentUuid: 'Parent',
        code: 'Code',
        class: 'Class',
        categories: 'Financial Categories',
      },
      placeholders: {
        description: 'E.g.: Headquarters Administration',
        parentUuid: 'Search by code or description',
      },
      hints: {
        parentUuidImmutable: 'The parent cannot be changed after creation.',
        parentUuidCreate:
          'Selecting a parent makes this center Analytical; leave it blank for a root center (Synthetic).',
        parentUuidFixedDescendant:
          'This center will be a direct descendant of the selected parent — the link cannot be changed.',
        codeGenerated: 'Automatically generated on save',
        classPreviewBadge: 'Preview',
      },
      conditionOptions: {
        expense: 'Expense',
        revenue: 'Revenue',
        both: 'Both',
      },
      classLabels: {
        synthetic: 'Synthetic',
        analytical: 'Analytical',
      },
      categoriesTree: {
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        emptyGroup: 'No categories in this group',
        noCategories: 'No financial categories available.',
        searchPlaceholder: 'Search category by code or description',
        noResults: 'No category found for this search.',
      },
      apportionments: {
        sectionTitle: 'Apportionment',
        sectionHint:
          "Distribute the percentage across cost centers. The sum doesn't need to reach 100% to save, but we recommend adjusting it to 100%.",
        addRowLabel: 'Add row',
        removeRowLabel: 'Remove row',
        emptyTitle: 'No apportionment added.',
        fields: {
          costCenter: 'Cost center',
          percentage: 'Percentage (%)',
        },
        placeholders: {
          costCenter: 'Search by code or description',
        },
        sumLabel: 'Current sum',
        sumHint: '100% recommended',
      },
      parentPreview: {
        loading: 'Loading parent…',
        errorTitle: 'Unable to load the parent cost center.',
        errorDescription: 'Check whether it still exists and is linked to your tenant.',
      },
      validation: {
        descriptionRequired: 'Description is required',
        descriptionMaxLength: 'Description must be at most 40 characters',
        conditionRequired: 'Select a condition',
        apportionmentsRequired: 'Add at least one apportionment for the Apportioned type',
        apportionmentCostCenterRequired: "Select the apportionment's cost center",
        apportionmentPercentageRequired: 'Enter the apportionment percentage',
        apportionmentPercentageRange: 'The percentage must be between 0 and 100',
      },
    },
    detail: {
      actions: {
        edit: 'Edit',
      },
      generalData: {
        title: 'General Data',
      },
      categories: {
        title: 'Linked Financial Categories',
        empty: 'No financial category linked.',
      },
      apportionments: {
        title: 'Apportionment',
      },
      notFound: {
        title: 'Cost center not found.',
        description: 'Check whether it still exists and is linked to your account.',
        back: 'Back to the list',
      },
    },
  },
};
