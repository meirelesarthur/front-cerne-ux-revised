// src/constants/languages/languageEnUs/languageRatingServiceOrders.ts
// EN-US translation of the OPERATIONAL module — Service Order Ratings
// (RatingServiceOrder) — own domain, TASK-FE-041-AVL-01 (pipeline 041).

import { ModuleRatingServiceOrders } from '@/@types/language/module-rating-service-orders';

export const languageRatingServiceOrders: ModuleRatingServiceOrders = {
  ratingServiceOrder: {
    singularLabel: 'Rating',
    pluralLabel: 'Ratings',
    titleModule: 'Ratings',
    list: {
      pageTitle: 'Ratings',
      pageSubtitle: 'Completed service orders awaiting or already rated.',
      table: {
        code: 'Code',
        status: 'Status',
        dtEmission: 'Issue Date',
        deadline: 'Deadline',
        user: 'Requester',
        executor: 'Responsible',
      },
      actions: {
        view: 'View',
        rate: 'Rate',
      },
      filter: {
        title: 'Filter ratings',
        code: 'Code',
        codePlaceholder: 'Search by code',
        startDate: 'Start date',
        endDate: 'End date',
      },
      emptyState: {
        title: 'No rating pending.',
        description: 'Completed service orders will appear here for rating.',
        titleFiltered: 'No rating found.',
        descriptionFiltered: 'Try adjusting the filters or clearing the search.',
      },
      error: {
        message: 'Unable to load ratings.',
        retry: 'Try again',
      },
    },
    form: {
      title: 'Rate Service Order',
      subtitle: 'Record the assessment of this service order execution.',
      sections: {
        context: 'Service Order',
        assessment: 'Assessment',
      },
      fields: {
        assessmentGrade: 'Grade',
        ratingDate: 'Rating Date',
        feedback: 'Feedback',
        recommendations: 'Recommendations',
      },
      placeholders: {
        assessmentGrade: 'Select the grade',
      },
      notFound: {
        title: 'Service order not available.',
        description:
          'This service order could not be loaded. It may no longer exist or you may not have access to it.',
        back: 'Back to the list',
      },
      readOnly: {
        title: 'View Service Order',
        subtitle: 'Review the data of this service order. Rating is not available for editing.',
        assessmentPending: 'This service order has not been rated yet.',
        back: 'Back',
      },
      errors: {
        invalidFields: 'Check the highlighted fields and try again.',
      },
      updatedToast: 'Rating registered successfully',
    },
  },
};
