// src/constants/languages/languageEnUs/languageBonuses.ts
// English translation of the EVENT REGISTRATION module (Bonus —
// Administrative). Esteira 037 — core CRUD only (no installments/financial
// dimension, out of the real Bonus contract).

import { ModuleBonuses } from '@/@types/language/module-bonuses';

export const languageBonuses: ModuleBonuses = {
  bonus: {
    singularLabel: 'Event Registration',
    pluralLabel: 'Event Registrations',
    list: {
      pageTitle: 'Event Registrations',
      pageSubtitle: 'Manage bonus events registered for employees.',
      deletedToast: 'Event registration removed successfully',
      table: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
        actions: 'Actions',
      },
      actions: {
        view: 'View event registration',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No event registrations found.',
        descriptionEmpty: 'Start by adding the first event registration.',
        cta: 'New Event Registration',
      },
    },
    detail: {
      generalData: {
        title: 'General Data',
      },
      fields: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Event registration not found',
        description:
          'The requested event registration does not exist, was removed, or belongs to another farm.',
        back: 'Back to Event Registrations',
      },
    },
    form: {
      title: {
        create: 'New Event Registration',
        edit: 'Edit Event Registration',
      },
      fields: {
        employee: 'Employee',
        event: 'Event',
        date: 'Date',
        amount: 'Amount',
      },
      validation: {
        employeeRequired: 'Select the employee',
        eventRequired: 'Select the event',
        dateRequired: 'Date is required',
        amountRequired: 'Enter a valid amount',
      },
    },
  },
};
