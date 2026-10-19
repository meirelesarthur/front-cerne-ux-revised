// src/constants/languages/languageEnUs/languageConfiguracoes.ts
// EN-US translation of the CONFIGURAÇÕES module — "Help" entity (Tutorials,
// TASK-HP-06). First module in this translation tree.

import { ModuleConfiguracoes } from '@/@types/language/module-configuracoes';

export const languageConfiguracoes: ModuleConfiguracoes = {
  help: {
    singularLabel: 'Tutorial',
    pluralLabel: 'Tutorials',
    list: {
      pageTitle: 'Tutorials',
      pageSubtitle: 'Manage the contextual help links linked to the system screens.',
      deletedToast: 'Tutorial removed successfully',
      table: {
        url: 'URL',
        screen: 'Screen',
        createdAt: 'Created at',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        title: 'No tutorial registered.',
        description: 'Start by adding the first tutorial.',
        titleFiltered: 'No tutorial found.',
        descriptionFiltered: 'Try adjusting the filter or clearing the search.',
        cta: 'Add Tutorial',
      },
    },
    filter: {
      title: 'Filter tutorials',
      screen: 'Screen',
      screenPlaceholder: 'Search by screen',
    },
    form: {
      title: {
        create: 'New Tutorial',
        edit: 'Edit Tutorial',
      },
      subtitle: {
        create: 'Register a new help link linked to a system screen.',
        edit: 'Update this tutorial help link.',
      },
      fields: {
        url: 'URL',
        screen: 'Screen',
      },
      placeholders: {
        url: 'https://...',
        screen: 'Search by screen',
      },
    },
    deleteDialog: {
      title: 'Delete tutorial',
    },
  },
  // Applications (App — mobile app release versions, TASK-APP-FE-01,
  // 2026-08-06). NEW block, alongside `help` (does not replace it).
  app: {
    singularLabel: 'Application',
    pluralLabel: 'Applications',
    list: {
      pageTitle: 'Applications',
      pageSubtitle: 'Manage the mobile app release versions.',
      deletedToast: 'Application removed successfully',
      table: {
        platform: 'Platform',
        version: 'Version',
        releaseDate: 'Release Date',
        deadline: 'Deadline',
        createdAt: 'Created at',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        title: 'No application registered.',
        description: 'Start by adding the first application.',
        titleFiltered: 'No application found.',
        descriptionFiltered: 'Try adjusting the filter or clearing the search.',
        cta: 'Add Application',
      },
    },
    filter: {
      title: 'Filter applications',
      platform: 'Platform',
      platformPlaceholder: 'Search by platform',
      version: 'Version',
      versionPlaceholder: 'Search by version',
    },
    form: {
      title: {
        create: 'New Application',
        edit: 'Edit Application',
      },
      subtitle: {
        create: 'Register a new mobile app release version.',
        edit: 'Update this mobile app release version.',
      },
      fields: {
        platform: 'Platform',
        version: 'Version',
        description: 'Description',
        releaseDate: 'Release Date',
        deadline: 'Deadline',
      },
      placeholders: {
        platform: 'E.g.: android',
        version: 'E.g.: 5.4.11',
        description: 'Description of this release version',
      },
    },
    deleteDialog: {
      title: 'Delete application',
    },
  },
  // Configuration (platform settings singleton, execution 032,
  // TASK-FE-2600). NEW block, alongside `help`/`app` (does not replace them).
  config: {
    singularLabel: 'Configuration',
    pluralLabel: 'Configuration',
    pageTitle: 'Configuration',
    pageSubtitle: 'Global platform parameters.',
    sections: {
      operational: 'Deadlines and Operational Parameters',
      mercadoPago: 'Mercado Pago',
      signup: 'Self-signup',
      support: 'Support and Technical Contact',
      videoIntro: 'Intro Video',
    },
    fields: {
      diasTeste: 'Trial days',
      diasAlertaPagamento: 'Payment alert days',
      diasAssinarContrato: 'Contract signing days',
      contratoCertificado: 'Sign contract with certificate',
      minutosOnline: 'Company online minutes',
      diasAlertaVencimentoCertificado: 'Certificate expiration alert days',
      mercadopagoPublicKey: 'Mercado Pago Public Key',
      mercadopagoAccessToken: 'Mercado Pago Access Token',
      afiliadoPadrao: 'Default affiliate',
      planoPadrao: 'Default plan',
      whatsappLinkSuporte: 'Support WhatsApp Link',
      respCnpj: 'Technical contact tax ID',
      respNome: 'Technical contact name',
      respEmail: 'Technical contact email',
      respFone: 'Technical contact phone',
    },
    secretPlaceholder: {
      configured: '•••••••• (already configured)',
      empty: '',
    },
    videoIntro: {
      uploadCta: 'Upload intro video',
      replaceCta: 'Replace video',
      successToast: 'Intro video updated successfully.',
    },
    booleanOptions: {
      yes: 'Yes',
      no: 'No',
    },
    saveSuccessToast: 'Configuration updated successfully.',
    readOnlyNotice: 'You do not have permission to edit this configuration.',
  },
};
