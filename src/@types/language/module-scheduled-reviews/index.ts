// src/@types/language/module-scheduled-reviews/index.ts
// Interface de tradução do módulo de REVISÕES AGENDADAS (ScheduledReview —
// Gestão de Frota). Espelha a convenção do módulo de Estados
// (module-states): plural na chave do módulo (`scheduledReviews`), singular
// na chave interna (`scheduledReview`). O conteúdo mora em
// src/constants/languages/{idioma}/languageScheduledReviews.ts.
//
// TASK-REVAG-FE-01 cobre SOMENTE `list` — catálogo read-only puro (SEM
// criar/editar/excluir), SEM filtro. Por isso NÃO tem `filter` nem `form`, e
// `list.emptyState` não tem variante "filtrado" — não existe filtro para
// gerar esse estado, nem CTA de criação.

export interface ModuleScheduledReviews {
  scheduledReview: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        equipment: string;
        hourMeterKm: string;
        date: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
      };
    };
  };
}
