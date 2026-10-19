// src/@types/language/module-rainfalls/index.ts
// Interface de tradução do módulo OPERACIONAL — Pluviometria (Rainfall,
// execução 041, TASK-FE-041-PLV-01..05). Mirror `module-death-animals` (par
// singular/plural, list/filter/detail/form) + bloco `import` próprio (mirror
// `PlanAccounts.planAccount.excel.import`, IMPORT-PLV-01) e `areasPicker`
// (labels do `CheckboxListField`, evita string hardcoded do componente em
// telas não-PT).
//
// O conteúdo mora em src/constants/languages/{idioma}/languageRainfalls.ts.

export interface ModuleRainfalls {
  rainfall: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        date: string;
        user: string;
        areas: string;
        areasEmpty: string;
        amount: string;
        actions: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
        import: string;
        new: string;
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
    };
    filter: {
      title: string;
      startDate: string;
      endDate: string;
    };
    detail: {
      generalData: { title: string };
      fields: {
        date: string;
        user: string;
        amount: string;
        areas: string;
        areasEmpty: string;
      };
      actions: { edit: string; back: string };
      notFound: { title: string; description: string; back: string };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        date: string;
        amount: string;
        areas: string;
        user: string;
      };
      areasPicker: {
        searchPlaceholder: string;
        selectedCountLabel: string;
        selectAllLabel: string;
        deselectAllLabel: string;
        emptyLabel: string;
        errorLabel: string;
        retryLabel: string;
      };
      validation: {
        dateRequired: string;
        amountRequired: string;
        amountRange: string;
        areasRequired: string;
      };
    };
    import: {
      title: string;
      subtitle: string;
      downloadShortcut: string;
      instructions: string;
      warning: { title: string; description: string };
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
      rowErrors: { title: string; rowPrefix: string };
      result: { created: string };
      cancelButton: string;
      submitButton: string;
      closeButton: string;
      importSuccessToast: string;
      downloadTemplateError: string;
    };
  };
}
