// src/@types/language/module-roles/index.ts
// Interface de tradução do módulo de PERFIS (Roles RBAC — Cadastros Base).
// Espelha a convenção dos demais módulos (module-examples, module-admin, ...).
// O conteúdo mora em src/constants/languages/{idioma}/languageRoles.ts.

export interface ModuleRoles {
  role: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        description: string;
      };
      actions: {
        edit: string;
        delete: string;
      };
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      tabs: {
        generalInfo: string;
        permissions: string;
      };
      fields: {
        name: string;
        description: string;
        isUserVisible: string;
      };
      placeholders: {
        name: string;
        description: string;
      };
      hints: {
        isUserVisible: string;
      };
      validation: {
        nameRequired: string;
        nameMinLength: string;
        descriptionRequired: string;
      };
      permissionsTree: {
        searchPlaceholder: string;
        selectedSuffix: string;
        noResults: string;
        driftTooltip: string;
        noAuthorityTooltip: string;
        readOnlyHint: string;
      };
    };
  };
}
