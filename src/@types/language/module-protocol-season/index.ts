// src/@types/language/module-protocol-season/index.ts
// Interface de tradução do módulo "Protocolos/Estação" (ProtocolSeason —
// Operacional / Reprodução, F-057, execução 040, TASK-FE-1050..1059). Mirror
// da convenção de `module-breeding-batch`/`module-breeding-seasons`
// (instância simples: um único arquivo, sem decomposição por tela). O
// conteúdo mora em src/constants/languages/{idioma}/languageProtocolSeason.ts.

export interface ModuleProtocolSeason {
  protocolSeason: {
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
        name: string;
        date: string;
        responsible: string;
        breedingSeason: string;
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
        name: string;
        namePlaceholder: string;
        responsible: string;
        breedingSeason: string;
        startDate: string;
        endDate: string;
      };
      deleteDialog: {
        title: string;
        description: string;
        warning: string;
      };
      /** CORRIGIDO/mirror `BUSINESS_RULE_ERROR_MESSAGES` (contrato §4.1) —
       *  toast de negócio dedicado quando o `DELETE` responde 409
       *  (`breeding_matings` vinculadas), nunca o erro genérico. */
      deleteBusinessErrorToast: {
        title: string;
        description: string;
      };
    };
    detail: {
      title: string;
      backButton: string;
      editButton: string;
      sections: {
        generalData: string;
        timeline: string;
      };
      fields: {
        code: string;
        date: string;
        responsible: string;
        breedingSeason: string;
        name: string;
        description: string;
      };
      notFound: { title: string; description: string };
      invalidParamsToast: { title: string; description: string };
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        code: string;
        date: string;
        responsible: string;
        breedingSeason: string;
        name: string;
        description: string;
      };
      validation: {
        dateRequired: string;
        breedingSeasonRequired: string;
        nameRequired: string;
        itemDateRequired: string;
        itemTimeRequired: string;
        productOrServiceRequired: string;
        measurementRequired: string;
        quantityRequired: string;
        quantityExceedsStock: string;
        itemsMinOne: string;
        itemDateBeforeDzero: string;
      };
      items: {
        sectionTitle: string;
        fields: {
          identification: string;
          date: string;
          time: string;
          warehouse: string;
          product: string;
          service: string;
          measurement: string;
          stock: string;
          quantity: string;
        };
        addButton: string;
        removeButton: string;
        removeDialog: { title: string; description: string; confirmButton: string };
      };
      timelinePreview: {
        title: string;
        empty: string;
      };
      unsavedChangesDialog: { title: string; description: string; confirmButton: string };
    };
    timeline: {
      /** 7 rótulos, índice = `Date.getDay()` (0=domingo..6=sábado). */
      weekdays: [string, string, string, string, string, string, string];
      emptyState: { title: string; description: string };
      /** Separador entre produto e serviço quando ambos coexistem na mesma linha (FID-G1 Q5). */
      andSeparator: string;
    };
    services: {
      insemination: string;
      ultrasound: string;
      pregnancyDiagnosis: string;
      implantRemoval: string;
    };
  };
}
