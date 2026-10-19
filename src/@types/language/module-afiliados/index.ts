// src/@types/language/module-afiliados/index.ts
// Interface de tradução do módulo de AFILIADOS (Partner — Cadastros Base /
// Pessoas, execução 024, TASK-FE-430). Espelha a convenção do módulo de
// Classes de Produto (module-kinds). O conteúdo mora em
// src/constants/languages/{idioma}/languageAfiliados.ts.

export interface ModuleAfiliados {
  partner: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    status: {
      enabled: string;
      blocked: string;
      cancelled: string;
    };
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        nif: string;
        phone: string;
        status: string;
        dtAffiliation: string;
        dueDate: string;
        dueDateIndeterminate: string;
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
      status: string;
      statusAll: string;
    };
    form: {
      title: { create: string; edit: string };
      subtitle: { create: string; edit: string };
      fields: {
        nif: string;
        nickname: string;
        name: string;
        email: string;
        phone: string;
        cellphone: string;
        zipCode: string;
        address: string;
        city: string;
        contact: string;
        contactPhone: string;
        status: string;
        dtAffiliation: string;
        commission: string;
        dueDate: string;
        qtdFarms: string;
        businessRule: string;
        note: string;
        contractFile: string;
      };
      placeholders: {
        nickname: string;
        name: string;
        email: string;
        address: string;
        city: string;
      };
      hints: {
        cityRequired: string;
      };
      validation: {
        nifRequired: string;
        nifInvalid: string;
        nicknameRequired: string;
        nicknameMaxLength: string;
        nameRequired: string;
        nameMaxLength: string;
        emailRequired: string;
        emailInvalid: string;
        emailMaxLength: string;
        phoneRequired: string;
        addressRequired: string;
        addressMaxLength: string;
        cityRequired: string;
        statusRequired: string;
        dtAffiliationRequired: string;
        commissionRequired: string;
        commissionInvalid: string;
        commissionMin: string;
        qtdFarmsRequired: string;
        qtdFarmsInvalid: string;
        qtdFarmsMin: string;
      };
      contractFile: {
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        changeLabel: string;
        removeLabel: string;
        replaceLabel: string;
        errorType: string;
        errorSize: string;
        existingFileLabel: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
  };
}
