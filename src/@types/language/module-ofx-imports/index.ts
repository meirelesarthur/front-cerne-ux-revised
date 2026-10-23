// src/@types/language/module-ofx-imports/index.ts
// Interface de tradução do módulo "Importação OFX" (OfxImport — Financeiro,
// F-114, 97-Esteiras/064, TASK-064-OFX-FE-01). Mirror estrutural de
// `module-movements` (list/filter/form + chave TOP-LEVEL `ofxImport`,
// singular — mesma convenção de `movements.movement`). O conteúdo mora em
// src/constants/languages/{idioma}/languageOfxImports.ts.
//
// Escopo desta interface: Hub/listagem (SURF-000/010/011/012/013) + form
// único create/edit/view (SURF-020/030/040/041, Decisão F1/F2) + excluir
// (SURF-050). A aba/rota de Conciliação (SURF-060+) é TASK-064-OFX-FE-02 —
// NÃO tem chaves aqui ainda (extensão aditiva futura, mirror
// `module-movements` que também ganhou `allocation` só na Tarefa dedicada).

export interface ModuleOfxImports {
  ofxImport: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      searchPlaceholder: string;
      table: {
        code: string;
        description: string;
        account: string;
        startDate: string;
        endDate: string;
      };
      actions: {
        view: string;
        edit: string;
        reconcile: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      deleteConfirm: {
        title: string;
        description: string;
      };
    };
    filter: {
      title: string;
      description: string;
      account: string;
      accountPlaceholder: string;
      startDate: string;
      endDate: string;
    };
    /** Formulário único create/edit/view (Decisão F1) — `code` só aparece
     *  em modo edição/visualização (Decisão F2, nunca previsto na criação). */
    form: {
      title: { create: string; edit: string; view: string };
      subtitle: { create: string; edit: string; view: string };
      fields: {
        code: string;
        description: string;
        account: string;
        startDate: string;
        endDate: string;
        ofxFile: string;
      };
      placeholders: {
        account: string;
      };
      fileUpload: {
        dropzoneTitle: string;
        dropzoneDraggingTitle: string;
        hint: string;
        changeLabel: string;
        removeLabel: string;
        replaceLabel: string;
        existingFileLabel: string;
        errorTypeMessage: string;
        errorSizeMessage: string;
      };
      actions: {
        download: string;
        downloadError: string;
      };
      validation: {
        descriptionRequired: string;
        descriptionMaxLength: string;
        accountRequired: string;
        startDateRequired: string;
        endDateRequired: string;
        ofxFileRequired: string;
      };
    };
    /** Conciliação bancária (TASK-064-OFX-FE-02) — workspace SURF-060/069,
     *  cards de totalização (SURF-061), busca client-side (SURF-062,
     *  Decisão F4), banner de lote de investimentos (SURF-063) e os 2
     *  modais de vínculo (novo movimento / writeoff despesa-receita). */
    reconciliation: {
      pageTitlePrefix: string;
      backToHub: string;
      loadError: string;
      workspace: {
        summary: {
          entries: string;
          exits: string;
          reconciled: string;
          progress: string;
          transactions: string;
          ofReconciled: string;
        };
        tabs: {
          review: string;
          ready: string;
          noMatch: string;
          reconciled: string;
        };
        chips: {
          ready: string;
          noMatch: string;
          reconciled: string;
        };
        kinds: {
          entry: string;
          exit: string;
        };
        detail: {
          emptyTitle: string;
          emptyBody: string;
          readyTitle: string;
          readyBody: string;
          noMatchTitle: string;
          noMatchBody: string;
          reconciledTitle: string;
          reconciledBody: string;
          confirmOne: string;
          confirmAction: string;
          confirmDialogTitle: string;
          confirmDialogDescription: string;
          emptyTab: string;
          emptyTabHint: string;
          allDoneTitle: string;
          allDoneHint: string;
        };
      };
      cards: {
        total: string;
        matched: string;
        pending: string;
        progress: string;
      };
      search: {
        placeholder: string;
      };
      status: {
        reconciled: string;
        matchedPendingApply: string;
        pending: string;
      };
      classification: {
        investment: string;
        redemption: string;
        common: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      actions: {
        apply: string;
        applySuccess: string;
        applyNothingToApply: string;
        applyError: string;
        linkTitle: string;
        createMovement: string;
        unreconcile: string;
        unreconcileConfirmTitle: string;
        unreconcileConfirmDescription: string;
        unreconcileSuccess: string;
        unreconcileError: string;
      };
      investmentBanner: {
        title: string;
        description: string;
        cta: string;
        modalTitle: string;
        modalDescription: string;
        missingInvestmentAccount: string;
        columnMemo: string;
        columnDate: string;
        columnValue: string;
        confirmButton: string;
        successToast: string;
        partialErrorToast: string;
      };
      newMovementModal: {
        title: string;
        hint: string;
        typeCategoryLabel: string;
        submitButton: string;
        successToast: string;
      };
      writeoffModal: {
        expenseTitle: string;
        incomeTitle: string;
        hint: string;
        providerLabel: string;
        providerPlaceholder: string;
        clientLabel: string;
        clientPlaceholder: string;
        dueDateFrom: string;
        dueDateTo: string;
        columnSelect: string;
        columnNumber: string;
        columnDueDate: string;
        columnBalance: string;
        emptyTitles: string;
        selectPartyHint: string;
        selectAtLeastOneError: string;
        continueButton: string;
        selectedTotalLabel: string;
      };
    };
    /** "Meses Conciliados" (TASK-065-OFX-FE-03) — agregação mensal
     *  READ-ONLY de `GET /ofx-imports/report`, SEM filtro/export (o
     *  endpoint não os oferece, escopo reduzido frente à tela DELES
     *  descartada). Item de menu `fin-cnc-mes` (`navigationTree.ts`). */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        monthYear: string;
        quantity: string;
      };
      loadError: string;
      retry: string;
      emptyState: {
        title: string;
        description: string;
      };
    };
  };
}
