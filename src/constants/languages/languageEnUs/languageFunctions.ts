// src/constants/languages/languageEnUs/languageFunctions.ts
// EN-US translation of the FUNCTIONS module (Administrative / People Management).

import { ModuleFunctions } from '@/@types/language/module-functions';

export const languageFunctions: ModuleFunctions = {
  function: {
    singularLabel: 'Function',
    pluralLabel: 'Functions',
    list: {
      pageTitle: 'Functions',
      pageSubtitle: 'Manage the job function catalog (linked to an official CBO code).',
      deletedToast: 'Function removed successfully',
      table: {
        name: 'Name',
        cbo: 'CBO',
        baseSalary: 'Base Salary',
        active: 'Active',
        activeLabel: 'Active',
        inactiveLabel: 'Inactive',
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      emptyState: {
        titleEmpty: 'No functions registered.',
        descriptionEmpty: 'Start by adding the first function.',
        titleFiltered: 'No functions found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Function',
      },
      error: {
        message: 'Could not load the functions.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter functions',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      isEnabled: 'Status',
      isEnabledAll: 'All',
      enabledOptions: {
        active: 'Active',
        inactive: 'Inactive',
      },
      cbo: 'CBO',
      cboAll: 'All',
    },
    form: {
      title: { create: 'New Function', edit: 'Edit Function' },
      subtitle: {
        create: 'Register a new function (job linked to an official CBO code).',
        edit: 'Update the function data.',
      },
      fields: {
        name: 'Name',
        cbo: 'CBO',
        baseSalary: 'Base Salary',
        monthlyHours: 'Monthly Hours',
        vlTimeProductive: 'Productive Hour Value',
        isEnabled: 'Active',
        description: 'Description',
      },
      placeholders: {
        name: 'E.g.: Cowherd',
        cbo: 'Search by code or description',
        description: 'E.g.: Responsible for dairy herd management',
      },
      // Server-calculated (DA-FN-08) — in creation mode, before the first
      // save, there is no value to display.
      vlTimeProductiveEmpty: '—',
      validation: {
        nameMaxLength: 'The name must be at most 120 characters',
        baseSalaryMin: 'The base salary cannot be negative',
        monthlyHoursInteger: 'The monthly hours must be a whole number',
        monthlyHoursMin: 'The monthly hours must be at least 1',
        descriptionMaxLength: 'The description must be at most 191 characters',
      },
    },
  },
};
