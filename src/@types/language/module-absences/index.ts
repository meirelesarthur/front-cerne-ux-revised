// src/@types/language/module-absences/index.ts
// Interface de tradução do módulo "Registro de Faltas" (Absence —
// Administrativo / Gestão Pessoal, 97-Esteiras/003, Tarefas 12/13). Mirror da
// convenção de `module-events`/`module-advances` (instância simples: um único
// arquivo, sem decomposição por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageAbsences.ts.

export interface ModuleAbsences {
  absence: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        date: string;
        employee: string;
        event: string;
        amount: string;
        period: string;
        actions: string;
      };
      actions: {
        view: string;
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
      filter: {
        title: string;
        employee: string;
        event: string;
        startDate: string;
        endDate: string;
        dateRangeInvalid: string;
      };
    };
    /** Fábrica de opções `AbsencePeriod` (1=Matutino, 2=Vespertino, 3=Integral). */
    periodOptions: {
      morning: string;
      afternoon: string;
      fullDay: string;
    };
    form: {
      title: { create: string; edit: string; view: string };
      fields: {
        date: string;
        employee: string;
        event: string;
        period: string;
        amount: string;
      };
      validation: {
        dateRequired: string;
        employeeRequired: string;
        eventRequired: string;
        amountRequired: string;
      };
    };
  };
}
