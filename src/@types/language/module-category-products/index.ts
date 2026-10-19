// src/@types/language/module-category-products/index.ts
// Interface de tradução do módulo de CATEGORIAS DE PRODUTO (CategoryProducts —
// Cadastros Base). Espelha a convenção do módulo de Grupos de Produto
// (module-product-groups). O conteúdo mora em
// src/constants/languages/{idioma}/languageCategoriasProduto.ts.
//
// TASK-CP-FE-01 cobriu list + filter (grid flat, exclusão com guard de
// dependências 422). TASK-CP-FE-02 adicionou a seção `form` (5 campos:
// description + is_enabled + type + group_uuid + financial_category_uuid).

export interface ModuleCategoryProducts {
  categoryProduct: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        type: string;
        group: string;
        financialCategory: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Copy do `DeleteConfirmDialog` — deixa claro que a exclusão pode ser bloqueada por dependências (`Kind`/`Product` em uso, 422). */
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      group: string;
      groupAll: string;
      type: string;
      typeAll: string;
      typeOptions: {
        input: string;
        equipment: string;
        production: string;
      };
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição — 5 campos: description, is_enabled (Select), type (Select estático), group_uuid (SelectAsyncPaginate obrigatório), financial_category_uuid (SelectAsyncPaginate opcional). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        type: string;
        group: string;
        financialCategory: string;
        typeOptions: {
          input: string;
          equipment: string;
          production: string;
        };
      };
      placeholders: {
        description: string;
        group: string;
        financialCategory: string;
      };
      isEnabledOptions: {
        active: string;
        inactive: string;
      };
      hints: {
        groupRequired: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        isEnabledRequired: string;
        typeRequired: string;
        groupRequired: string;
        financialCategoryRequired: string;
      };
    };
  };
}
