// src/constants/languages/languageEnUs/languageDocument.ts
// EN-US translation of the SHARED Attached Documents module (Document —
// Financial, execution 036, TASK-FE-036-337/338). ISOLATED namespace —
// consumed by both Accounts Receivable AND Accounts Payable (Task 339).

import { ModuleDocument } from '@/@types/language/module-document';

export const languageDocument: ModuleDocument = {
  panel: {
    title: 'Attached Documents',

    list: {
      columns: {
        description: 'Description',
        date: 'Date',
      },
      downloadLabel: 'Download',
      removeAction: 'Remove',
      removeConfirmTitle: 'Remove document',
      removeConfirmDescription:
        'Remove this document from this title? It may be linked to other titles and remain available there.',
      removedToast: 'Document removed from this title.',
      emptyState: {
        title: 'No attached documents',
        description: 'This title has no attached documents yet.',
      },
    },

    upload: {
      sectionTitle: 'Add Document',
      fields: {
        description: 'Description',
        date: 'Document Date',
      },
      placeholders: {
        description: 'Describe the document',
      },
      submitButton: 'Add Document',
      uploadedToast: 'Document added successfully.',
      fileUpload: {
        label: 'File (PDF)',
        hint: 'PDF only, up to 2MB.',
        dropzoneTitle: 'Drag a file or click to select',
        dropzoneDraggingTitle: 'Drop the file here',
        changeLabel: 'Change file',
        removeLabel: 'Remove file',
        errorTypeMessage: 'Only PDF files are accepted.',
        errorSizeMessage: 'File exceeds the maximum size of 2MB.',
      },
      validation: {
        descriptionRequired: 'Description is required.',
        descriptionMaxLength: 'Description must be at most 50 characters.',
      },
    },
  },
};
