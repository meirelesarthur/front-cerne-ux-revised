// src/@types/language/module-plan-accounts/index.ts
// Interface de tradução do módulo de PLANO DE CONTAS (Cadastros Base).
// Espelha a convenção do módulo de Centros de Custo (module-cost-centers). O
// conteúdo mora em src/constants/languages/{idioma}/languagePlanAccounts.ts.
//
// TASK-PA-03a (listagem) cobriu `list` + `filter`. Esta Tarefa (TASK-PA-03b,
// formulário create/edit + categorias) adiciona a seção `form` abaixo, sem
// alterar o que já existia. `condition`/`type` do formulário REAPROVEITAM os
// rótulos já existentes em `filter.conditionOptions`/`filter.typeOptions`
// (mesmo precedente documentado em `CreateOrUpdateCentroCusto.tsx` — "Reaproveita
// as strings de filter.typeOptions") — por isso não duplicam chaves aqui.

export interface ModulePlanAccounts {
  planAccount: {
    singularLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      /** Toast genérico do toggle rápido Ativar/Inativar na linha da grid (TASK-PA-09) — não diferenciado por direção. */
      statusUpdatedToast: string;
      table: {
        code: string;
        class: string;
        condition: string;
        description: string;
        type: string;
        active: string;
        activeLabel: string;
        inactiveLabel: string;
      };
      actions: {
        edit: string;
        viewSubaccounts: string;
        createDescendant: string;
        /** Rótulo do item de menu quando a conta está ATIVA (TASK-PA-09 — clique inativa). */
        deactivate: string;
        /** Rótulo do item de menu quando a conta está INATIVA (TASK-PA-09 — clique ativa). */
        activate: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        /** Variação sem CTA para quem não pode criar conta (não tem `plan-accounts_create`). */
        titleEmptyNoCreate: string;
        descriptionEmptyNoCreate: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      /** Botão "Saiba mais" (TASK-PA-10) — modal informativo estático, sem fetch. */
      helpButton: string;
      helpTitle: string;
      helpIntro: string;
      helpItems: {
        synthetic: { term: string; description: string };
        analytical: { term: string; description: string };
        condition: { term: string; description: string };
        deactivate: { term: string; description: string };
      };
      helpUnderstood: string;
    };
    filter: {
      title: string;
      search: string;
      searchPlaceholder: string;
      condition: string;
      conditionAll: string;
      conditionOptions: {
        debtor: string;
        creditor: string;
        both: string;
      };
      class: string;
      classAll: string;
      classOptions: {
        synthetic: string;
        analytical: string;
      };
      type: string;
      typeAll: string;
      typeOptions: {
        capex: string;
        opex: string;
      };
      isEnabled: string;
      isEnabledAll: string;
      enabledOptions: {
        active: string;
        inactive: string;
      };
      parentUuid: string;
      parentUuidPlaceholder: string;
    };
    /** Formulário de criação/edição (TASK-PA-03b) — campos centrais + categorias financeiras (multi-select real). */
    form: {
      title: { create: string; edit: string; createDescendant: string };
      subtitle: { create: string; edit: string; createDescendant: string };
      fields: {
        description: string;
        condition: string;
        isEnabled: string;
        type: string;
        parentUuid: string;
        code: string;
        class: string;
        categories: string;
      };
      placeholders: {
        description: string;
        parentUuid: string;
        categoriesSearch: string;
      };
      hints: {
        parentUuidImmutable: string;
        parentUuidCreate: string;
        /** Modo "criar subconta" (`novo/:parentUuid`) — antecessor pré-fixado, imutável. */
        parentUuidFixedDescendant: string;
        codeGenerated: string;
        classPreviewBadge: string;
      };
      classLabels: {
        synthetic: string;
        analytical: string;
      };
      /**
       * Seção de Categorias Financeiras (`category_uuids`) — picker antigo
       * (`SelectAsyncPaginate` + badges, TASK-PA-03b). Mantido intocado
       * mesmo após a árvore (TASK-PA-16) substituir o card no JSX — não é
       * objetivo desta Tarefa limpar i18n órfão, só não adicionar lixo novo.
       */
      categories: {
        empty: string;
        removeLabel: string;
      };
      /**
       * Árvore tri-state do card "Categorias Financeiras" (TASK-PA-16, Opção
       * C do ROTEIRO-05) — fiel a `CategoryTreeField.tsx` do UX oficial. O
       * contador "N selecionada(s)" REAPROVEITA
       * `common.aleexAssistant.vulnerabilitiesPanel.selectedCount`, não
       * duplicado aqui.
       */
      categoriesTree: {
        expandAll: string;
        collapseAll: string;
        selectAll: string;
        deselectAll: string;
        /** Grupo Sintético sem nenhuma folha do tenant atual. */
        emptyGroup: string;
        /** Árvore inteira sem nenhum grupo (universo vazio). */
        noCategories: string;
      };
      /** Banner do antecessor no modo "criar subconta" (`GET /plan-accounts/{parentUuid}`). */
      parentPreview: {
        loading: string;
        errorTitle: string;
        errorDescription: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        conditionRequired: string;
      };
    };
    /** Ações de Excel no header da listagem (TASK-PA-07) — download síncrono via blob, sem formulário. */
    excel: {
      downloadTemplate: string;
      export: string;
      downloadTemplateError: string;
      exportError: string;
      /**
       * Modal de importação (TASK-PA-08) — máquina de estados
       * upload→resultado/erro. `warning.*` reflete a EXCLUSÃO SEGURA real do
       * backend (DEC-016/TASK-PA-06) — NÃO o texto de "substitui todo o
       * plano de contas" do mock UX (Achado 1 da Tarefa, correção
       * obrigatória de conteúdo).
       */
      import: {
        menuLabel: string;
        title: string;
        subtitle: string;
        instructions: string;
        warning: {
          title: string;
          description: string;
        };
        downloadShortcut: string;
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
        cancelButton: string;
        submitButton: string;
        importSuccessToast: string;
        result: {
          created: string;
          updated: string;
          deleted: string;
          preservedTitle: string;
        };
        rowErrors: {
          title: string;
        };
        closeButton: string;
      };
    };
    /** "Imprimir relatório" (TASK-PA-12) — HTML client-side, todas as páginas, sem filtro. */
    report: {
      tooltip: string;
      documentTitle: string;
      metaCountSingular: string;
      metaCountPlural: string;
      errorToast: string;
      popupBlockedToast: string;
    };
  };
}
