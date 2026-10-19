// src/constants/languages/languagePtBr/languageScheduledReviews.ts
// Tradução PT-BR do módulo de REVISÕES AGENDADAS (Gestão de Frota).
// TASK-REVAG-FE-01: list (menor módulo i18n da família — sem filter/form).

import { ModuleScheduledReviews } from '@/@types/language/module-scheduled-reviews';

export const languageScheduledReviews: ModuleScheduledReviews = {
  scheduledReview: {
    singularLabel: 'Revisão Agendada',
    pluralLabel: 'Revisões Agendadas',
    list: {
      pageTitle: 'Revisões Agendadas',
      pageSubtitle: 'Revisões preventivas agendadas da frota.',
      table: {
        equipment: 'Máq./Equipamento',
        hourMeterKm: 'Km/Horímetro',
        date: 'Data Revisão',
      },
      emptyState: {
        titleEmpty: 'Nenhuma revisão agendada.',
        descriptionEmpty: 'Nenhum registro encontrado neste catálogo.',
      },
    },
  },
};
