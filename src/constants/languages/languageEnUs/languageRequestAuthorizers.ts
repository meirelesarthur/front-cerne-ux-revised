// src/constants/languages/languageEnUs/languageRequestAuthorizers.ts
// EN-US translation of the REQUEST AUTHORIZER module (Base Registrations /
// People). SLICE 1 (Lote 06 / esteira 089, Frente C, F-141) — `list` +
// `filter`. SLICE 2 (same lote/esteira, frente C) adds `form`
// (create/edit) — `rules.value` is a free-text field (not a closed Select):
// the legacy-faithful options source is not confirmed on this backend build
// yet (contract §10.4, non-blocking UX-GAP).

import { ModuleRequestAuthorizers } from '@/@types/language/module-request-authorizers';

export const languageRequestAuthorizers: ModuleRequestAuthorizers = {
  requestAuthorizer: {
    singularLabel: 'Authorizer',
    list: {
      pageTitle: 'Authorizers',
      pageSubtitle: 'Manage who can approve purchase requests.',
      deletedToast: 'Record deleted successfully.',
      createdToast: 'Record created successfully.',
      updatedToast: 'Record updated successfully.',
      deleteConfirm: {
        title: 'Are you sure?',
        text: 'Once deleted, you will not be able to recover this item!',
      },
      table: {
        user: 'User',
        maxValue: 'Value',
        maxValueUpTo: 'up to',
        createdAt: 'Created on',
        numberQuotes: 'Min. quotes',
        expenseOrganizer: 'Expense Orderer?',
        isConditional: 'Conditional Authorizer',
        isActive: 'Active',
        farms: 'Farms',
        farmsCount: 'farm(s)',
        active: 'Active',
        inactive: 'Inactive',
        yes: 'Yes',
        no: 'No',
      },
      actions: {
        // "View" opens the dedicated screen (`/visualizar`, `view` only).
        view: 'View authorizer',
        edit: 'Edit authorizer',
        delete: 'Delete authorizer',
      },
      emptyState: {
        titleEmpty: 'No information registered.',
        descriptionEmpty: 'Start by adding your first authorizer.',
        titleEmptyNoCreate: 'No information registered.',
        descriptionEmptyNoCreate: 'Ask an administrator to register an authorizer.',
        titleFiltered: 'No information registered.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Authorizer',
      },
    },
    filter: {
      title: 'Filter authorizers',
      search: 'Search',
      searchPlaceholder: 'Search by user name',
    },
    form: {
      title: {
        create: 'New Authorizer',
        edit: 'Edit Authorizer',
        view: 'View Authorizer',
      },
      subtitle: {
        create: 'Register a new purchase request authorizer.',
        edit: 'Update the authorizer data.',
        view: 'Review the authorizer data.',
      },
      fields: {
        userUuid: 'User',
        maxValue: 'Limit',
        numberQuotes: 'Minimum number of quotes',
        isActive: 'Active',
        expenseOrganizer: 'Expense Orderer?',
        isConditional: 'Conditional authorizer',
        responsible: 'Responsible',
        creationDate: 'Creation Date',
        lastUpdate: 'Last update',
      },
      placeholders: {
        userUuid: 'Search by name',
      },
      hints: {
        maxValue: 'Enter the maximum amount this authorizer can approve',
      },
      farms: {
        sectionTitle: 'Farms',
        sectionHint: 'Link at least 1 farm and this authorizer’s approval level on it.',
        addRowLabel: 'Add Farm',
        removeRowLabel: 'Remove farm',
        removeConfirm: {
          title: 'Are you sure?',
          text: 'Do you really want to remove this item?',
        },
        incompleteRow: 'Fill in all fields before adding new ones.',
        minOneItem: 'You must have at least one item in the list',
        levelPlaceholder: 'Select',
        emptyTitle: 'Add at least 1 farm.',
        fields: {
          farm: 'Farm',
          level: 'Level',
        },
        placeholders: {
          farm: 'Select',
        },
      },
      rules: {
        sectionTitle: 'Authorization Rules',
        sectionHint: 'Restrict when this authorizer takes part in the approval flow.',
        addRowLabel: 'Add Rule',
        removeRowLabel: 'Remove rule',
        emptyTitle: 'Add at least 1 rule.',
        fields: {
          type: 'Type',
          value: 'Value',
          applyOn: 'Applies',
        },
        placeholders: {
          value: 'Select the request type',
        },
        typeOptions: {
          requestPurchase: 'Request Type',
        },
        valueOptions: {
          all: 'All',
        },
        applyOnOptions: {
          before: 'Before Quotation',
          after: 'After Quotation',
        },
      },
      validation: {
        userRequired: 'User is required',
        maxValueRequired: 'The Limit field is required.',
        maxValueRange: 'The limit must be greater than or equal to zero',
        numberQuotesRequired: 'The minimum number of quotes is required',
        numberQuotesMin: 'The minimum number of quotes must be at least 1',
        farmsRequired: 'Add at least 1 farm',
        farmFarmRequired: 'Select the farm',
        farmLevelRequired: 'Select the level',
        farmLevelRange: 'The level must be between 1 and 4',
        rulesRequired: 'Add at least 1 rule',
        ruleTypeRequired: 'Select the type',
        ruleValueRequired: 'Value is required',
        ruleApplyOnRequired: 'Select when the rule applies',
      },
    },
  },
};
