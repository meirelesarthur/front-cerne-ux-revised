// src/@types/language/module-species/index.ts
// Interface de tradução do módulo de ESPÉCIES (Cadastros Base).
// Espelha a convenção do módulo de Centros de Custo (module-cost-centers). O
// conteúdo mora em src/constants/languages/{idioma}/languageSpecies.ts.
//
// TASK-ESP-01 cobriu só a LISTAGEM (list + filter). TASK-ESP-02 adiciona a
// seção `form` abaixo (criação/edição, com o campo opcional de Centro de
// Custo), sem alterar o que já existia.

export interface ModuleSpecies {
  specie: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        description: string;
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
    };
    /** Formulário de criação/edição (TASK-ESP-02) — description/is_enabled + Centro de Custo opcional. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        costCenter: string;
      };
      placeholders: {
        description: string;
        costCenter: string;
      };
      hints: {
        costCenterOptional: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
      };
    };
  };
}
