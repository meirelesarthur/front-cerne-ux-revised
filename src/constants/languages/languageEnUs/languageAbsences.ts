// src/constants/languages/languageEnUs/languageAbsences.ts
// EN-US translation of the "Absence Record" module (Absence — Administrative
// / Personnel Management, 97-Esteiras/003, Tasks 12/13).

import { ModuleAbsences } from '@/@types/language/module-absences';

export const languageAbsences: ModuleAbsences = {
  absence: {
    singularLabel: 'Absence',
    pluralLabel: 'Absences',
    titleModule: 'Absence Record',
    list: {
      pageTitle: 'Absence Record',
      pageSubtitle: 'Manage the absences recorded for employees.',
      deletedToast: 'Absence deleted successfully',
      table: {
        date: 'Date',
        employee: 'Employee',
        event: 'Event',
        amount: 'Amount',
        period: 'Period',
        actions: 'Actions',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No absence recorded.',
        descriptionEmpty: 'Start by recording an absence for an employee.',
        titleFiltered: 'No absence found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Absence',
      },
      filter: {
        title: 'Filter Absences',
        employee: 'Employee',
        event: 'Event',
        startDate: 'Date (from)',
        endDate: 'Date (to)',
        dateRangeInvalid: 'The end date cannot be earlier than the start date.',
      },
    },
    periodOptions: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      fullDay: 'Full day',
    },
    form: {
      title: {
        create: 'New Absence',
        edit: 'Edit Absence',
        view: 'View Absence',
      },
      fields: {
        date: 'Date',
        employee: 'Employee',
        event: 'Event',
        period: 'Period',
        amount: 'Amount',
      },
      validation: {
        dateRequired: 'Enter the date',
        employeeRequired: 'Select the employee',
        eventRequired: 'Select the event',
        amountRequired: 'Enter a valid amount',
      },
    },
  },
};
