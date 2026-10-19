// src/constants/languages/languageEnUs/languageParameters.ts
// English translation of the Parameters module (Parameter — Settings,
// execution 031, TASK-FE-031-40).

import { ModuleParameters } from '@/@types/language/module-parameters';

export const languageParameters: ModuleParameters = {
  parameter: {
    singularLabel: 'Parameter',
    pluralLabel: 'Parameters',
    type: {
      alphanumeric: 'Alphanumeric',
      numeric: 'Numeric',
      logical: 'Logical',
    },
    list: {
      pageTitle: 'Parameters',
      pageSubtitle: 'Manage the system global technical parameters.',
      deletedToast: 'Parameter successfully deleted',
      table: {
        name: 'Name',
        value: 'Value',
        type: 'Type',
        description: 'Description',
      },
      actions: {
        view: 'View',
        edit: 'Edit',
        delete: 'Delete',
      },
      reservedTooltip: 'Parameter reserved by the system',
      emptyState: {
        titleEmpty: 'No parameters registered.',
        descriptionEmpty: 'Start by adding the first parameter.',
        titleEmptyNoCreate: 'No parameters registered.',
        descriptionEmptyNoCreate: 'No parameter has been registered yet.',
        titleFiltered: 'No parameters found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
        cta: 'New Parameter',
      },
      error: {
        message: 'Could not load the parameters.',
        retry: 'Try again',
      },
    },
    filter: {
      title: 'Filter parameters',
      search: 'Name',
      searchPlaceholder: 'Search by name',
    },
    form: {
      title: {
        create: 'New Parameter',
        edit: 'Edit Parameter',
      },
      subtitle: {
        create: 'Register a new system technical parameter.',
        edit: 'Update the parameter data.',
      },
      fields: {
        name: 'Name',
        value: 'Value',
        type: 'Type',
        description: 'Description',
      },
      placeholders: {
        name: 'E.g.: CATEGF',
        value: 'E.g.: 1234',
        description: 'E.g.: Financial Category code mask',
      },
      reservedNameHelper:
        'Name reserved by the system — used by other modules, it cannot be changed.',
      validation: {
        nameMaxLength: 'The name must be at most 20 characters',
        valueMaxLength: 'The value must be at most 255 characters',
        typeRequired: 'Select the type',
        descriptionMaxLength: 'The description must be at most 40 characters',
      },
    },
    detail: {
      fields: {
        name: 'Name',
        value: 'Value',
        description: 'Description',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      actions: {
        edit: 'Edit',
      },
      notFound: {
        title: 'Parameter not found',
        description: 'The parameter may have been removed or the link is incorrect.',
        back: 'Back to the list',
      },
    },
  },
};
