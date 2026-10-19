// src/@types/language/module-earnings/index.ts
// Interface de tradução do módulo "Apuração Mensal" (Earning —
// Administrativo, 97-Esteiras/002, Tarefas 07/08/09). Mirror da convenção de
// `module-advances` (instância simples: um único arquivo, sem decomposição
// por tela). O conteúdo mora em
// src/constants/languages/{idioma}/languageEarnings.ts.

export interface ModuleEarnings {
  earning: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        employee: string;
        function: string;
        period: string;
        type: string;
        total: string;
        vlCheque: string;
        isPay: string;
        actions: string;
      };
      statusLabels: {
        paid: string;
        pending: string;
        /**
         * UT-000731/F-105 — roster de elegíveis (`is_pay === null`):
         * funcionário com vínculo no período, ainda sem apuração lançada.
         */
        toCalculate: string;
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
        employeePlaceholder: string;
        function: string;
        year: string;
        month: string;
        type: string;
      };
      launchButton: string;
      deleteConfirm: {
        title: string;
        description: string;
        periodCutoffError: string;
      };
      bulk: {
        selectAllLabel: string;
        selectRowLabel: string;
        selectedCountLabel: string;
        generateExpensesButton: string;
        generateExpensesSuccessToast: string;
        generateExpensesConfirmTitle: string;
        generateExpensesConfirmDescription: string;
        generateExpensesConfirmButton: string;
      };
      importButton: string;
    };
    detail: {
      title: string;
      backButton: string;
      generalData: {
        title: string;
      };
      fields: {
        employee: string;
        function: string;
        period: string;
        type: string;
        total: string;
        vlAccount: string;
        vlCheque: string;
        isPay: string;
        costCenter: string;
        team: string;
        proprietary: string;
        createdAt: string;
      };
      events: {
        title: string;
        columns: {
          event: string;
          value: string;
          condition: string;
        };
        empty: string;
      };
      advancesPeriod: {
        title: string;
        columns: {
          date: string;
          amount: string;
        };
        empty: string;
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
    selectEmployeeModal: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      confirmButton: string;
      cancelButton: string;
      emptyState: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
      };
      sections: {
        generalData: string;
        events: string;
        advancesPeriod: string;
      };
      fields: {
        employee: string;
        cpf: string;
        function: string;
        month: string;
        year: string;
        type: string;
        costCenter: string;
        team: string;
        proprietary: string;
        total: string;
        vlAccount: string;
        vlCheque: string;
      };
      eventRow: {
        event: string;
        value: string;
        condition: string;
        addButton: string;
        removeButton: string;
        emptyLabel: string;
        totalLabel: string;
      };
      proprietaryUnavailable: string;
      teamUnavailable: string;
      vlAccountExceedsTotalWarning: string;
      periodCutoffError: string;
      validation: {
        functionRequired: string;
        eventsRequired: string;
        eventValueRequired: string;
        duplicateEvent: string;
        totalRequired: string;
        vlAccountRequired: string;
        /** UT-000714 item 4/7 — Centro de Custo volta a ser obrigatório (mirror legado HTML required). */
        costCenterRequired: string;
      };
    };
    importModal: {
      title: string;
      subtitle: string;
      instructions: string;
      downloadShortcut: string;
      downloadTemplateError: string;
      fileUpload: {
        label: string;
        hint: string;
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      batchFields: {
        month: string;
        year: string;
        type: string;
        costCenter: string;
        team: string;
        proprietary: string;
      };
      rowErrors: {
        title: string;
      };
      result: {
        employeesProcessedLabel: string;
        rowsProcessedLabel: string;
      };
      importSuccessToast: string;
      cancelButton: string;
      submitButton: string;
      closeButton: string;
    };
  };
}
