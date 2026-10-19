// src/@types/language/module-kinds/index.ts
// Interface de tradução do módulo de CLASSES DE PRODUTO (Kind — Cadastros
// Base / Estrutura, execução 024). Espelha a convenção do módulo de Raças
// (module-breeds). O conteúdo mora em
// src/constants/languages/{idioma}/languageClasses.ts.
//
// TASK-FE-460 cobre só o stub estrutural (populado por TASK-FE-461/462).

export interface ModuleKinds {
  kind: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        category: string;
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
      category: string;
      categoryAll: string;
      categorySearchPlaceholder: string;
    };
    /** Formulário de criação/edição — 3 campos: name, category_uuid (Select assíncrono, obrigatório), is_enabled. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        isEnabled: string;
        category: string;
      };
      placeholders: {
        name: string;
        category: string;
      };
      hints: {
        categoryRequired: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        categoryRequired: string;
      };
    };
  };
}
