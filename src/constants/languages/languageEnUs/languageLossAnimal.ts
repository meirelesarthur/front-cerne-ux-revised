// src/constants/languages/languageEnUs/languageLossAnimal.ts
// EN-US translation of the LOSS ANIMAL module (Operational / Livestock).

import { ModuleLossAnimals } from '@/@types/language/module-loss-animals';

export const languageLossAnimal: ModuleLossAnimals = {
  lossAnimal: {
    singularLabel: 'Loss',
    pluralLabel: 'Losses',
    titleModule: 'Losses',
    detailTitle: 'Loss Details',
    list: {
      pageTitle: 'Losses',
      pageSubtitle: 'Manage the animal loss records for the active farm.',
      deletedToast: 'Loss deleted successfully',
      table: {
        code: 'Code',
        animal: 'Animal',
        category: 'Category',
        cause: 'Cause',
        date: 'Date',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No losses registered.',
        descriptionEmpty: 'Start by adding your first loss record.',
        titleEmptyNoCreate: 'No losses available.',
        descriptionEmptyNoCreate:
          'There are no losses registered yet. Contact the platform administrator.',
        cta: 'New Loss',
      },
      deleteConfirm: {
        title: 'Delete loss',
        description: 'Are you sure you want to delete this loss record',
        warning: 'This deletion is permanent and cannot be undone.',
      },
      deleteBusinessError:
        'This record is linked to another table and can only be deleted after removing the link.',
    },
    filter: {
      title: 'Filter Losses',
      animal: 'Animal',
      cause: 'Cause',
      startDate: 'Start date',
      endDate: 'End date',
    },
    form: {
      title: {
        create: 'New Loss',
        edit: 'Edit Loss',
      },
      fields: {
        code: 'Code',
        codePlaceholder: 'Generated on save',
        date: 'Date',
        responsible: 'Responsible',
        batch: 'Batch',
        animal: 'Animal',
        cause: 'Cause',
        note: 'Note',
      },
      placeholders: {
        batch: 'Select the batch',
        animal: 'Search by identification',
        cause: 'Select the cause',
        note: 'Optional note',
      },
      validation: {
        dateRequired: 'Date is required',
        animalRequired: 'Select an animal',
        causeRequired: 'Select a cause',
        checkDate: {
          animalEntryAfterLossDate: 'The animal entry date is more recent than the loss date.',
          batchCreationAfterMovementDate:
            'The batch/area creation date is more recent than the movement date.',
        },
      },
    },
  },
};
