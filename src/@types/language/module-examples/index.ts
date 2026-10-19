// src/@types/language/module-examples/index.ts
// Interface de tradução do módulo de EXEMPLOS (referência de padrão CRUD).
// Espelha a convenção dos demais módulos (module-common, module-admin, ...).
// O conteúdo mora em src/constants/languages/{idioma}/languageExamples.ts.

export interface ModuleExamples {
  resource: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        id: string;
        name: string;
        code: string;
        description: string;
        status: string;
        active: string;
        inactive: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
    };
    filter: {
      title: string;
      name: string;
      namePlaceholder: string;
      status: string;
      includeDeleted: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: {
        generalInfo: string;
        settings: string;
      };
      fields: {
        name: string;
        code: string;
        description: string;
        status: string;
        enabled: string;
      };
      placeholders: {
        name: string;
        code: string;
        description: string;
      };
      validation: {
        nameRequired: string;
        nameMinLength: string;
        codeRequired: string;
        statusRequired: string;
      };
      settingsTitle: string;
      configTab: {
        description: string;
        visibility: string;
        visibilityHint: string;
      };
    };
  };
}
