// src/constants/languages/languageEsEs/languageSharings.ts
// Traducción ES del módulo "Compartilhamento" (Integraciones, F-122,
// 97-Esteiras/070). Mirror estructural de languagePtBr/languageSharings.ts.

import { ModuleSharings } from '@/@types/language/module-sharings';

export const languageSharings: ModuleSharings['sharings'] = {
  singularLabel: 'Compartición',
  pluralLabel: 'Comparticiones',
  list: {
    pageTitle: 'Comparticiones',
    pageSubtitle: 'Gestione las comparticiones registradas.',
    table: {
      date: 'Fecha',
      tenant: 'Arrendatario',
      user: 'Responsable',
      actions: 'Acción',
    },
    actions: {
      edit: 'Editar',
      view: 'Visualizar',
      delete: 'Eliminar',
    },
    emptyState: {
      title: 'Ninguna compartición registrada.',
      description: 'Comience registrando una nueva compartición.',
      cta: 'Nueva Compartición',
    },
    deleteDialog: {
      header: '¿Eliminar compartición?',
      body: '¿Está seguro? Esta acción no se puede deshacer.',
      confirm: 'Eliminar',
      cancel: 'Cancelar',
    },
    deletedToast: 'Compartición eliminada con éxito.',
    error: {
      message: 'No fue posible cargar las comparticiones.',
      retry: 'Intentar de nuevo',
    },
  },
  form: {
    createTitle: 'Compartición',
    editTitle: 'Comparticiones',
    fields: {
      date: 'Fecha',
      responsible: 'Responsable',
      tenant: 'Arrendatario',
      items: 'Elementos',
    },
    placeholders: {
      tenant: 'Informe el CPF/CNPJ del Arrendatario',
    },
    itemsLabel: 'Marcación',
    save: 'Guardar',
    cancel: 'Cancelar',
    createdToast: 'Compartición creada con éxito.',
    updatedToast: 'Compartición actualizada con éxito.',
    validation: {
      dateRequired: 'Informe la fecha',
      tenantRequired: 'Seleccione el Arrendatario',
      itemsRequired: 'Seleccione al menos un elemento',
    },
  },
  detail: {
    pageTitle: 'Comparticiones',
    responsible: 'Responsable',
    tenant: 'Arrendatario',
    date: 'Fecha',
    items: 'Elementos',
    backButton: 'Volver',
    notFound: {
      title: 'Compartición no encontrada.',
      description: 'El registro puede haber sido eliminado o el enlace es incorrecto.',
    },
    error: {
      message: 'No fue posible cargar la compartición.',
      retry: 'Intentar de nuevo',
    },
  },
};
