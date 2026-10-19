// src/constants/languages/languageEnUs/languageDeathAnimals.ts
// EN-US translation of the OPERATIONAL — Deaths (DeathAnimal) module —
// TASK-DA-FE-01/02. Mirror `languageFeedlotSectors`, with this feature's own
// fields.

import { ModuleDeathAnimals } from '@/@types/language/module-death-animals';

export const languageDeathAnimals: ModuleDeathAnimals = {
  deathAnimal: {
    singularLabel: 'Death',
    pluralLabel: 'Deaths',
    list: {
      pageTitle: 'Deaths',
      pageSubtitle: 'Record of herd animal deaths.',
      deletedToast: 'Death record deleted successfully',
      table: {
        code: 'Code',
        animal: 'Animal',
        animalEmpty: 'No animal',
        cause: 'Cause',
        date: 'Date',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No death records yet.',
        descriptionEmpty: 'Start by registering the first death.',
        titleEmptyNoCreate: 'No death records yet.',
        descriptionEmptyNoCreate: 'You do not have permission to register a new death.',
        titleFiltered: 'No death records found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Death',
      },
    },
    filter: {
      title: 'Filter deaths',
      animalIdentification: 'Animal Identification',
      animalIdentificationPlaceholder: 'Search by identification',
      cause: 'Cause',
      causePlaceholder: 'Select the cause',
      startDate: 'Start date',
      endDate: 'End date',
    },
    detail: {
      generalData: { title: 'General Data' },
      fields: {
        code: 'Code',
        date: 'Date',
        userName: 'Responsible Employee',
        batch: 'Batch',
        batchEmpty: 'No batch',
        animal: 'Animal',
        animalEmpty: 'No animal',
        cause: 'Cause',
        note: 'Note',
        noteEmpty: 'No note',
      },
      actions: { edit: 'Edit', back: 'Back' },
      notFound: {
        title: 'Death record not found.',
        description: 'Check the link or go back to the list.',
        back: 'Back to list',
      },
    },
    form: {
      title: { create: 'New Death', edit: 'Edit Death' },
      fields: {
        photo: 'Photo',
        code: 'Code',
        date: 'Date',
        userName: 'Responsible Employee',
        batch: 'Batch',
        animal: 'Animal',
        cause: 'Cause',
        note: 'Note',
      },
      placeholders: {
        batch: 'Select the batch',
        animal: 'Select the animal',
        cause: 'Select the cause',
      },
      hints: {
        codeGeneratedOnSave: 'Generated automatically',
        photoAccepted: 'Accepted formats: JPEG, PNG, GIF.',
        photoMaxSize: 'Maximum size: 2MB.',
      },
      image: {
        dropzoneTitle: 'Drag an image or click to select',
        dropzoneDragging: 'Drop the image here',
        changeLabel: 'Change image',
        removeLabel: 'Remove image',
        errorType: 'File type not accepted.',
        errorSize: 'File exceeds the maximum size.',
      },
      validation: {
        dateRequired: 'Date is required.',
        batchRequired: 'Batch is required.',
        animalRequired: 'Animal is required.',
        causeRequired: 'Cause is required.',
      },
      dateWarning: { title: 'Death date' },
    },
  },
};
