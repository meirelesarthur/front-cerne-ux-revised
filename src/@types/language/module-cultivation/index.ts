// src/@types/language/module-cultivation/index.ts
// Interface de tradução do módulo de CULTURA/VARIEDADE (Cultivation —
// Cadastros Base). Espelha a convenção dos demais módulos (module-roles,
// module-examples, ...). O conteúdo mora em
// src/constants/languages/{idioma}/languageCultivation.ts.

export interface ModuleCultivation {
  pageTitle: string;
  pageSubtitle: string;
  deletedToast: string;
  table: {
    name: string;
    status: string;
    active: string;
    inactive: string;
    varietiesCount: string;
  };
  tree: {
    expand: string;
    collapse: string;
  };
  actions: {
    edit: string;
    newVariety: string;
    delete: string;
  };
  empty: {
    message: string;
    cta: string;
  };
  error: {
    message: string;
    retry: string;
  };
  filter: {
    title: string;
    search: string;
    searchPlaceholder: string;
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
      status: string;
      parent: string;
    };
    placeholders: {
      name: string;
      parent: string;
    };
    validation: {
      nameRequired: string;
      nameMinLength: string;
    };
  };
}
