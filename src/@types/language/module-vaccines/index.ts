// src/@types/language/module-vaccines/index.ts
// Interface de tradução do módulo de VACINAS (Vaccine — Cadastros Base /
// Pecuária). Espelha a convenção do módulo de Raças (module-breeds). O
// conteúdo mora em src/constants/languages/{idioma}/languageVacinas.ts.

export interface ModuleVaccines {
  vaccine: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
        specie: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: { edit: string; delete: string };
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: { active: string; inactive: string };
      specie: string;
      specieAll: string;
      specieSearchPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: { description: string; isEnabled: string; specie: string };
      placeholders: { description: string; specie: string };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
}
