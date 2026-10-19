// src/constants/languages/languageEnUs/languagePlanos.ts
// EN-US translation of the PLANOS (PlanRole) module — own domain, TASK-FE-2700.

import { ModulePlanos } from '@/@types/language/module-planos';

export const languagePlanos: ModulePlanos = {
  planRole: {
    singularLabel: 'Plan',
    pluralLabel: 'Plans',
    list: {
      pageTitle: 'Plans',
      pageSubtitle: 'Manage the subscription plans offered to tenants.',
      deletedToast: 'Plan removed successfully',
      table: {
        name: 'Name',
        price: 'Price',
        intervalDays: 'Interval (days)',
        mainRole: 'Main Role',
        segments: 'Segments',
        isFree: 'Free',
        farmLimit: 'Farm Limit',
        concurrentUserLimit: 'Concurrent User Limit',
        freeLabel: 'Free',
        paidLabel: 'Paid',
        noRole: '—',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        view: 'View',
      },
      emptyState: {
        title: 'No plans registered.',
        description: 'Start by adding your first plan.',
        titleFiltered: 'No plans found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add Plan',
      },
      filter: {
        title: 'Filter plans',
        search: 'Search',
        searchPlaceholder: 'Search by name',
        isFree: 'Free',
        isFreeAll: 'All',
        isFreeOptions: {
          free: 'Free',
          paid: 'Paid',
        },
      },
    },
    form: {
      title: {
        create: 'New Plan',
        edit: 'Edit Plan',
      },
      subtitle: {
        create: 'Register a new subscription plan.',
        edit: 'Update the plan data.',
      },
      fields: {
        name: 'Name',
        price: 'Price',
        intervalDays: 'Interval (days)',
        farmLimit: 'Farm Limit',
        concurrentUserLimit: 'Concurrent User Limit',
        isFree: 'Free',
        animalsLimit: 'Animal Limit',
        agricultureAreaLimit: 'Agriculture Area Limit (ha)',
        fruitgrowingAreaLimit: 'Fruit Growing Area Limit (ha)',
        mainRole: 'Main Role',
        additionalRoles: 'Additional Roles',
        segments: 'Segments',
        signupLink: 'Signup Link',
      },
      placeholders: {
        name: 'E.g.: Professional Plan',
      },
      sections: {
        general: 'General Data',
        limits: 'Limits',
        assignments: 'Role Assignment',
        signup: 'Signup Link',
      },
      rolesSearchPlaceholder: 'Search role by name',
      selectedRolesCountLabel: 'Selected',
      segmentsTree: {
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        emptyGroup: 'No segments in this group',
        noCategories: 'No segments available.',
        searchPlaceholder: 'Search segment by code or description',
        noResults: 'No segment found for this search.',
      },
      copyLinkButton: 'Copy signup link',
      copyLinkSuccessToast: 'Signup link copied to clipboard',
      validation: {
        nameRequired: 'Name is required',
        nameMaxLength: 'Name must be at most 50 characters',
        priceRequired: 'Price is required',
        priceMin: 'Price must be at least 0',
        intervalDaysRequired: 'Interval is required',
        intervalDaysMin: 'Interval must be at least 1 day',
        limitMin: 'Value must be at least 1',
        animalsLimitRequired: 'Animal limit is required',
        animalsLimitMin: 'Animal limit must be at least 0',
        areaLimitRequired: 'Area limit is required',
        areaLimitMin: 'Area limit must be at least 0',
      },
    },
    detail: {
      actions: {
        edit: 'Edit',
      },
      generalData: {
        title: 'General Data',
      },
      limits: {
        title: 'Limits',
      },
      assignments: {
        title: 'Role Assignment',
        empty: 'No role linked.',
      },
      segments: {
        title: 'Segments',
        empty: 'No segment linked.',
      },
      signup: {
        title: 'Signup Link',
        description: 'Share this link so a new tenant can sign up directly on this plan.',
      },
      notFound: {
        title: 'Plan not found.',
        description: 'Check whether it still exists.',
        back: 'Back to the list',
      },
    },
  },
};
