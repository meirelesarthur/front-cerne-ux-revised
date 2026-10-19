// src/@types/language/module-request-authorizers/index.ts
// Interface de tradução do módulo de AUTORIZADORES (RequestAuthorizer —
// Cadastros Base / Pessoas). Espelha a convenção do módulo de Centros de
// Custo (module-cost-centers). O conteúdo mora em
// src/constants/languages/{idioma}/languageRequestAuthorizers.ts.
//
// SLICE 1 (Lote 06 / esteira 089, Frente C, F-141) cobriu `list` + `filter`
// (listagem/exclusão/visibilidade). SLICE 2 (mesmo lote/esteira, frente C)
// ACRESCENTA `form` (criação/edição, incl. as 2 seções repetíveis
// `farms`/`rules`) — aditivo, `list`/`filter` inalterados.

export interface ModuleRequestAuthorizers {
  requestAuthorizer: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      createdToast: string;
      updatedToast: string;
      deleteConfirm: {
        title: string;
        text: string;
      };
      table: {
        user: string;
        maxValue: string;
        maxValueUpTo: string;
        createdAt: string;
        numberQuotes: string;
        expenseOrganizer: string;
        isConditional: string;
        isActive: string;
        farms: string;
        farmsCount: string;
        active: string;
        inactive: string;
        yes: string;
        no: string;
      };
      actions: {
        /** Abre a tela Visualizar (`.../:uuid/visualizar`, exige só `request-authorizers_view`). */
        view: string;
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
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
    };
    form: {
      title: {
        create: string;
        edit: string;
        view: string;
      };
      subtitle: {
        create: string;
        edit: string;
        view: string;
      };
      fields: {
        userUuid: string;
        maxValue: string;
        numberQuotes: string;
        isActive: string;
        expenseOrganizer: string;
        isConditional: string;
        responsible: string;
        creationDate: string;
        lastUpdate: string;
      };
      placeholders: {
        userUuid: string;
      };
      hints: {
        maxValue: string;
      };
      farms: {
        sectionTitle: string;
        sectionHint: string;
        addRowLabel: string;
        removeRowLabel: string;
        emptyTitle: string;
        removeConfirm: {
          title: string;
          text: string;
        };
        incompleteRow: string;
        minOneItem: string;
        levelPlaceholder: string;
        fields: {
          farm: string;
          level: string;
        };
        placeholders: {
          farm: string;
        };
      };
      rules: {
        sectionTitle: string;
        sectionHint: string;
        addRowLabel: string;
        removeRowLabel: string;
        emptyTitle: string;
        fields: {
          type: string;
          value: string;
          applyOn: string;
        };
        placeholders: {
          value: string;
        };
        typeOptions: {
          requestPurchase: string;
        };
        valueOptions: {
          all: string;
        };
        applyOnOptions: {
          before: string;
          after: string;
        };
      };
      validation: {
        userRequired: string;
        maxValueRequired: string;
        maxValueRange: string;
        numberQuotesRequired: string;
        numberQuotesMin: string;
        farmsRequired: string;
        farmFarmRequired: string;
        farmLevelRequired: string;
        farmLevelRange: string;
        rulesRequired: string;
        ruleTypeRequired: string;
        ruleValueRequired: string;
        ruleApplyOnRequired: string;
      };
    };
  };
}
