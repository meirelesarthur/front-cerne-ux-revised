// src/constants/languages/languageEnUs/languageCities.ts
// EN-US translation of the CITY module (Base Registrations / Geography).
// TASK-FE-023: list + filter (State cascade + search).

import { ModuleCities } from '@/@types/language/module-cities';

export const languageCities: ModuleCities = {
  city: {
    singularLabel: 'City',
    list: {
      pageTitle: 'Cities',
      pageSubtitle: 'Geographic catalog of cities used across the system registrations.',
      table: {
        title: 'Name',
        state: 'State',
      },
      emptyState: {
        titleEmpty: 'No city registered.',
        descriptionEmpty: 'No records found in this catalog.',
        titleFiltered: 'No city found.',
        descriptionFiltered: 'Try adjusting the State or the search.',
      },
    },
    filter: {
      title: 'Filter cities',
      search: 'Search',
      searchPlaceholder: 'Search by name',
      state: 'State',
      statePlaceholder: 'All states',
    },
  },
};
