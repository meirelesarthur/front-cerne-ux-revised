// src/constants/languages/languageEnUs/languageMaintenancePreventives.ts
// EN-US translation of the Fleet Management — Preventive Maintenances
// (MaintenancePreventive) module — own domain, Tasks 43/44 (pipeline 010).

import { ModuleMaintenancePreventives } from '@/@types/language/module-maintenance-preventives';

export const languageMaintenancePreventives: ModuleMaintenancePreventives = {
  maintenancePreventive: {
    singularLabel: 'Preventive Maintenance',
    pluralLabel: 'Preventive Maintenances',
    list: {
      pageTitle: 'Preventive Maintenances',
      pageSubtitle: 'Fleet preventive maintenances by equipment.',
      deletedToast: 'Preventive maintenance removed successfully',
      table: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        actions: 'Actions',
      },
      itemsTable: {
        equipment: 'Equipment',
        date: 'Review Date',
        message: 'Service',
        hourMeterKm: 'Hour Meter/Km',
        note: 'Note',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      filter: {
        title: 'Filter preventive maintenances',
        equipment: 'Equipment',
        equipmentPlaceholder: 'Search equipment',
        startDate: 'Start date',
        endDate: 'End date',
      },
      emptyState: {
        title: 'No preventive maintenance registered.',
        description: 'Start by adding your first preventive maintenance.',
        titleFiltered: 'No preventive maintenance found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'Add New',
      },
      errorState: {
        title: 'Could not load preventive maintenances.',
        description: 'Check your connection and try again.',
        retry: 'Try again',
      },
    },
    form: {
      title: {
        create: 'New Preventive Maintenance',
        edit: 'Edit Preventive Maintenance',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        user: 'User',
      },
      items: {
        title: 'Items',
        addItem: 'Add Item',
        removeItem: 'Remove',
        emptyRow: 'No item added.',
        fields: {
          equipment: 'Equipment',
          message: 'Service',
          date: 'Review Date',
          hourMeterKm: 'Hour Meter/Km',
          note: 'Note',
        },
        placeholders: {
          equipment: 'Search equipment',
          message: 'Describe the service',
        },
      },
      errors: {
        invalidFields: 'Review the highlighted fields.',
        equipmentRequired: 'Select the equipment.',
        messageRequired: 'Enter the service.',
      },
    },
    detail: {
      sections: {
        header: 'Identification',
        items: 'Items',
      },
      fields: {
        code: 'Code',
        date: 'Date',
        requester: 'Requester',
        user: 'User',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
      },
      notFound: {
        title: 'Preventive maintenance not found.',
        description: 'Check if it still exists.',
        back: 'Back to list',
      },
    },
  },
};
