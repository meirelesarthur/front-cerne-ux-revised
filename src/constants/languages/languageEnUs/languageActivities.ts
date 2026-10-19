// src/constants/languages/languageEnUs/languageActivities.ts
// EN-US translation of the ACTIVITIES module (Activity — Base Registrations / Agriculture).

import { ModuleActivities } from '@/@types/language/module-activities';

export const languageActivities: ModuleActivities = {
  activity: {
    singularLabel: 'Activity',
    list: {
      pageTitle: 'Activities',
      pageSubtitle: 'Manage the activities used for cost-per-hectare appropriation.',
      deletedToast: 'Activity removed successfully',
      table: {
        name: 'Name',
        description: 'Description',
        vlHectare: 'Value/Hectare',
        type: 'Type',
        use: 'Use',
        operations: 'Operations',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No activities registered.',
        descriptionEmpty: 'Start by adding your first activity.',
        titleFiltered: 'No activities found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Activity',
      },
    },
    filter: {
      title: 'Filter activities',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      type: 'Type',
      typeAll: 'All',
      typeOptions: {
        costing: 'Costing',
        investment: 'Investment',
        undefined: 'Undefined',
      },
      use: 'Use',
      useAll: 'All',
      useOptions: {
        both: 'Both',
        agriculture: 'Agriculture',
        fruitculture: 'Fruitculture',
        beefCattle: 'Beef Cattle',
      },
    },
    form: {
      title: {
        create: 'New Activity',
        edit: 'Edit Activity',
      },
      subtitle: {
        create: 'Register a new activity for use in cost appropriation.',
        edit: 'Update the activity data.',
      },
      fields: {
        name: 'Name',
        description: 'Description',
        vlHectare: 'Value/Hectare',
        type: 'Type',
        use: 'Use',
        isEnabled: 'Status',
        operations: 'Operations',
      },
      operationsField: {
        searchPlaceholder: 'Search operation by name',
        selectAllLabel: 'Select all',
        deselectAllLabel: 'Deselect all',
        selectedCountLabel: 'Selected records',
        emptyLabel: 'No operations found.',
        errorLabel: 'Error loading operations.',
        retryLabel: 'Try again',
      },
      placeholders: {
        name: 'E.g.: Soybean Harvest, Fence Maintenance',
        description: 'Optional description of the activity',
        vlHectare: '0.00',
      },
      typeOptions: {
        costing: 'Costing',
        investment: 'Investment',
        undefined: 'Undefined',
      },
      useOptions: {
        both: 'Both',
        agriculture: 'Agriculture',
        fruitculture: 'Fruitculture',
        beefCattle: 'Beef Cattle',
      },
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 30 characters',
        descriptionMaxLength: 'Description must be at most 50 characters',
        isEnabledRequired: 'Status is required',
        vlHectareRequired: 'Value per hectare is required',
        vlHectareMin: 'Value per hectare cannot be negative',
        typeRequired: 'Type is required',
        useRequired: 'Use is required',
      },
    },
  },
};
