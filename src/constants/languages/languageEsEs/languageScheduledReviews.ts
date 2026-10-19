// src/constants/languages/languageEsEs/languageScheduledReviews.ts
// Traducción ES-ES del módulo de REVISIONES PROGRAMADAS (Gestión de Flota).
// TASK-REVAG-FE-01: solo list (el módulo i18n más pequeño de la familia —
// sin filter/form).

import { ModuleScheduledReviews } from '@/@types/language/module-scheduled-reviews';

export const languageScheduledReviews: ModuleScheduledReviews = {
  scheduledReview: {
    singularLabel: 'Revisión Programada',
    pluralLabel: 'Revisiones Programadas',
    list: {
      pageTitle: 'Revisiones Programadas',
      pageSubtitle: 'Revisiones preventivas programadas de la flota.',
      table: {
        equipment: 'Máq./Equipo',
        hourMeterKm: 'Horímetro/Km',
        date: 'Fecha Revisión',
      },
      emptyState: {
        titleEmpty: 'Ninguna revisión programada.',
        descriptionEmpty: 'Ningún registro encontrado en este catálogo.',
      },
    },
  },
};
