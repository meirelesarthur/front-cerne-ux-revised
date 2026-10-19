// src/constants/languages/languageEsEs/languageStates.ts
// Traducción ES-ES del módulo de ESTADOS (Registros Base / Geografía).
// TASK-FE-022: list (el módulo i18n más pequeño de la familia — sin filter/form).

import { ModuleStates } from '@/@types/language/module-states';

export const languageStates: ModuleStates = {
  state: {
    singularLabel: 'Estado',
    list: {
      pageTitle: 'Estados',
      pageSubtitle: 'Catálogo geográfico de estados utilizado en los registros del sistema.',
      table: {
        title: 'Nombre',
        letter: 'Sigla',
      },
      emptyState: {
        titleEmpty: 'Ningún estado registrado.',
        descriptionEmpty: 'No se encontraron registros en este catálogo.',
      },
    },
  },
};
