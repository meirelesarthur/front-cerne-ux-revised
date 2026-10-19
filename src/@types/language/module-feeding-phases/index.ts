// src/@types/language/module-feeding-phases/index.ts
// Interface de tradução do módulo "Fases de Alimentação" (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01). O conteúdo mora
// em src/constants/languages/{idioma}/languageFeedingPhases.ts.
//
// Shape completo declarado de uma vez (mirror `module-diets/index.ts`):
// `list`/`filter` (TASK-FP-FE-02) e `form` (TASK-FP-FE-03) já reservados
// nesta Tarefa para não reabrir este arquivo de interface em cada Tarefa
// seguinte.
export interface ModuleFeedingPhases {
  feedingPhase: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      columns: {
        code: string;
        name: string;
        responsible: string;
        createdAt: string;
        updatedAt: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
    };
    filter: {
      title: string;
      name: string;
      namePlaceholder: string;
      diet: string;
      dietAll: string;
      changeRule: string;
      changeRuleAll: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        responsible: string;
        date: string;
        name: string;
        observation: string;
      };
      /** Labels das opções do enum `FeedingPhaseChangeRule`
       *  (`@/constants/feeding-phase/feeding-phase-change-rule.ts`). */
      changeRuleOptions: {
        byDays: string;
        byWeight: string;
      };
      items: {
        title: string;
        sequence: string;
        diet: string;
        changeRule: string;
        minimumStart: string;
        maximumEnd: string;
        addItem: string;
        removeItem: string;
      };
      /** Mensagens de validação do schema Yup (`feeding-phase-schema.ts`). */
      validation: {
        dateRequired: string;
        nameRequired: string;
        nameMax: string;
        observationMax: string;
        itemsMin: string;
        itemDietRequired: string;
        itemChangeRuleRequired: string;
        itemMinimumStartMin: string;
        itemMaximumEndMin: string;
        /** Validação IMEDIATA pós-preenchimento (blur/troca de Regra de
         *  Troca), fiel ao form legado (IG-02/IG-03) — ADICIONAL ao Yup
         *  acima, nunca substitui `itemMinimumStartMin`/`itemMaximumEndMin`.
         *  Vive em `feeding-phase-items-validation.ts`, não no schema Yup. */
        itemMinimumStartExceedsMaximumEnd: string;
        itemMinimumStartMustExceedPreviousMaximumEnd: string;
        itemMaximumEndBelowMinimumStart: string;
        itemMaximumEndMustPrecedeNextMinimumStart: string;
      };
    };
  };
}
