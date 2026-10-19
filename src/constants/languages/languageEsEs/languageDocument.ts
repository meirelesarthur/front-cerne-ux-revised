// src/constants/languages/languageEsEs/languageDocument.ts
// Traducción ES-ES del módulo COMPARTIDO de Documentos Adjuntos (Document —
// Financiero, ejecución 036, TASK-FE-036-337/338). Namespace AISLADO —
// consumido por Cuentas por Cobrar Y Cuentas por Pagar (Tarea 339).

import { ModuleDocument } from '@/@types/language/module-document';

export const languageDocument: ModuleDocument = {
  panel: {
    title: 'Documentos Adjuntos',

    list: {
      columns: {
        description: 'Descripción',
        date: 'Fecha',
      },
      downloadLabel: 'Descargar',
      removeAction: 'Eliminar',
      removeConfirmTitle: 'Eliminar documento',
      removeConfirmDescription:
        '¿Eliminar este documento de este título? Puede estar vinculado a otros títulos y seguir disponible en ellos.',
      removedToast: 'Documento eliminado de este título.',
      emptyState: {
        title: 'Ningún documento adjunto',
        description: 'Este título aún no tiene ningún documento adjunto.',
      },
    },

    upload: {
      sectionTitle: 'Agregar Documento',
      fields: {
        description: 'Descripción',
        date: 'Fecha del Documento',
      },
      placeholders: {
        description: 'Describa el documento',
      },
      submitButton: 'Agregar Documento',
      uploadedToast: 'Documento agregado con éxito.',
      fileUpload: {
        label: 'Archivo (PDF)',
        hint: 'Solo PDF, hasta 2MB.',
        dropzoneTitle: 'Arrastre un archivo o haga clic para seleccionar',
        dropzoneDraggingTitle: 'Suelte el archivo aquí',
        changeLabel: 'Cambiar archivo',
        removeLabel: 'Eliminar archivo',
        errorTypeMessage: 'Solo se aceptan archivos PDF.',
        errorSizeMessage: 'El archivo excede el tamaño máximo de 2MB.',
      },
      validation: {
        descriptionRequired: 'La descripción es obligatoria.',
        descriptionMaxLength: 'La descripción debe tener como máximo 50 caracteres.',
      },
    },
  },
};
