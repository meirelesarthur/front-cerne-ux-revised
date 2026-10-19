// src/@types/language/module-breeds/index.ts
// Interface de tradução do módulo de RAÇAS (Breeds — Cadastros Base).
// Espelha a convenção do módulo de Centros de Custo (module-cost-centers). O
// conteúdo mora em src/constants/languages/{idioma}/languageRacas.ts.
//
// TASK-BREED-01 cobriu list + filter (grid flat, exclusão definitiva).
// TASK-BREED-02 adicionou a seção `form` (Select de Espécie obrigatório).

export interface ModuleBreeds {
  breed: {
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
      /** Copy do `DeleteConfirmDialog` — deixa claro que a exclusão é DEFINITIVA (`Breed` não usa SoftDeletes). */
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
      /** Select de Espécie — filtro CLIENT-SIDE (achado #2 de TASK-BREED-01), nunca enviado a `/breeds`. */
      specie: string;
      specieAll: string;
      specieSearchPlaceholder: string;
    };
    /** Formulário de criação/edição (TASK-BREED-02) — 3 campos: description, is_enabled, specie_uuid (Select obrigatório). */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        description: string;
        isEnabled: string;
        specie: string;
      };
      placeholders: {
        description: string;
        specie: string;
      };
      hints: {
        specieRequired: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        specieRequired: string;
      };
    };
  };
}
