// src/@types/language/module-packages/index.ts
// Interface de tradução do módulo de EMBALAGENS (Package — Cadastros Base /
// Estrutura, execução 025). Espelha a convenção do módulo de Classes de
// Produto (module-kinds). O conteúdo mora em
// src/constants/languages/{idioma}/languagePackages.ts.

export interface ModulePackages {
  package: {
    singularLabel: string;
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: { description: string; size: string; measurement: string };
      placeholders: { description: string; measurement: string };
      hints: { measurementRequired: string };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        sizeRequired: string;
        sizeMin: string;
        measurementRequired: string;
      };
      noFarmSelected: { title: string; description: string };
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      columns: { description: string; size: string; measurement: string; actions: string };
      actions: { edit: string; delete: string };
      deletedToast: string;
      empty: { title: string; description: string };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deleteConfirm: { title: string; description: string; warning: string };
      noFarmSelected: { title: string; description: string };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      measurement: string;
      measurementAll: string;
    };
  };
}
