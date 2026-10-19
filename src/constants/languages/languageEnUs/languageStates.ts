// src/constants/languages/languageEnUs/languageStates.ts
// EN-US translation of the STATE module (Base Registrations / Geography).
// TASK-FE-022: list (smallest i18n module in the family — no filter/form).

import { ModuleStates } from '@/@types/language/module-states';

export const languageStates: ModuleStates = {
  state: {
    singularLabel: 'State',
    list: {
      pageTitle: 'States',
      pageSubtitle: 'Geographic catalog of states used across the system registrations.',
      table: {
        title: 'Name',
        letter: 'Abbreviation',
      },
      emptyState: {
        titleEmpty: 'No state registered.',
        descriptionEmpty: 'No records found in this catalog.',
      },
    },
  },
};
