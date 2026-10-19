// src/constants/languages/languageEnUs/languageBreedingBatch.ts
// EN-US translation of the "Breeding Batch" module (BreedingBatch —
// Operational / Reproduction, 97-Esteiras/048, Tasks 04/05/06/07).

import { ModuleBreedingBatch } from '@/@types/language/module-breeding-batch';

export const languageBreedingBatch: ModuleBreedingBatch = {
  breedingBatch: {
    singularLabel: 'Breeding Batch',
    pluralLabel: 'Breeding Batches',
    titleModule: 'Breeding Batches',
    list: {
      pageTitle: 'Breeding Batches',
      pageSubtitle: 'Manage the registered breeding batches.',
      deletedToast: 'Breeding batch deleted successfully',
      newButton: 'New Batch',
      table: {
        code: 'Code',
        date: 'Date',
        responsible: 'Responsible',
        description: 'Description',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No breeding batch recorded.',
        descriptionEmpty: 'Start by registering a new breeding batch.',
        titleFiltered: 'No record found.',
        descriptionFiltered: 'Try adjusting the filters.',
        cta: 'New Batch',
      },
      filter: {
        title: 'Filter Breeding Batches',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      deleteDialog: {
        title: 'Delete breeding batch?',
        description: 'will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
    },
    detail: {
      title: 'Breeding Batch',
      backButton: 'Back',
      editButton: 'Edit',
      sections: {
        generalData: 'General Data',
        linkedBatches: 'Linked Batches',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        description: 'Description',
        responsible: 'Responsible',
        breedingSeason: 'Breeding Season',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      notFound: {
        title: 'Breeding batch not found.',
        description: 'The record may have been deleted or the link is incorrect.',
      },
      invalidParamsToast: {
        title: 'Breeding Batch',
        description: 'Invalid parameters to display the details.',
      },
      linkedBatchesTable: {
        code: 'Code',
        description: 'Description',
      },
      linkedBatchesEmpty: 'No linked batches.',
    },
    form: {
      title: {
        create: 'New Breeding Batch',
        edit: 'Edit Breeding Batch',
      },
      fields: {
        code: 'Code',
        responsible: 'Responsible',
        date: 'Date',
        description: 'Description',
        breedingSeason: 'Breeding Season',
        batches: 'Batches',
        addBatchButton: 'Add Batch',
        removeBatchButton: 'Remove',
      },
      validation: {
        dateRequired: 'Enter the date',
        descriptionRequired: 'Enter the description',
        breedingSeasonRequired: 'Enter the breeding season',
        batchesMinRequired: 'Add at least one batch',
        batchRequired: 'Select a batch',
        batchDuplicate: 'This batch was already selected in another line',
        batchInvalidDate: 'The batch creation date is more recent than the breeding batch date',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Leave without saving',
      },
    },
  },
};
