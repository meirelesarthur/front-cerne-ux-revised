// src/@types/language/module-advances/index.ts
// Interface de tradução do módulo de ADIANTAMENTO SALARIAL (Advance —
// Administrativo). Mirror da convenção de `module-production-cycles`
// (instância simples: um único arquivo, sem decomposição por tela).
// O conteúdo mora em src/constants/languages/{idioma}/languageAdvances.ts.

export interface ModuleAdvances {
  advance: {
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
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      filter: {
        employee: string;
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
      installments: {
        title: string;
        month: string;
        value: string;
        empty: string;
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
        installments: string;
        // ---- D2-REV — "Gerar Financeiro" (header + entrada) ----
        financialType: string;
        provider: string;
        proprietary: string;
        number: string;
        note: string;
        fiscalDocument: string;
        hasInput: string;
        inputDate: string;
        inputValue: string;
        financialCategory: string;
        costCenter: string;
        apportionmentValue: string;
        apportionmentPercent: string;
        dueDate: string;
        hasFinancial: string;
      };
      installmentRow: {
        month: string;
        value: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
      };
      // ---- D2-REV — sub-cards do bloco "Gerar Financeiro" ----
      sections: {
        financial: string;
        financialInstallments: string;
        apportionment: string;
        installmentGenerator: string;
      };
      installmentGenerator: {
        count: string;
        firstDueDate: string;
        intervalDays: string;
        generateButton: string;
        overwriteConfirm: string;
      };
      financialInstallmentRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
      };
      apportionmentRow: {
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        sumBadgeLabel: string;
      };
      validation: {
        employeeRequired: string;
        eventRequired: string;
        dateRequired: string;
        amountRequired: string;
        installmentsRequired: string;
        installmentsSum: string;
        installmentMonthRequired: string;
        installmentValueRequired: string;
        // ---- D2-REV — validação do bloco financeiro ----
        financialInstallmentsSum: string;
        apportionmentSum: string;
        typeRequired: string;
        fiscalDocumentRequired: string;
        financialCategoryRequired: string;
        costCenterRequired: string;
        dueDateRequired: string;
        financialValueRequired: string;
        inputDateRequired: string;
        inputValueRequired: string;
      };
    };
  };
}
