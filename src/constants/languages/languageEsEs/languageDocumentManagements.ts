// src/constants/languages/languageEsEs/languageDocumentManagements.ts
// Traducción es-ES del módulo "Documentos" (DocumentManagement —
// Administrativo / Gestión Documentos, Tareas 12/13). Módulo HERMANO de
// `documentTypes` (mismo grupo de menú). Ver
// `@/@types/language/module-base-registrations` para el contrato completo
// (`documentManagements`).

import type { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

export const languageDocumentManagements: ModuleBaseRegistrations['documentManagements'] = {
  singularLabel: 'Documento',
  pluralLabel: 'Documentos',

  list: {
    pageTitle: 'Documentos',
    pageSubtitle: 'Administre los documentos y certificados de la granja.',
    deletedToast: 'Documento eliminado con éxito',
    table: {
      code: 'Código',
      description: 'Descripción',
      documentType: 'Tipo de Documento',
      validity: 'Validez',
      alertDays: 'Días de Alerta',
      actions: 'Acciones',
    },
    actions: {
      view: 'Visualizar',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    emptyState: {
      titleEmpty: 'Ningún documento registrado.',
      descriptionEmpty: 'Comience agregando el primer documento.',
      titleEmptyNoCreate: 'Ningún documento registrado.',
      descriptionEmptyNoCreate: 'Todavía no se ha registrado ningún documento.',
      titleFiltered: 'Ningún documento encontrado.',
      descriptionFiltered: 'Ajuste los filtros para encontrar lo que busca.',
      cta: 'Nuevo Documento',
    },
    error: {
      message: 'No fue posible cargar la lista de Documentos.',
      retry: 'Intentar de nuevo',
    },
    deleteConfirm: {
      title: 'Eliminar documento',
      description:
        '¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
    },
  },

  filter: {
    title: 'Filtrar Documentos',
    documentType: 'Tipo de Documento',
    documentTypeAll: 'Todos',
    startDate: 'Validez desde',
    endDate: 'Validez hasta',
    dateRangeInvalid: 'La fecha final debe ser mayor o igual a la fecha inicial',
  },

  form: {
    title: {
      create: 'Nuevo Documento',
      edit: 'Editar Documento',
      view: 'Visualizar Documento',
    },
    subtitle: {
      create: 'Registre un nuevo documento.',
      edit: 'Edite los datos del documento seleccionado.',
    },
    fields: {
      code: 'Código',
      documentType: 'Tipo de Documento',
      description: 'Descripción',
      validity: 'Validez',
      alertDays: 'Días de Alerta',
      observation: 'Observación',
      attachmentName: 'Descripción del Anexo',
      attachmentFile: 'Archivo',
    },
    placeholders: {
      documentType: 'Seleccione el Tipo de Documento',
    },
    hints: {
      codeGenerated: 'Generado automáticamente al guardar',
    },
    sections: {
      attachments: 'Anexos',
    },
    validation: {
      documentTypeRequired: 'El Tipo de Documento es obligatorio',
      descriptionRequired: 'La Descripción es obligatoria',
      descriptionMaxLength: 'La Descripción debe tener como máximo 100 caracteres',
      observationMaxLength: 'La Observación debe tener como máximo 200 caracteres',
      attachmentNameMaxLength: 'La Descripción del Anexo debe tener como máximo 255 caracteres',
    },
    toasts: {
      createSuccess: 'Documento creado con éxito.',
      updateSuccess: 'Documento actualizado con éxito.',
    },
  },

  attachmentRow: {
    addButton: '+ Agregar ítem',
    removeButton: 'Eliminar',
    emptyLabel: 'Ningún anexo agregado',
    defaultName: 'No Informado',
    dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
    dropzoneDragging: 'Suelte el archivo aquí',
    changeLabel: 'Cambiar archivo',
    clearFileLabel: 'Limpiar selección',
    replaceLabel: 'Sustituir archivo',
    existingFileLabel: 'Anexo actual',
    errorType: 'Formato no aceptado.',
    errorSize: 'El archivo excede el tamaño máximo de 10 MB.',
  },
};
