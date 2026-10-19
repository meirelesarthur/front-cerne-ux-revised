// src/@types/language/module-bonuses/index.ts
// Interface de tradução do módulo de REGISTRO DE EVENTOS (Bonus —
// Administrativo). Mirror da convenção de `module-advances` (instância
// simples: um único arquivo, sem decomposição por tela), SEM os blocos
// `installments`/`sections`/`financial` (fora do núcleo de Bonus) e SEM
// `list.filter` (sem filtro no backend, DEC-API-03).
// O conteúdo mora em src/constants/languages/{idioma}/languageBonuses.ts.

export interface ModuleBonuses {
  bonus: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        employee: string;
        event: string;
        date: string;
        amount: string;
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
        cta: string;
      };
    };
    detail: {
      generalData: {
        title: string;
      };
      fields: {
        employee: string;
        event: string;
        date: string;
        amount: string;
      };
      actions: {
        edit: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        employee: string;
        event: string;
        date: string;
        amount: string;
      };
      validation: {
        employeeRequired: string;
        eventRequired: string;
        dateRequired: string;
        amountRequired: string;
      };
    };
  };
}
