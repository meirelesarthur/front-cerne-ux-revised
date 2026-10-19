// src/constants/languages/languageEnUs/languageFeedlotYards.ts
// EN-US translation of the OPERATIONAL module — FeedlotYard (Pátio) — own
// domain, TASK-PT-FE-01/02 (execution 046). Mirror `languageFeedlotYards`
// (pt-BR). `singularLabel`/`pluralLabel` also feed the CANONICAL query-key
// (derived from translation, in English) — see `src/constants/query-key.ts`.

import { ModuleFeedlotYards } from '@/@types/language/module-feedlot-yards';

export const languageFeedlotYards: ModuleFeedlotYards = {
  feedlotYard: {
    singularLabel: 'FeedlotYard',
    pluralLabel: 'FeedlotYards',
    list: {
      pageTitle: 'Feedlot Yards',
      pageSubtitle: 'Feedlot yards registry.',
      deletedToast: 'Feedlot yard deleted successfully',
      table: {
        code: 'Code',
        name: 'Name',
        area: 'Area (m²)',
        active: 'Status',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No feedlot yard registered.',
        descriptionEmpty: 'Start by adding your first feedlot yard.',
        titleEmptyNoCreate: 'No feedlot yard registered.',
        descriptionEmptyNoCreate: 'You do not have permission to create a new feedlot yard.',
        titleFiltered: 'No feedlot yard found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Feedlot Yard',
      },
    },
    filter: {
      title: 'Filter feedlot yards',
      code: 'Code',
      codePlaceholder: 'Search by code',
      name: 'Name',
      namePlaceholder: 'Search by name',
      isActive: 'Status',
      isActiveAll: 'All',
    },
    detail: {
      generalData: { title: 'General Data' },
      fields: {
        code: 'Code',
        name: 'Name',
        priority: 'Order',
        width: 'Width',
        length: 'Length',
        area: 'Area (m²)',
        observation: 'Observation',
        active: 'Status',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
      },
      actions: { edit: 'Edit', back: 'Back' },
      notFound: {
        title: 'Feedlot yard not found.',
        description: 'Check the accessed link or go back to the list.',
        back: 'Back to the list',
      },
    },
    form: {
      title: { create: 'New Feedlot Yard', edit: 'Edit Feedlot Yard' },
      fields: {
        code: 'Code',
        name: 'Name',
        width: 'Width',
        length: 'Length',
        area: 'Area (m²)',
        isActive: 'Active',
        observation: 'Observation',
      },
      placeholders: {
        name: 'Enter the feedlot yard name',
        width: 'Width in meters',
        length: 'Length in meters',
      },
      hints: {
        codeGenerated: 'Automatically generated',
      },
      validation: {
        nameRequired: 'Name is required.',
        nameMaxLength: 'Name must be at most 120 characters.',
        widthRequired: 'Width is required.',
        widthMin: 'Width cannot be negative.',
        lengthRequired: 'Length is required.',
        lengthMin: 'Length cannot be negative.',
        isActiveRequired: 'Status is required.',
        observationMaxLength: 'Observation must be at most 600 characters.',
      },
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
    },
    dialog: {
      noChangesToast: 'Nothing to save — no changes were made.',
      loadError: {
        message: 'Unable to load this yard data.',
        retry: 'Try again',
      },
    },
  },
};
