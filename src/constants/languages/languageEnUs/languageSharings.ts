// src/constants/languages/languageEnUs/languageSharings.ts
// English translation of the "Sharing" module (Integrations, F-122,
// 97-Esteiras/070). Mirror structure of languagePtBr/languageSharings.ts.

import { ModuleSharings } from '@/@types/language/module-sharings';

export const languageSharings: ModuleSharings['sharings'] = {
  singularLabel: 'Sharing',
  pluralLabel: 'Sharings',
  list: {
    pageTitle: 'Sharings',
    pageSubtitle: 'Manage the registered sharings.',
    table: {
      date: 'Date',
      tenant: 'Tenant',
      user: 'Responsible',
      actions: 'Action',
    },
    actions: {
      edit: 'Edit',
      view: 'View',
      delete: 'Delete',
    },
    emptyState: {
      title: 'No sharing registered.',
      description: 'Start by registering a new sharing.',
      cta: 'New Sharing',
    },
    deleteDialog: {
      header: 'Delete sharing?',
      body: 'Are you sure? This action cannot be undone.',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
    deletedToast: 'Sharing deleted successfully.',
    error: {
      message: 'Unable to load sharings.',
      retry: 'Try again',
    },
  },
  form: {
    createTitle: 'Sharing',
    editTitle: 'Sharings',
    fields: {
      date: 'Date',
      responsible: 'Responsible',
      tenant: 'Tenant',
      items: 'Items',
    },
    placeholders: {
      tenant: 'Enter the Tenant tax ID',
    },
    itemsLabel: 'Marking',
    save: 'Save',
    cancel: 'Cancel',
    createdToast: 'Sharing created successfully.',
    updatedToast: 'Sharing updated successfully.',
    validation: {
      dateRequired: 'Enter the date',
      tenantRequired: 'Select the Tenant',
      itemsRequired: 'Select at least one item',
    },
  },
  detail: {
    pageTitle: 'Sharings',
    responsible: 'Responsible',
    tenant: 'Tenant',
    date: 'Date',
    items: 'Items',
    backButton: 'Back',
    notFound: {
      title: 'Sharing not found.',
      description: 'The record may have been deleted or the link is incorrect.',
    },
    error: {
      message: 'Unable to load the sharing.',
      retry: 'Try again',
    },
  },
};
