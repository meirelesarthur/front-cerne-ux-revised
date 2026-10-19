// src/constants/languages/languageEnUs/languageScheduledReviews.ts
// EN-US translation of the SCHEDULED REVIEWS module (Fleet Management).
// TASK-REVAG-FE-01: list only (smallest i18n module in the family — no
// filter/form).

import { ModuleScheduledReviews } from '@/@types/language/module-scheduled-reviews';

export const languageScheduledReviews: ModuleScheduledReviews = {
  scheduledReview: {
    singularLabel: 'Scheduled Review',
    pluralLabel: 'Scheduled Reviews',
    list: {
      pageTitle: 'Scheduled Reviews',
      pageSubtitle: 'Scheduled preventive fleet reviews.',
      table: {
        equipment: 'Equipment',
        hourMeterKm: 'Hour Meter / Km',
        date: 'Review Date',
      },
      emptyState: {
        titleEmpty: 'No scheduled reviews.',
        descriptionEmpty: 'No records found in this catalog.',
      },
    },
  },
};
