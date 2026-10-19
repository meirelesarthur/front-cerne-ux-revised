// src/constants/languages/languageEnUs/languageIntegrationDominios.ts
// EN-US translation of the "Software Domínio" module (IntegrationDominio —
// Integrações, F-121, 97-Esteiras/072). Mirror structure of
// `languageIntegrationDominios.ts` (pt-BR). "Domínio" is the proper name of
// the external accounting system integrated — kept UNTRANSLATED across all
// 3 languages (mirror `languageIntegrations.ts`, e.g. "NFS-e Export
// (Domínio)"). This namespace also feeds `queryKey.integrationDominios`
// (singularLabel/pluralLabel — TASK-F121-FE-01).

import { ModuleIntegrationDominios } from '@/@types/language/module-integration-dominios';

export const languageIntegrationDominios: ModuleIntegrationDominios['integrationDominios'] = {
  singularLabel: 'Domínio Integration',
  pluralLabel: 'Domínio Integrations',
  list: {
    pageTitle: 'Domínio Software',
    pageSubtitle: 'Manage the integrations with the Domínio accounting system.',
    table: {
      issuer: 'Issuer',
      accountant: 'Accountant',
      enabled: 'Enabled',
      actions: 'Actions',
    },
    actions: {
      new: 'New Integration',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
    },
    emptyState: {
      title: 'No integration registered.',
      description: 'Start by registering a new integration with Domínio.',
      cta: 'New Integration',
    },
    error: {
      message: 'Unable to load the integrations.',
      retry: 'Try again',
    },
    deleteDialog: {
      title: 'Delete integration?',
      description: 'Are you sure? This action cannot be undone.',
      confirm: 'Delete',
      cancel: 'Cancel',
      deletedToast: 'Integration deleted successfully.',
    },
  },
  form: {
    createTitle: 'New Domínio Integration',
    editTitle: 'Edit Domínio Integration',
    save: 'Save',
    cancel: 'Cancel',
    fields: {
      issuer: 'Issuer',
      accountant: 'Accountant',
      token: 'Integration Token',
      enabled: 'Enabled',
    },
    enabled: {
      sim: 'Yes',
      nao: 'No',
    },
    testConnection: {
      button: 'Test Connection',
      okToast: 'Connection validated successfully.',
      block: {
        accountant: 'Accountant',
        client: 'Client',
      },
      validation: {
        issuerRequired: 'Select the Issuer before testing the connection.',
        accountantRequired: 'Select the Accountant before testing the connection.',
        tokenRequired: 'Enter the Integration Token before testing the connection.',
      },
    },
    validation: {
      issuerRequired: 'Select the Issuer',
      accountantRequired: 'Select the Accountant',
      tokenRequired: 'Enter the Integration Token',
      enabledRequired: 'Select whether it is Enabled',
    },
  },
  detail: {
    title: 'Integration Details',
    fields: {
      issuer: 'Issuer',
      accountant: 'Accountant',
      token: 'Integration Token',
      enabled: 'Enabled',
    },
  },
};
