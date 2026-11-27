// src/@types/language/module-service-types/index.ts
// Interface de tradução do PROTÓTIPO de Tipos de serviço e Serviços (27/11/2026, não portar).
// "Tipos de serviço" é o antigo cadastro de Operações; "Serviços" é o de Atividades.
// O conteúdo mora em src/constants/languages/{idioma}/languageServiceTypes.ts.

interface ListEmptyState {
  titleEmpty: string;
  descriptionEmpty: string;
  titleFiltered: string;
  descriptionFiltered: string;
  cta: string;
}

interface EnabledOptions {
  active: string;
  inactive: string;
}

export interface ServiceTypeParamLabels {
  requiresHarvest: string;
  requiresCultivation: string;
  requiresBatch: string;
  requiresUsedArea: string;
  requiredLabor: string;
  requiredMachines: string;
  requiredInputs: string;
  generatesProduction: string;
  requiresOccurrence: string;
  requiresSignature: string;
  notifyOnFinish: string;
  generatesExecution: string;
}

export interface ModuleServiceTypes {
  serviceType: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        grouper: string;
        order: string;
        use: string;
        generatesExecution: string;
        status: string;
        active: string;
        inactive: string;
        noGrouper: string;
        yes: string;
        no: string;
      };
      actions: { edit: string; delete: string };
      emptyState: ListEmptyState;
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: EnabledOptions;
      use: string;
      useAll: string;
      grouper: string;
      grouperAll: string;
      generatesExecution: string;
      generatesExecutionAll: string;
      yes: string;
      no: string;
    };
    useOptions: { both: string; agriculture: string; livestock: string };
    form: {
      title: { create: string; edit: string };
      fields: {
        name: string;
        description: string;
        order: string;
        isEnabled: string;
        grouper: string;
        use: string;
        minPhotos: string;
        textMin: string;
        textMax: string;
      };
      placeholders: { name: string; description: string; grouper: string };
      sections: {
        appointment: string;
        appointmentHint: string;
        entries: string;
        entriesHint: string;
        execution: string;
        executionHint: string;
        preview: string;
      };
      params: ServiceTypeParamLabels;
      hints: ServiceTypeParamLabels;
      notApplicable: string;
      executionYes: string;
      executionNo: string;
      preview: {
        intro: string;
        empty: string;
        items: {
          harvest: string;
          cultivation: string;
          batch: string;
          usedArea: string;
          labor: string;
          machines: string;
          inputs: string;
          production: string;
          occurrence: string;
          signature: string;
          notify: string;
        };
        photos: string;
        textRange: string;
        textMin: string;
        textMax: string;
      };
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionMaxLength: string;
        textMaxLessThanMin: string;
        minPhotosNegative: string;
        textNegative: string;
      };
    };
  };
  service: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        name: string;
        description: string;
        serviceTypes: string;
        status: string;
        active: string;
        inactive: string;
        noTypes: string;
      };
      actions: { edit: string; delete: string };
      emptyState: ListEmptyState;
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      serviceType: string;
      serviceTypeAll: string;
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: EnabledOptions;
    };
    form: {
      title: { create: string; edit: string };
      fields: {
        name: string;
        description: string;
        isEnabled: string;
        serviceTypes: string;
      };
      placeholders: { name: string; description: string; serviceTypesSearch: string };
      serviceTypesHint: string;
      serviceTypesSelected: string;
      selectAll: string;
      deselectAll: string;
      serviceTypesEmpty: string;
      validation: {
        nameRequired: string;
        nameMaxLength: string;
        descriptionMaxLength: string;
        serviceTypesRequired: string;
      };
    };
  };
}
