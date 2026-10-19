// src/constants/languages/languageEnUs/languageEventos.ts
// EN-US translation of the EVENTS module (Administrative / People Management).

import { ModuleEvents } from '@/@types/language/module-events';

export const languageEventos: ModuleEvents = {
  event: {
    singularLabel: 'Event',
    pluralLabel: 'Events',
    list: {
      pageTitle: 'Events',
      pageSubtitle: 'Manage the event catalog (payroll rubrics).',
      deletedToast: 'Event removed successfully',
      table: {
        name: 'Name',
        type: 'Periodicity',
        method: 'Method',
        condition: 'Condition',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No events registered.',
        descriptionEmpty: 'Start by adding the first event.',
        titleFiltered: 'No events found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Event',
      },
      error: {
        message: 'Could not load the events.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter events',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      dateFrom: 'Registration date (from)',
      dateTo: 'Registration date (to)',
      dateRangeInvalid: 'The end date cannot be earlier than the start date.',
    },
    deleteBlocked: {
      title: 'Cannot delete',
      description:
        'There are records linked to this event. Remove or reassign the links below before deleting',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        earning_event: 'Linked earning(s)',
        employee_events: 'Linked employee(s)',
        absences: 'Linked absence(s)',
        bonuses: 'Linked bonus(es)',
        advances: 'Linked advance(s)',
      },
    },
    typeOptions: {
      weekly: 'Weekly',
      biweekly: 'Biweekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semiannual: 'Semiannual',
      annual: 'Annual',
    },
    methodOptions: {
      informed: 'Informed',
      fixed: 'Fixed',
    },
    conditionOptions: {
      sum: 'Adds',
      decrease: 'Deducts',
    },
    form: {
      title: { create: 'New Event', edit: 'Edit Event' },
      subtitle: {
        create: 'Register a new event (payroll rubric).',
        edit: 'Update the event data.',
      },
      fields: {
        name: 'Name',
        type: 'Periodicity',
        method: 'Method',
        condition: 'Condition',
        isEnabled: 'Active',
      },
      placeholders: {
        name: 'E.g.: Family Salary',
      },
      validation: {
        nameMaxLength: 'The name must be at most 30 characters',
      },
    },
  },
};
