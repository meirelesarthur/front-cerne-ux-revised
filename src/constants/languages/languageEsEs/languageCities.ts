// src/constants/languages/languageEsEs/languageCities.ts
// Traducción ES-ES del módulo de CIUDADES (Registros Base / Geografía).
// TASK-FE-023: list + filter (cascada de Estado + búsqueda).

import { ModuleCities } from '@/@types/language/module-cities';

export const languageCities: ModuleCities = {
  city: {
    singularLabel: 'Ciudad',
    list: {
      pageTitle: 'Ciudades',
      pageSubtitle: 'Catálogo geográfico de ciudades utilizado en los registros del sistema.',
      table: {
        title: 'Nombre',
        state: 'Estado',
      },
      emptyState: {
        titleEmpty: 'Ninguna ciudad registrada.',
        descriptionEmpty: 'No se encontraron registros en este catálogo.',
        titleFiltered: 'Ninguna ciudad encontrada.',
        descriptionFiltered: 'Intente ajustar el Estado o la búsqueda.',
      },
    },
    filter: {
      title: 'Filtrar ciudades',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      state: 'Estado',
      statePlaceholder: 'Todos los estados',
    },
  },
};
