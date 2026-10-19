// src/@types/language/module-functions/index.ts
// Interface de tradução do módulo de FUNÇÕES (Function — cargo/função de RH,
// Administrativo / Gestão Pessoal). Espelha a convenção de module-markers/
// module-family-equipments. O conteúdo mora em
// src/constants/languages/{idioma}/languageFunctions.ts.
//
// TASK-FN-FE-01 cobre `list` + `filter` + `deleteBlocked` (2 rótulos de
// `errors.in_use`). TASK-FN-FE-02 adiciona `form` (campos do formulário
// create/edit — `name`/`cbo_uuid`/`base_salary`/`monthly_hours`/
// `vl_time_productive` (read-only)/`is_enabled`/`description`).

export interface ModuleFunctions {
  function: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        cbo: string;
        baseSalary: string;
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
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
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
      cbo: string;
      cboAll: string;
    };
    /** Formulário de criação/edição (TASK-FN-FE-02) — 7 campos, ordem real do
     *  DOM legado (Doc Bruta §6): name → cbo_uuid → base_salary →
     *  monthly_hours → vl_time_productive (read-only) → is_enabled →
     *  description. */
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        name: string;
        cbo: string;
        baseSalary: string;
        monthlyHours: string;
        vlTimeProductive: string;
        isEnabled: string;
        description: string;
      };
      placeholders: {
        name: string;
        cbo: string;
        description: string;
      };
      vlTimeProductiveEmpty: string;
      validation: {
        nameMaxLength: string;
        baseSalaryMin: string;
        monthlyHoursInteger: string;
        monthlyHoursMin: string;
        descriptionMaxLength: string;
      };
    };
  };
}
