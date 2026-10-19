// src/constants/languages/languageEnUs/languageFeedlotSectors.ts
// EN-US translation of the OPERATIONAL module — FeedlotSector (Setor) — own
// domain, TASK-FS-FE-01/02. Mirror `languageFeedlotYards`. `singularLabel`/
// `pluralLabel` also feed the CANONICAL query-key (derived from
// translation, in English) — see `src/constants/query-key.ts`.

import { ModuleFeedlotSectors } from '@/@types/language/module-feedlot-sectors';

export const languageFeedlotSectors: ModuleFeedlotSectors = {
  feedlotSector: {
    singularLabel: 'FeedlotSector',
    pluralLabel: 'FeedlotSectors',
    list: {
      pageTitle: 'Feedlot Sectors',
      pageSubtitle: 'Feedlot sectors registry.',
      deletedToast: 'Feedlot sector deleted successfully',
      table: {
        code: 'Code',
        name: 'Name',
        feedlotYard: 'Feedlot Yard',
        area: 'Area (m²)',
        createdAt: 'Created at',
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
        titleEmpty: 'No feedlot sector registered.',
        descriptionEmpty: 'Start by adding your first feedlot sector.',
        titleEmptyNoCreate: 'No feedlot sector registered.',
        descriptionEmptyNoCreate: 'You do not have permission to create a new feedlot sector.',
        titleFiltered: 'No feedlot sector found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Feedlot Sector',
      },
    },
    filter: {
      title: 'Filter feedlot sectors',
      code: 'Code',
      codePlaceholder: 'Search by code',
      name: 'Name',
      namePlaceholder: 'Search by name',
      feedlotYard: 'Feedlot Yard',
      feedlotYardPlaceholder: 'Search by feedlot yard',
      isActive: 'Status',
      isActiveAll: 'All',
    },
    detail: {
      generalData: { title: 'General Data' },
      fields: {
        code: 'Code',
        name: 'Name',
        feedlotYard: 'Feedlot Yard',
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
        title: 'Feedlot sector not found.',
        description: 'Check the accessed link or go back to the list.',
        back: 'Back to the list',
      },
    },
    form: {
      title: { create: 'New Feedlot Sector', edit: 'Edit Feedlot Sector' },
      fields: {
        code: 'Code',
        name: 'Name',
        feedlotYard: 'Feedlot Yard',
        width: 'Width (m)',
        length: 'Length (m)',
        area: 'Total Area (m²)',
        isActive: 'Status',
        observation: 'Observation',
      },
      placeholders: {
        feedlotYard: 'Select the feedlot yard',
        width: 'Width in meters',
        length: 'Length in meters',
      },
      hints: {
        codeGenerated: 'Automatically generated',
      },
      validation: {
        nameRequired: 'Name is required.',
        nameMaxLength: 'Name must be at most 120 characters.',
        feedlotYardRequired: 'Feedlot yard is required.',
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
        message: 'Unable to load this sector data.',
        retry: 'Try again',
      },
    },
  },
};
