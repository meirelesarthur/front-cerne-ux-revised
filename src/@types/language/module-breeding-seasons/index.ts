// src/@types/language/module-breeding-seasons/index.ts
// Interface de tradução do módulo "Estação de Monta" (BreedingSeason —
// Operacional / Reprodução, 97-Esteiras/003, Tarefas 12/13). Mirror da
// convenção de `module-absences`/`module-events` (instância simples: um
// único arquivo, sem decomposição por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageBreedingSeasons.ts.

export interface ModuleBreedingSeasons {
  breedingSeason: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      newButton: string;
      table: {
        code: string;
        date: string;
        startDate: string;
        endDate: string;
        responsible: string;
        description: string;
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
        responsible: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
    };
    detail: {
      title: string;
      backButton: string;
      editButton: string;
      stats: {
        days: string;
        weeks: string;
      };
      sections: {
        generalData: string;
      };
      fields: {
        code: string;
        date: string;
        startDate: string;
        endDate: string;
        responsible: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      };
      notFound: {
        title: string;
        description: string;
      };
      invalidParamsToast: {
        title: string;
        description: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        responsible: string;
        date: string;
        description: string;
        startDate: string;
        endDate: string;
        daysPreview: string;
        weeksPreview: string;
      };
      validation: {
        dateRequired: string;
        descriptionRequired: string;
        startDateRequired: string;
        endDateRequired: string;
        endDateBeforeStartDate: string;
      };
      unsavedChangesDialog: {
        title: string;
        description: string;
        confirmButton: string;
      };
    };
    chart: {
      title: string;
      empty: string;
    };
  };
}
