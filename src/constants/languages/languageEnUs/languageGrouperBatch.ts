// src/constants/languages/languageEnUs/languageGrouperBatch.ts
// EN-US translation of the Group/Batches module (GrouperBatch, execution 042,
// TASK-FE-042-301). Same key set as the PT-BR/ES-ES counterparts.

import { ModuleGrouperBatch } from '@/@types/language/module-grouper-batch';

export const languageGrouperBatch: ModuleGrouperBatch = {
  grouperBatch: {
    singularLabel: 'Batch',
    pluralLabel: 'Batches',
    list: {
      pageTitle: 'Group Batches',
      pageSubtitle: 'Select 2 or more active batches to group into one main batch.',
      table: {
        code: 'Code',
        description: 'Description',
        totalAnimals: 'Total Animals',
      },
      emptyState: {
        titleEmpty: 'No active batch registered.',
        titleFiltered: 'No results found.',
        descriptionEmpty: 'Start by adding the first batch.',
        descriptionFiltered: 'Try adjusting or removing the current filters.',
        cta: 'New Batch',
      },
      filter: {
        title: 'Filter Batches',
        search: 'Search by description',
      },
    },
    group: {
      buttonLabel: 'Group',
      selectAtLeastTwoAlert: 'Select at least 2 batches to group.',
      alertTitle: 'Group Batches',
      modalTitle: 'Group Batches',
      modalPrimaryLabel: 'Select the batch that will be the main one.',
      columns: {
        code: 'Code',
        description: 'Description',
        totalAnimals: 'Total Animals',
      },
      cancelButton: 'Cancel',
      confirmButton: 'Group',
      successToast: 'Batches grouped successfully',
      previewErrorTitle: 'Group Batches',
      previewErrorToast: 'Could not load the selected batches.',
    },
    newBatch: {
      title: 'New Batch',
      fields: {
        date: 'Date',
        parameterWeight: 'Weight',
        specie: 'Species',
        categories: 'Categories',
        description: 'Description',
      },
      cancelButton: 'Cancel',
      submitButton: 'Save',
      createdToast: 'Batch created successfully',
    },
  },
};
