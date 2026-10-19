// src/constants/languages/languageEnUs/languageBreedingSeasons.ts
// EN-US translation of the "Breeding Season" module (BreedingSeason —
// Operational / Reproduction, 97-Esteiras/003, Tasks 12/13).

import { ModuleBreedingSeasons } from '@/@types/language/module-breeding-seasons';

export const languageBreedingSeasons: ModuleBreedingSeasons = {
  breedingSeason: {
    singularLabel: 'Breeding Season',
    pluralLabel: 'Breeding Seasons',
    titleModule: 'Breeding Season',
    list: {
      pageTitle: 'Breeding Season',
      pageSubtitle: 'Manage the registered breeding seasons.',
      deletedToast: 'Breeding season deleted successfully',
      newButton: 'New Breeding Season',
      table: {
        code: 'Code',
        date: 'Registration Date',
        startDate: 'Start Date',
        endDate: 'End Date',
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
        titleEmpty: 'No breeding season recorded.',
        descriptionEmpty: 'Start by registering a new breeding season.',
        titleFiltered: 'No record found.',
        descriptionFiltered: 'Try adjusting the filters.',
        cta: 'New Breeding Season',
      },
      filter: {
        title: 'Filter Breeding Seasons',
        responsible: 'Responsible',
      },
      deleteDialog: {
        title: 'Delete breeding season?',
        description: 'will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
    },
    detail: {
      title: 'Breeding Season',
      backButton: 'Back',
      editButton: 'Edit',
      stats: {
        days: 'Days',
        weeks: 'Weeks',
      },
      sections: {
        generalData: 'General Data',
      },
      fields: {
        code: 'Code',
        date: 'Registration Date',
        startDate: 'Start Date',
        endDate: 'End Date',
        responsible: 'Responsible',
        description: 'Description',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      notFound: {
        title: 'Breeding season not found.',
        description: 'The record may have been deleted or the link is incorrect.',
      },
      invalidParamsToast: {
        title: 'Breeding Season',
        description: 'Invalid parameters to display the details.',
      },
    },
    form: {
      title: {
        create: 'New Breeding Season',
        edit: 'Edit Breeding Season',
      },
      fields: {
        code: 'Code',
        responsible: 'Responsible',
        date: 'Registration Date',
        description: 'Description',
        startDate: 'Start Date',
        endDate: 'End Date',
        daysPreview: 'Days',
        weeksPreview: 'Weeks',
      },
      validation: {
        dateRequired: 'Enter the date',
        descriptionRequired: 'Enter the description',
        startDateRequired: 'Enter the start date',
        endDateRequired: 'Enter the end date',
        endDateBeforeStartDate: 'Start date cannot be later than the end date',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Leave without saving',
      },
    },
    chart: {
      title: 'Days per month',
      empty: 'No data for the informed period.',
    },
  },
};
