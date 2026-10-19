// src/@types/language/module-product-groups/index.ts
// Interface de tradução do módulo de GRUPOS DE PRODUTO (ProductGroups —
// Cadastros Base). Espelha a convenção do módulo de Raças (module-breeds). O
// conteúdo mora em src/constants/languages/{idioma}/languageGruposProduto.ts.
//
// TASK-GRP-01 cobriu list + filter (grid flat, exclusão definitiva, guard de
// FK 422). TASK-GRP-02 adicionou a seção `form` (2 campos: description +
// is_enabled, sem Select de FK).

export interface ModuleProductGroups {
  productGroup: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
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
      /** Copy do `DeleteConfirmDialog` — deixa claro que a exclusão é DEFINITIVA (`GroupProduct` não usa SoftDeletes). */
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
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
    };
    /** Formulário de criação/edição — 2 campos: description, is_enabled (Select). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
      };
      placeholders: {
        description: string;
      };
      isEnabledOptions: {
        active: string;
        inactive: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        isEnabledRequired: string;
      };
    };
  };
}
