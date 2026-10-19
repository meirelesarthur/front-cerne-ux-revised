// src/constants/languages/languageEsEs/languageIntegrationDominios.ts
// Traducción ES del módulo "Software Domínio" (IntegrationDominio —
// Integrações, F-121, 97-Esteiras/072). Mirror estructural de
// `languageIntegrationDominios.ts` (pt-BR/en-US). "Domínio" es el nombre
// propio del sistema contable externo integrado — se mantiene SIN TRADUCIR
// en los 3 idiomas (mirror `languageIntegrations.ts`).

import { ModuleIntegrationDominios } from '@/@types/language/module-integration-dominios';

export const languageIntegrationDominios: ModuleIntegrationDominios['integrationDominios'] = {
  singularLabel: 'Integración Domínio',
  pluralLabel: 'Integraciones Domínio',
  list: {
    pageTitle: 'Software Domínio',
    pageSubtitle: 'Gestione las integraciones con el sistema contable Domínio.',
    table: {
      issuer: 'Emisor',
      accountant: 'Contador',
      enabled: 'Activo',
      actions: 'Acciones',
    },
    actions: {
      new: 'Nueva Integración',
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    emptyState: {
      title: 'Ninguna integración registrada.',
      description: 'Comience registrando una nueva integración con Domínio.',
      cta: 'Nueva Integración',
    },
    error: {
      message: 'No fue posible cargar las integraciones.',
      retry: 'Intentar de nuevo',
    },
    deleteDialog: {
      title: '¿Eliminar integración?',
      description: '¿Está seguro? Esta acción no podrá recuperarse.',
      confirm: 'Eliminar',
      cancel: 'Cancelar',
      deletedToast: 'Integración eliminada con éxito.',
    },
  },
  form: {
    createTitle: 'Nueva Integración Domínio',
    editTitle: 'Editar Integración Domínio',
    save: 'Guardar',
    cancel: 'Cancelar',
    fields: {
      issuer: 'Emisor',
      accountant: 'Contador',
      token: 'Token de Integración',
      enabled: 'Activo',
    },
    enabled: {
      sim: 'Sí',
      nao: 'No',
    },
    testConnection: {
      button: 'Probar Conexión',
      okToast: 'Conexión validada con éxito.',
      block: {
        accountant: 'Contador',
        client: 'Cliente',
      },
      validation: {
        issuerRequired: 'Seleccione el Emisor antes de probar la conexión.',
        accountantRequired: 'Seleccione el Contador antes de probar la conexión.',
        tokenRequired: 'Informe el Token de Integración antes de probar la conexión.',
      },
    },
    validation: {
      issuerRequired: 'Seleccione el Emisor',
      accountantRequired: 'Seleccione el Contador',
      tokenRequired: 'Informe el Token de Integración',
      enabledRequired: 'Seleccione si está Activo',
    },
  },
  detail: {
    title: 'Detalles de la Integración',
    fields: {
      issuer: 'Emisor',
      accountant: 'Contador',
      token: 'Token de Integración',
      enabled: 'Activo',
    },
  },
};
