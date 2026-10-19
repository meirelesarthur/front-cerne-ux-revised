// src/@types/language/module-category-matrix/index.ts
// Interface de tradução do módulo de ESTÁGIO REPRODUTIVO (CategoryMatrix —
// Cadastros Base > Pecuária). Espelha a convenção do módulo de Espécies
// (module-species): chave externa técnica (`categoryMatrix`), chave interna
// de negócio (`categoryMatrix`, mesmo nome — mirror do padrão `species.specie`).
// O conteúdo mora em src/constants/languages/{idioma}/languageCategoryMatrix.ts.
//
// TASK-CATYMT-01 cobre list + filter. TASK-CATYMT-02 adiciona a seção `form`
// abaixo (criação/edição, com o Select de Espécie obrigatório).

export interface ModuleCategoryMatrix {
  categoryMatrix: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        status: string;
        specie: string;
        active: string;
        inactive: string;
      };
      actions: {
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
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      specie: string;
      speciePlaceholder: string;
    };
    /** Formulário de criação/edição (TASK-CATYMT-02) — description/is_enabled + Espécie obrigatória. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        specie: string;
      };
      placeholders: {
        description: string;
        specie: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        specieRequired: string;
      };
    };
  };
}
