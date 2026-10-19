// src/@types/language/module-activities/index.ts
// Interface de tradução do módulo de ATIVIDADES (Activity — Cadastros Base /
// Agrícola). Espelha a convenção do módulo de Tipos de Título
// (module-type-titles). O conteúdo mora em
// src/constants/languages/{idioma}/languageActivities.ts.
//
// TASK-FE-025 cobre apenas a fundação de dados (sem UI) — esta interface já
// antecipa as seções `list`/`filter`/`form` completas para consumo direto
// pelas telas de TASK-FE-026/027 (listagem/formulário), evitando retrabalho
// de i18n na próxima Tarefa.

export interface ModuleActivities {
  activity: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        description: string;
        vlHectare: string;
        type: string;
        use: string;
        operations: string;
        status: string;
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
      type: string;
      typeAll: string;
      typeOptions: {
        costing: string;
        investment: string;
        undefined: string;
      };
      use: string;
      useAll: string;
      useOptions: {
        both: string;
        agriculture: string;
        fruitculture: string;
        beefCattle: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        description: string;
        vlHectare: string;
        type: string;
        use: string;
        isEnabled: string;
        operations: string;
      };
      operationsField: {
        searchPlaceholder: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        selectedCountLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      placeholders: {
        name: string;
        description: string;
        vlHectare: string;
      };
      typeOptions: {
        costing: string;
        investment: string;
        undefined: string;
      };
      useOptions: {
        both: string;
        agriculture: string;
        fruitculture: string;
        beefCattle: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionMaxLength: string;
        isEnabledRequired: string;
        vlHectareRequired: string;
        vlHectareMin: string;
        typeRequired: string;
        useRequired: string;
      };
    };
  };
}
