// src/@types/language/module-operations/index.ts
// Interface de tradução do módulo de OPERAÇÕES (Operation — Cadastros Base /
// Agrícola). Espelha a convenção do módulo de Atividades (module-activities).
// O conteúdo mora em src/constants/languages/{idioma}/languageOperations.ts.
//
// TASK-FE-042 cobre `list`/`filter`; TASK-FE-043 completa `form`.

export interface ModuleOperations {
  operation: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        grouper: string;
        order: string;
        status: string;
        active: string;
        inactive: string;
        noGrouper: string;
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
      use: string;
      useAll: string;
      useOptions: {
        both: string;
        agriculture: string;
        livestock: string;
      };
      grouper: string;
      grouperAll: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        description: string;
        grouper: string;
        order: string;
        use: string;
        isEnabled: string;
      };
      placeholders: {
        name: string;
        description: string;
        grouper: string;
        order: string;
      };
      useOptions: {
        both: string;
        agriculture: string;
        livestock: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionMaxLength: string;
        orderRequired: string;
        useRequired: string;
        isEnabledRequired: string;
      };
    };
  };
}
