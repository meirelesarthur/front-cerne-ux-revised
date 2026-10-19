// src/constants/languages/languageEnUs/languageProtocolSeason.ts
// EN-US translation of the "Protocols/Season" module (ProtocolSeason —
// Operational / Reproduction, F-057, execution 040, TASK-FE-1050..1059).

import { ModuleProtocolSeason } from '@/@types/language/module-protocol-season';

export const languageProtocolSeason: ModuleProtocolSeason = {
  protocolSeason: {
    singularLabel: 'Protocol/Season',
    pluralLabel: 'Protocols/Season',
    titleModule: 'Protocols/Season',
    list: {
      pageTitle: 'Protocols/Season',
      pageSubtitle: 'Manage the registered season protocols.',
      deletedToast: 'Protocol/Season deleted successfully',
      newButton: 'New Protocol',
      table: {
        code: 'Code',
        name: 'Name',
        date: 'Date',
        responsible: 'Responsible',
        breedingSeason: 'Breeding Season',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No protocol/season registered.',
        descriptionEmpty: 'Start by registering a new season protocol.',
        titleFiltered: 'No records found.',
        descriptionFiltered: 'Try adjusting the filters.',
        cta: 'New Protocol',
      },
      filter: {
        title: 'Filter Protocols/Season',
        name: 'Name',
        namePlaceholder: 'Filter by name',
        responsible: 'Responsible',
        breedingSeason: 'Breeding Season',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
      deleteDialog: {
        title: 'Delete protocol/season?',
        description: 'will be permanently deleted.',
        warning: 'This action cannot be undone.',
      },
      deleteBusinessErrorToast: {
        title: 'Cannot delete',
        description: 'There are matings linked to this protocol.',
      },
    },
    detail: {
      title: 'Protocol/Season',
      backButton: 'Back',
      editButton: 'Edit',
      sections: {
        generalData: 'General Data',
        timeline: 'Timeline',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        responsible: 'Responsible',
        breedingSeason: 'Breeding Season',
        name: 'Name',
        description: 'Description',
      },
      notFound: {
        title: 'Protocol/Season not found.',
        description: 'The record may have been deleted or the link is incorrect.',
      },
      invalidParamsToast: {
        title: 'Protocol/Season',
        description: 'Invalid parameters to display the detail.',
      },
    },
    form: {
      title: {
        create: 'New Protocol/Season',
        edit: 'Edit Protocol/Season',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        responsible: 'Responsible',
        breedingSeason: 'Breeding Season',
        name: 'Name',
        description: 'Description',
      },
      validation: {
        dateRequired: 'Enter the date',
        breedingSeasonRequired: 'Enter the breeding season',
        nameRequired: 'Enter the name',
        itemDateRequired: 'Enter the item date',
        itemTimeRequired: 'Enter the item time',
        productOrServiceRequired: 'Select a product OR a service',
        measurementRequired: 'Enter the measurement unit',
        quantityRequired: 'Enter a valid quantity',
        quantityExceedsStock: 'Quantity greater than the available stock balance',
        itemsMinOne: 'Add at least one item',
        itemDateBeforeDzero: 'The date cannot be before the first application (DZERO)',
      },
      items: {
        sectionTitle: 'Protocol Items',
        fields: {
          identification: 'Identification',
          date: 'Date',
          time: 'Time',
          warehouse: 'Warehouse',
          product: 'Product',
          service: 'Service',
          measurement: 'Measurement Unit',
          stock: 'Stock',
          quantity: 'Quantity',
        },
        addButton: 'Add item',
        removeButton: 'Remove',
        removeDialog: {
          title: 'Remove item?',
          description: 'This item will be removed from the protocol.',
          confirmButton: 'Remove',
        },
      },
      timelinePreview: {
        title: 'Timeline Preview',
        empty: 'Add items to preview the timeline.',
      },
      unsavedChangesDialog: {
        title: 'Leave without saving?',
        description: 'There are unsaved changes in this form that will be lost',
        confirmButton: 'Leave without saving',
      },
    },
    timeline: {
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      emptyState: {
        title: 'No items in the timeline',
        description: 'This protocol does not have registered items yet.',
      },
      andSeparator: ' + ',
    },
    services: {
      insemination: 'Insemination',
      ultrasound: 'Ultrasound',
      pregnancyDiagnosis: 'Pregnancy Diagnosis',
      implantRemoval: 'Implant Removal',
    },
  },
};
