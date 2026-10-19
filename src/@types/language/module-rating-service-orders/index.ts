// src/@types/language/module-rating-service-orders/index.ts
// Interface de tradução do módulo OPERACIONAL — Avaliações de Ordem de
// Serviço (RatingServiceOrder) — domínio PRÓPRIO (mirror
// `module-service-orders`). O conteúdo mora em
// `src/constants/languages/{idioma}/languageRatingServiceOrders.ts`.
//
// TASK-FE-041-AVL-01 (fundação) → TASK-FE-041-AVL-02 (listagem+filtro) →
// TASK-FE-041-AVL-03 (form de avaliação, one-shot).

export interface ModuleRatingServiceOrders {
  ratingServiceOrder: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        status: string;
        dtEmission: string;
        deadline: string;
        user: string;
        executor: string;
      };
      actions: {
        view: string;
        rate: string;
      };
      filter: {
        title: string;
        code: string;
        codePlaceholder: string;
        startDate: string;
        endDate: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    form: {
      title: string;
      subtitle: string;
      sections: {
        context: string;
        assessment: string;
      };
      fields: {
        assessmentGrade: string;
        ratingDate: string;
        feedback: string;
        recommendations: string;
      };
      placeholders: {
        assessmentGrade: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
      readOnly: {
        title: string;
        subtitle: string;
        assessmentPending: string;
        back: string;
      };
      errors: {
        invalidFields: string;
      };
      updatedToast: string;
    };
  };
}
