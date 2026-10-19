// src/constants/languages/languageEnUs/languageSeparations.ts
// EN-US translation of the SEPARATION module (Operational > Livestock).
// Namespace `separations` — FREE (frontend-contract-apartacao.md §1).

import { ModuleSeparations } from '@/@types/language/module-separations';

export const languageSeparations: ModuleSeparations = {
  separation: {
    singularLabel: 'Separation',
    pluralLabel: 'Separations',
    list: {
      pageTitle: 'Separation',
      pageSubtitle: 'Manage the farm batch separations.',
      deletedToast: 'Separation deleted successfully.',
      table: {
        code: 'Code',
        date: 'Date',
        employeeName: 'Employee',
        batchCount: 'Batches',
        animalCount: 'Animals',
        processingStatus: {
          processed: 'Processed',
          pending: 'Pending',
        },
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      helpVideo: 'Help video',
      helpVideoComingSoon: 'Coming soon',
      emptyState: {
        titleEmpty: 'No separations registered.',
        descriptionEmpty: 'Start by adding the first separation.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters.',
      },
      error: {
        message: 'Could not load the data.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter separations',
      batch: 'Batch',
    },
    deleteDialog: {
      title: 'Confirm deletion',
      descriptionTemplate:
        'Separation {code} will be permanently deleted. This action cannot be undone.',
    },
    detail: {
      pageTitleTemplate: 'Separation {code}',
      notFound: {
        title: 'Separation not found.',
        description: 'The requested separation does not exist or has been removed.',
        back: 'Back to the list',
      },
      sections: {
        header: 'Header',
        batches: 'Batches',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        employeeName: 'Employee',
      },
      batchesTable: {
        description: 'Batch',
        empty: 'No batches linked.',
      },
      backButton: 'Back',
    },
    form: {
      title: {
        create: 'New Separation',
        edit: 'Edit Separation',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        batches: 'Batches',
      },
      placeholders: {
        batches: 'Select the batches',
      },
      hints: {
        codeGeneratedOnSave: 'Generated on save',
      },
      validation: {
        dateRequired: 'Date is required.',
        batchesRequired: 'Select at least one batch.',
        batchesMin: 'Select at least one batch.',
      },
      batchDateWarning: {
        title: 'Date consistency warning',
        itemTemplate: '{description} (date {date})',
        description: 'The following batches have a date that diverges from the separation: {list}',
      },
    },
  },
};
