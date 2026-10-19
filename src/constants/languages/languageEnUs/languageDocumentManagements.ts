// src/constants/languages/languageEnUs/languageDocumentManagements.ts
// English (US) translation of the "Documentos" module (DocumentManagement —
// Administrativo / Gestão Documentos, Tasks 12/13). Sibling module of
// `documentTypes` (same menu group). See
// `@/@types/language/module-base-registrations` for the full contract
// (`documentManagements`).

import type { ModuleBaseRegistrations } from '@/@types/language/module-base-registrations';

export const languageDocumentManagements: ModuleBaseRegistrations['documentManagements'] = {
  singularLabel: 'Document',
  pluralLabel: 'Documents',

  list: {
    pageTitle: 'Documents',
    pageSubtitle: 'Manage the farm documents and certificates.',
    deletedToast: 'Document removed successfully',
    table: {
      code: 'Code',
      description: 'Description',
      documentType: 'Document Type',
      validity: 'Validity',
      alertDays: 'Alert Days',
      actions: 'Actions',
    },
    actions: {
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
    },
    emptyState: {
      titleEmpty: 'No document registered.',
      descriptionEmpty: 'Start by adding the first document.',
      titleEmptyNoCreate: 'No document registered.',
      descriptionEmptyNoCreate: 'No document has been registered yet.',
      titleFiltered: 'No document found.',
      descriptionFiltered: 'Adjust the filters to find what you are looking for.',
      cta: 'New Document',
    },
    error: {
      message: 'Unable to load the Documents list.',
      retry: 'Try again',
    },
    deleteConfirm: {
      title: 'Delete document',
      description: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    },
  },

  filter: {
    title: 'Filter Documents',
    documentType: 'Document Type',
    documentTypeAll: 'All',
    startDate: 'Validity from',
    endDate: 'Validity to',
    dateRangeInvalid: 'End date must be greater than or equal to the start date',
  },

  form: {
    title: {
      create: 'New Document',
      edit: 'Edit Document',
      view: 'View Document',
    },
    subtitle: {
      create: 'Register a new document.',
      edit: 'Edit the selected document data.',
    },
    fields: {
      code: 'Code',
      documentType: 'Document Type',
      description: 'Description',
      validity: 'Validity',
      alertDays: 'Alert Days',
      observation: 'Observation',
      attachmentName: 'Attachment Description',
      attachmentFile: 'File',
    },
    placeholders: {
      documentType: 'Select the Document Type',
    },
    hints: {
      codeGenerated: 'Generated automatically on save',
    },
    sections: {
      attachments: 'Attachments',
    },
    validation: {
      documentTypeRequired: 'Document Type is required',
      descriptionRequired: 'Description is required',
      descriptionMaxLength: 'Description must be at most 100 characters',
      observationMaxLength: 'Observation must be at most 200 characters',
      attachmentNameMaxLength: 'Attachment Description must be at most 255 characters',
    },
    toasts: {
      createSuccess: 'Document created successfully.',
      updateSuccess: 'Document updated successfully.',
    },
  },

  attachmentRow: {
    addButton: '+ Add item',
    removeButton: 'Remove',
    emptyLabel: 'No attachment added',
    defaultName: 'Not Informed',
    dropzoneTitle: 'Drag a file or click to select',
    dropzoneDragging: 'Drop the file here',
    changeLabel: 'Change file',
    clearFileLabel: 'Clear selection',
    replaceLabel: 'Replace file',
    existingFileLabel: 'Current attachment',
    errorType: 'Format not accepted.',
    errorSize: 'File exceeds the maximum size of 10 MB.',
  },
};
