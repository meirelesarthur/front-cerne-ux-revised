// src/@types/language/module-planos/index.ts
// Interface de tradução do módulo PLANOS (PlanRole) — domínio PRÓPRIO
// (fora de `module-configuracoes`, mesmo nível de `module-farms`/
// `module-cost-centers`; entidade já tem rota e ícone dedicados no NavRail).
// Espelha a convenção de `module-cost-centers`. O conteúdo mora em
// `src/constants/languages/{idioma}/languagePlanos.ts`.
//
// TASK-FE-2700 (fundação) → TASK-FE-2701 (listagem) → TASK-FE-2702
// (formulário) → TASK-FE-2703 (visualização).

export interface ModulePlanos {
  planRole: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        price: string;
        intervalDays: string;
        mainRole: string;
        segments: string;
        isFree: string;
        farmLimit: string;
        concurrentUserLimit: string;
        freeLabel: string;
        paidLabel: string;
        noRole: string;
      };
      actions: {
        edit: string;
        delete: string;
        view: string;
      };
      emptyState: {
        title: string;
        description: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      filter: {
        title: string;
        search: string;
        searchPlaceholder: string;
        isFree: string;
        isFreeAll: string;
        isFreeOptions: {
          free: string;
          paid: string;
        };
      };
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      subtitle: {
        create: string;
        edit: string;
      };
      fields: {
        name: string;
        price: string;
        intervalDays: string;
        farmLimit: string;
        concurrentUserLimit: string;
        isFree: string;
        animalsLimit: string;
        agricultureAreaLimit: string;
        fruitgrowingAreaLimit: string;
        mainRole: string;
        additionalRoles: string;
        segments: string;
        signupLink: string;
      };
      placeholders: {
        name: string;
      };
      sections: {
        general: string;
        limits: string;
        assignments: string;
        signup: string;
      };
      /** Placeholder da busca server-side do `CheckboxListField` de Atribuições
       * Adicionais (GAP-FE-233 resolvido — mirror `rolesSearchPlaceholder` de
       * `module-people`/`module-users`). */
      rolesSearchPlaceholder: string;
      /** Prefixo do contador de selecionados do mesmo `CheckboxListField`. */
      selectedRolesCountLabel: string;
      segmentsTree: {
        expandAll: string;
        collapseAll: string;
        selectAll: string;
        deselectAll: string;
        emptyGroup: string;
        noCategories: string;
        searchPlaceholder: string;
        noResults: string;
      };
      copyLinkButton: string;
      copyLinkSuccessToast: string;
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        priceRequired: string;
        priceMin: string;
        intervalDaysRequired: string;
        intervalDaysMin: string;
        limitMin: string;
        animalsLimitRequired: string;
        animalsLimitMin: string;
        areaLimitRequired: string;
        areaLimitMin: string;
      };
    };
    detail: {
      actions: {
        edit: string;
      };
      generalData: {
        title: string;
      };
      limits: {
        title: string;
      };
      assignments: {
        title: string;
        empty: string;
      };
      segments: {
        title: string;
        empty: string;
      };
      signup: {
        title: string;
        description: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
